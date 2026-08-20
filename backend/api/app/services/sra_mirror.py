"""SRA-DuckDB mirror service.

Wraps a read-only DuckDB connection to a local mirror of SRA run metadata.
The mirror is built externally -- a taxdump-resolved ingest from the public
SRA metadata parquet, filtered to BRC-relevant organisms -- and includes a
`taxid_names` table for taxid-anchored name resolution plus a `mirror_meta`
table for provenance metadata.
"""

from __future__ import annotations

import copy
import datetime
import functools
import hashlib
import logging
import os
import re
import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple

import duckdb

logger = logging.getLogger(__name__)

# In-process per-call TTL for repeated reads (e.g. the assistant chatting
# about the same organism across turns). DuckDB queries are already fast
# but `summary_for_organism` runs ~6 aggregates -- caching collapses that
# to a hashmap hit for the second-and-later asks in a session. Tool calls
# are sync; on the assistant path they run on the event loop thread, but
# FastMCP offloads the MCP tools to a worker threadpool, so the shared
# DuckDB connection and this dict are reachable from multiple threads and
# are guarded by self._lock (see the @_synchronized decorator).
_CACHE_TTL_SECONDS = 300
# Cap the entry count so a long-lived worker can't grow the cache without
# bound -- the search key is a 7-tuple, so the keyspace is effectively open.
_CACHE_MAX_ENTRIES = 512

# Batch size for accession lookups. Callers annotate one page of search hits
# at a time; this keeps any single IN list bounded. It is a chunk size, not a
# ceiling on how many accessions a caller may ask about -- see
# runs_by_accession, which loops rather than truncating.
_ACCESSION_BATCH_SIZE = 500

# Facets computed over a whole pre-cap hit set, as (name, expression over
# `runs`). Which columns earn a facet is a property of the data, measured
# mirror-wide over all 43,522,611 runs rather than guessed: librarylayout (2
# distinct) is the only one that lists in full; assay_type (44), platform
# (21), instrument (110) and country (246) list a head and roll the tail into
# `other`. Cardinality alone does not say how much that tail hides -- a head
# of ten covers 99.95% of mirror rows for platform but only 85.87% for
# instrument -- which is why `other` is always emitted and always reconciles
# against in_mirror instead of being dropped. organism is deliberately not
# here: 296,175 distinct values, 453 of them needed to reach 90%, and `runs`
# carries no taxid to roll them up with, so it ships as a distinct count plus
# a top-10 list instead. Same for bioproject and sra_study, drill-downs at
# ~688,000 and ~702,000 values.
_COHORT_FACETS: Tuple[Tuple[str, str], ...] = (
    ("assay_type", "nullif(assay_type, '')"),
    ("platform", "nullif(platform, '')"),
    ("librarylayout", "nullif(librarylayout, '')"),
    # 'unspecified' is SRA's literal sentinel for "no instrument was
    # recorded", not a machine -- the same mistake as 'uncalculated' below.
    # instrument carries no NULLs and no empty strings anywhere in the mirror,
    # so without this the facet's `unknown` is structurally always 0, which
    # asserts every matched run has a recorded instrument. The sentinel is
    # 245,944 rows mirror-wide and 9,913 on the measured job, where it
    # rendered as the 9th most common sequencing instrument.
    ("instrument", "nullif(nullif(instrument, ''), 'unspecified')"),
    # 'uncalculated' is SRA's literal sentinel for "no country could be
    # derived", not a place. It is 46,248 rows on the measured job -- third
    # place, ahead of Canada -- so treating it as a value would invent a
    # country. It belongs in `unknown` alongside the NULLs.
    ("country", "nullif(nullif(geo_loc_name_country_calc, ''), 'uncalculated')"),
    ("release_year", "CAST(year(releasedate) AS VARCHAR)"),
)

# Values each facet names before the rest become `other`, and how many
# organisms the cohort lists. Ten of each keeps the whole cohort ~3 KB on
# the wire, against the 50,000 hit rows it is describing.
_COHORT_FACET_VALUES = 10
_COHORT_TOP_ORGANISMS = 10

# Tag on the scalar rows of the cohort query, which shares its result set with
# the facet rows. Empty rather than a name so it cannot collide with a facet.
_COHORT_SCALAR_TAG = ""

# Status of a search's materialized export, recorded on the cached aggregate.
# The two failing states are kept apart all the way to the UI because they mean
# different things to whoever is looking at it: the mirror or the export
# directory being unconfigured is our deployment and nobody's business, while
# the row ceiling is a property of their query and the one they can act on.
EXPORT_AVAILABLE = "available"
EXPORT_TOO_LARGE = "too_large"
EXPORT_UNAVAILABLE = "unavailable"

# Ceiling on what will be materialized, in hit rows. Above it the export is
# skipped and the search says so, rather than the cost being discovered in
# production.
#
# Measured against the real mirror: the 1,133,516-hit job is 13.8 B/row
# parquet and 148 B/row TSV, 1.4s to stage and write, 2.9s of CPU to stream
# the TSV back; the eight-index probe at 1,514,202 rows is 15.1 B/row, 2.0s
# and 3.8s. Index sizes are enormously skewed -- AMPLICON alone is ~17.9M SRA
# runs -- so a pathological selection is an order of magnitude past that. 5M
# is ~3.3x the largest measured probe and holds the artifact to ~75 MB parquet
# / ~740 MB TSV and the write to ~7s, which matters because the write happens
# inside the process-wide aggregation lock where it delays every other user's
# search. Past that a browser download stops being a useful way to move the
# data anyway.
EXPORT_MAX_ROWS = 5_000_000

# Retention. Exports are ~16 MB each and nothing else ever deletes them.
#
# The age rule is the correctness anchor, not a guess: it is CacheTTL.ONE_DAY,
# the TTL on the aggregate that carries the "there is an export" claim. Once
# that entry expires nothing can still be pointing at the file, and the next
# request re-aggregates and writes a fresh one. The byte budget is the disk
# bound the age rule does not give -- a burst of searches inside one day would
# otherwise fill the volume -- and it is expressed in bytes rather than files
# because file size varies 5x with the row ceiling.
EXPORT_MAX_AGE_SECONDS = 86400
EXPORT_MAX_TOTAL_BYTES = 5 * 1024**3

# Columns in a materialized export, in order. The parquet carries its own
# names; this is the TSV header and the structural check that the two agree.
EXPORT_COLUMNS: Tuple[str, ...] = (
    "accession",
    "score",
    "shard",
    "organism",
    "assay_type",
    "platform",
    "instrument",
    "library_layout",
    "release_date",
    "country",
    "bioproject",
    "study",
    "mbases",
)

_EXPORT_SUFFIX = ".parquet"
# A destination is written under this and renamed into place, so a COPY that
# dies partway through cannot leave something that reads as a finished export.
_EXPORT_PARTIAL_SUFFIX = ".partial"
# Job ids arrive in a request path and become a filename here, which is the
# only place that happens -- so constrain the shape rather than trust it.
_EXPORT_JOB_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
# What the sweep is allowed to delete. The export directory may hold files
# nobody here wrote, and retention must not reach them.
_EXPORT_OWNED = re.compile(
    r"^[A-Za-z0-9_-]{1,64}"
    rf"{re.escape(_EXPORT_SUFFIX)}({re.escape(_EXPORT_PARTIAL_SUFFIX)})?$"
)
# An in-flight write is seconds, so anything wearing the partial suffix an hour
# later is an orphan from a crash rather than a rename that has not happened.
_EXPORT_PARTIAL_MAX_AGE_SECONDS = 3600
# Rows pulled out of the parquet per step while streaming a TSV back. Bounds
# the memory the conversion holds regardless of how many rows it is converting.
_EXPORT_TSV_BATCH = 20000
# A TSV field needs quoting only if it carries the delimiter, a line break or a
# quote. One compiled scan per field rather than five `in` tests: measured 3.0s
# against 4.9s over 14.7M fields.
_EXPORT_TSV_QUOTE = re.compile(r'[\t\n\r"]')


# Curated abbreviations and colloquial names. NCBI's taxonomy `names.dmp`
# has scientific names and a thicket of historical synonyms, but it
# generally does not list lay abbreviations like "SARS-CoV-2" or "TB" --
# so the model passes those through unchanged and our taxid_names lookup
# misses. Each alias here maps to the BRC catalog organism taxid; the
# full SRA name union is expanded from taxid_names as usual at resolve
# time, so a single alias entry transparently covers every SRA name
# variant attached to that taxid. Keys are stored lowercase; the lookup
# lower-cases the user term.
#
# Verified 2026-05-24: every taxid here resolves to a catalog organism
# with non-zero runs in the mirror. NCBI's 2024 ICTV-aligned virus
# renames produced new species-level taxids (HIV-1 = 3418650, not the
# old 11676, etc.) -- using the new ones.
_ORGANISM_ALIASES: Dict[str, int] = {
    # Viruses
    "sars-cov-2": 3418604,
    "sars cov 2": 3418604,
    "sarscov2": 3418604,
    "covid": 3418604,
    "covid-19": 3418604,
    "hiv": 3418650,  # default to HIV-1, the dominant case in SRA
    "hiv-1": 3418650,
    "hiv1": 3418650,
    "hiv-2": 3418651,
    "hbv": 3431302,
    "hcv": 3052230,
    "ebv": 3050299,
    "wnv": 3048448,
    "zikv": 3048459,
    "mpxv": 3431483,
    "mpox": 3431483,
    "ebola": 3052462,
    "ebov": 3052462,
    # Bacteria
    "tb": 1773,
    "mtb": 1773,
    "m. tuberculosis": 1773,
    "m.tuberculosis": 1773,
    "k. pneumoniae": 573,
    "k.pneumoniae": 573,
    "s. aureus": 1280,
    "s.aureus": 1280,
    "e. coli": 562,
    "e.coli": 562,
    # Apicomplexa
    "p. falciparum": 5833,
    "p.falciparum": 5833,
    "p. vivax": 5855,
    "p.vivax": 5855,
    # Fungi
    "c. auris": 498019,
    "c.auris": 498019,
    "c. albicans": 5476,
    "c.albicans": 5476,
    "a. fumigatus": 746128,
    "a.fumigatus": 746128,
    # Model organisms also present as BRC catalog entries
    "s. cerevisiae": 4932,
    "s.cerevisiae": 4932,
    "d. melanogaster": 7227,
    "d.melanogaster": 7227,
}


# Common abbreviations / colloquial names -> the normalized forms NCBI uses
# in geo_loc_name_country_calc. Keys and values are lowercased; the lookup
# lowercases the user term. Matching is case-insensitive regardless, so this
# only needs to cover genuine abbreviation/synonym gaps, not casing.
_COUNTRY_SYNONYMS: Dict[str, List[str]] = {
    "uk": ["united kingdom"],
    "u.k.": ["united kingdom"],
    "great britain": ["united kingdom"],
    "england": ["united kingdom"],
    "usa": ["united states", "usa"],
    "us": ["united states", "usa"],
    "u.s.": ["united states", "usa"],
    "u.s.a.": ["united states", "usa"],
    "united states of america": ["united states", "usa"],
    "uae": ["united arab emirates"],
    "drc": ["democratic republic of the congo"],
    "south korea": ["south korea", "republic of korea"],
    "north korea": ["north korea", "democratic people's republic of korea"],
}


def _norm_organism(organism: str) -> str:
    """Collapse casing and whitespace for use as a cache key, so
    "Plasmodium falciparum", "plasmodium  falciparum" and "  ... " share one
    entry instead of each triggering a full aggregate."""
    return " ".join(organism.strip().lower().split())


def _norm_filter(value: Optional[str]) -> Optional[str]:
    """Normalize an optional filter value (assay/platform/country) for the
    cache key, so equivalent casings share one entry -- matches the
    case-insensitive comparison the SQL now does for these columns."""
    return " ".join(value.strip().lower().split()) if value else value


def _country_candidates(country: str) -> List[str]:
    """Lowercased candidate names to match a user country term against.

    Always includes the term itself (so case-insensitive matching works) plus
    any known synonyms, so 'UK' finds 'United Kingdom' and 'kenya' finds
    'Kenya' -- the old exact `=` match silently returned nothing for both.
    """
    key = " ".join(country.strip().lower().split())
    candidates = {key}
    candidates.update(_COUNTRY_SYNONYMS.get(key, []))
    return list(candidates)


def _normalize_since(value: str) -> Optional[str]:
    """Normalize a `since` filter to an ISO date string, or None if invalid.

    Accepts YYYY, YYYY-MM, or YYYY-MM-DD (coercing the first two to the first
    day of the period). Returns None for anything that isn't a real date so
    the caller can reply politely instead of handing 'last year' to DuckDB,
    which raises a conversion error that escapes the tool turn.
    """
    s = value.strip()
    if len(s) == 4 and s.isdigit():
        s = f"{s}-01-01"
    elif len(s) == 7 and s[:4].isdigit() and s[4] == "-" and s[5:7].isdigit():
        s = f"{s}-01"
    try:
        datetime.date.fromisoformat(s)
    except ValueError:
        return None
    return s


def _cohort_sql() -> str:
    """The whole cohort -- six facets, four distinct counts, a row count and a
    top-organism list -- as one statement over one join.

    One statement rather than ten because the join is the expensive part: the
    same work split across separate statements measured 1.44s against 0.34s
    for this, on the real 1,133,516-accession job. The accession set arrives
    as a staging file read inline, not as a bound list: `acc IN (SELECT
    UNNEST(?))` is fine for the 25-row page runs_by_accession serves but
    degrades badly with size -- 2.3s at 50,000 and still running after two
    minutes at 1.13M, where read_csv is 0.32s. read_csv also keeps the whole
    statement a pure read, which matters because the mirror is opened
    read_only and CREATE TEMP TABLE is therefore unavailable (and there is no
    pyarrow/pandas to register a frame with either).

    Distinct counts are the other reason this cannot be batched: they do not
    merge across chunks, so a chunked count(DISTINCT organism) would be
    plausible and wrong.

    Quote and escape handling is turned off so every staged line is one value
    verbatim. Accessions never contain a quote character, but if one ever did
    the default reader would not error -- it would quietly answer a different
    question. Measured on duckdb 1.5.4: a quote paired with another one d
    lines later reads the span between them as a single field and drops
    exactly d accessions (60,000 staged lines with quotes 100 apart read back
    59,900), and a value the reader does keep can still be rewritten, with
    "SRR1" read as SRR1 and "" as NULL. Whether the drop happens depends on
    where in the file the quotes fall -- the same pair 10,000 lines apart in a
    20,000-line file read back intact -- so this is hardening against a silent
    and position-dependent failure, not a certain one. Cheap either way, and
    the one failure mode a trustworthy count cannot have.
    """
    projection = ",\n                   ".join(
        f"{expr} AS {name}" for name, expr in _COHORT_FACETS
    )
    facet_selects = "\n        ".join(
        f"UNION ALL SELECT '{name}', {name}, count(*) FROM m GROUP BY 2"
        for name, _expr in _COHORT_FACETS
    )
    tag = _COHORT_SCALAR_TAG
    return f"""
        WITH q AS (SELECT column0 AS acc FROM read_csv(?, header=false,
                       quote='', escape='',
                       columns={{'column0':'VARCHAR'}})),
             m AS (
               SELECT {projection},
                      nullif(organism, '') AS organism, bioproject, sra_study
               FROM runs r SEMI JOIN q ON r.acc = q.acc)
        SELECT '{tag}' AS facet, 'in_mirror' AS value, count(*) AS n FROM m
        UNION ALL SELECT '{tag}', 'organisms', count(DISTINCT organism) FROM m
        UNION ALL SELECT '{tag}', 'bioprojects', count(DISTINCT bioproject) FROM m
        UNION ALL SELECT '{tag}', 'studies', count(DISTINCT sra_study) FROM m
        UNION ALL SELECT '{tag}', 'countries', count(DISTINCT country) FROM m
        {facet_selects}
        UNION ALL SELECT 'organism', organism, n FROM (
            SELECT organism, count(*) AS n FROM m WHERE organism IS NOT NULL
            GROUP BY 1 ORDER BY n DESC, organism LIMIT {_COHORT_TOP_ORGANISMS})
    """


def _shape_facet(name: str, counted: List[Tuple[Optional[str], int]]) -> Dict[str, Any]:
    """Split one facet's grouped counts into listed values, `other` and
    `unknown`.

    Every matched row lands in exactly one of the three, so a reader can
    reconcile the facet against in_mirror rather than having to trust it. NULL
    is `unknown` -- the facet expressions have already folded empty strings and
    the 'uncalculated' country sentinel into NULL, because a blank rendered as
    a value is a claim the data does not make.
    """
    unknown = sum(n for value, n in counted if value is None)
    # Ties are broken by value so the listed head is stable across runs; with
    # 1.1M rows they are rare, but "the top 10 changed" is a bad way to learn
    # that the underlying counts did not.
    known = sorted(
        ((value, n) for value, n in counted if value is not None),
        key=lambda vn: (-vn[1], vn[0]),
    )
    return {
        "name": name,
        "other": sum(n for _value, n in known[_COHORT_FACET_VALUES:]),
        "unknown": unknown,
        "values": [
            {"count": n, "value": value} for value, n in known[:_COHORT_FACET_VALUES]
        ],
    }


def _export_sql() -> str:
    """Materialize a complete hit list, joined to the mirror, as one parquet.

    The hits arrive as a staging file read inline for the same reason
    _cohort_sql stages its accessions: `IN (SELECT UNNEST(?))` degrades badly
    with size and does not finish in two minutes at a million rows, and the
    mirror is opened read_only so there is no temp table to load them into.
    Same quote and escape handling, for the same reason -- a stray quote must
    not silently rewrite or drop rows.

    LEFT, not SEMI or INNER: about 0.44% of a real job's hits are runs the
    mirror was not built to carry (1,133,516 hits, 1,128,472 of them known),
    and those rows keep their accession, score and shard with NULL metadata.
    Inner-joining would drop 5,044 real matches out of the file that exists to
    be the complete match set.

    Sentinel handling matches _COHORT_FACETS exactly, so a user tallying the
    downloaded file gets the same answer as the cohort shown on screen. SRA
    writes 'uncalculated' where no country could be derived and 'unspecified'
    where no instrument was recorded; both are absences, and a file that spells
    them as values invents a country and a sequencer.

    Rows come back in the order the app ranked them. The tie-break is an md5 of
    the accession, which SQL cannot reproduce, so the rank is staged as a
    column and ordered on -- and it costs nothing: measured 0.63s ordered
    against 0.87s unordered, and 15.6 MB against 16.1 MB, because sorting by
    score groups equal values for the compressor.

    The two paths are numbered rather than left as bare `?`: duckdb binds a
    COPY's destination ahead of the query's own parameters, so positional
    markers hand the staging path to TO and the destination to read_csv.
    """
    return """
        COPY (
          SELECT h.accession, h.score, h.shard,
                 nullif(r.organism, '') AS organism,
                 nullif(r.assay_type, '') AS assay_type,
                 nullif(r.platform, '') AS platform,
                 nullif(nullif(r.instrument, ''), 'unspecified') AS instrument,
                 nullif(r.librarylayout, '') AS library_layout,
                 r.releasedate AS release_date,
                 nullif(nullif(r.geo_loc_name_country_calc, ''),
                        'uncalculated') AS country,
                 r.bioproject, r.sra_study AS study, r.mbases
          FROM read_csv($1, delim='\t', header=false, quote='', escape='',
                   columns={'ordinal':'BIGINT','accession':'VARCHAR',
                            'score':'DOUBLE','shard':'VARCHAR'}) h
          LEFT JOIN runs r ON r.acc = h.accession
          ORDER BY h.ordinal
        ) TO $2 (FORMAT parquet, COMPRESSION zstd)
    """


def export_file_path(export_dir: str, job_id: str) -> Optional[Path]:
    """Where a job's materialized export lives.

    @param export_dir: configured export directory; empty means the feature
        is off.
    @param job_id: Galaxy job id, as it arrived in the request path.
    @returns: the path, or None when there cannot be one -- the feature is off,
        or the id is not a plain identifier and so must never become a path.
    """
    if not export_dir or not _EXPORT_JOB_ID.match(job_id):
        return None
    return Path(export_dir) / f"{job_id}{_EXPORT_SUFFIX}"


def export_download_name(job_id: str, rows: int, extension: str) -> str:
    """Filename for a downloaded export.

    Once the file is on someone's disk this name is the only description that
    travels with it, so it carries which search produced it and how many rows
    it should hold.

    @param job_id: Galaxy job the export was materialized from.
    @param rows: rows in the file.
    @param extension: file extension, without the dot.
    @returns: e.g. logan-7c937baf0758a668-1133516-runs.tsv.
    """
    return f"logan-{job_id}-{rows}-runs.{extension}"


def export_row_count(path: Path) -> int:
    """Count the rows in a materialized export.

    Read from the parquet footer rather than from the aggregate that claims the
    file exists, so the row count in a download's name describes the bytes
    being served and not a cache entry that may have outlived them.

    @param path: the export parquet.
    @returns: its row count.
    """
    con = duckdb.connect(config={"temp_directory": tempfile.gettempdir()})
    try:
        return con.execute(
            "SELECT count(*) FROM read_parquet(?)", [str(path)]
        ).fetchone()[0]
    finally:
        con.close()


def _tsv_field(value: Any) -> str:
    """Render one value as a TSV field, quoting it if it would break the row."""
    if value is None:
        return ""
    text = value if type(value) is str else str(value)
    if _EXPORT_TSV_QUOTE.search(text):
        return '"' + text.replace('"', '""') + '"'
    return text


def iter_export_tsv(path: Path) -> Iterator[bytes]:
    """Stream a materialized export back as TSV, a batch of rows at a time.

    Converting with DuckDB's own CSV writer is faster (0.57s against 3.0s on
    1.13M rows) but only writes to a file, which would mean putting 168 MB on
    disk per request and then needing a path that reliably deletes it -- one a
    client disconnect does not run. This holds one batch in memory instead,
    starts sending immediately, and overlaps its cost with the transfer.

    @param path: the export parquet.
    @returns: an iterator of encoded TSV chunks, header first.
    """
    con = duckdb.connect(config={"temp_directory": tempfile.gettempdir()})
    try:
        yield ("\t".join(EXPORT_COLUMNS) + "\n").encode()
        rows = con.execute("SELECT * FROM read_parquet(?)", [str(path)])
        while batch := rows.fetchmany(_EXPORT_TSV_BATCH):
            yield "".join(
                "\t".join(map(_tsv_field, row)) + "\n" for row in batch
            ).encode()
    finally:
        # Also reached when the client disconnects mid-download and the
        # generator is closed, which is the case that would otherwise leak.
        con.close()


def sweep_exports(export_dir: str) -> int:
    """Delete exports that are past retention, oldest first.

    Deletes any `<name>.parquet` (or its `.partial`) directly inside the
    configured directory -- it matches the shape this module writes, not a
    record of what it wrote, so a parquet someone else put there is a
    candidate too. That is why KMINDEX_EXPORT_DIR wants a directory of its
    own; the shipped compose file gives it a dedicated volume. Nothing else
    is touched: no recursion, and symlinks are skipped rather than followed,
    so a link planted in the directory cannot redirect a delete outside it.

    @param export_dir: configured export directory.
    @returns: how many files were deleted.
    """
    directory = Path(export_dir)
    now = time.time()
    keepable: List[Tuple[float, int, Path]] = []
    doomed: List[Path] = []
    try:
        entries = list(directory.iterdir())
    except OSError as exc:
        logger.warning("Could not sweep exports in %s: %s", export_dir, exc)
        return 0

    for entry in entries:
        if entry.is_symlink() or not _EXPORT_OWNED.match(entry.name):
            continue
        try:
            stat = entry.stat()
        except OSError:
            continue
        if not entry.is_file():
            continue
        age = now - stat.st_mtime
        partial = entry.name.endswith(_EXPORT_PARTIAL_SUFFIX)
        if age > (
            _EXPORT_PARTIAL_MAX_AGE_SECONDS if partial else EXPORT_MAX_AGE_SECONDS
        ):
            doomed.append(entry)
        elif not partial:
            keepable.append((stat.st_mtime, stat.st_size, entry))

    # Oldest first, so what survives the byte budget is what a cached aggregate
    # is most likely to still be pointing at.
    keepable.sort()
    budget = EXPORT_MAX_TOTAL_BYTES - sum(size for _mtime, size, _p in keepable)
    for _mtime, size, entry in keepable:
        if budget >= 0:
            break
        doomed.append(entry)
        budget += size

    deleted = 0
    for entry in doomed:
        try:
            entry.unlink()
            deleted += 1
        except OSError as exc:
            logger.warning("Could not delete stale export %s: %s", entry, exc)
    if deleted:
        logger.info("Swept %d stale kmindex export(s) from %s", deleted, export_dir)
    return deleted


def _synchronized(method):
    """Serialize a public method on the instance lock.

    FastMCP offloads sync MCP tools to a worker threadpool (sync tool fns
    are run via anyio.to_thread), and the SRAMirrorService singleton is
    shared between that threadpool and the assistant's event-loop thread.
    A single DuckDB connection is not safe for concurrent execute()/fetch()
    -- a second thread's execute() rebinds the connection's pending result
    between the first thread's execute() and fetch() -- and the plain-dict
    cache is not safe for concurrent mutation. Holding the lock for the whole
    call keeps each lookup (cache check + queries + cache store) atomic.

    Queries are sub-200ms and usually cache hits, so the serialization cost
    is negligible; per-thread duckdb cursors could restore read parallelism
    later if it ever matters.
    """

    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        with self._lock:
            return method(self, *args, **kwargs)

    return wrapper


class SRAMirrorService:
    """Read-only access to the local SRA-DuckDB mirror."""

    def __init__(self, mirror_path: str):
        self.mirror_path = mirror_path
        self._con: Optional[duckdb.DuckDBPyConnection] = None
        self._meta: Dict[str, str] = {}
        self._total_runs: Optional[int] = None
        self._cache: Dict[Tuple, Tuple[float, Any]] = {}
        # Guards the shared DuckDB connection and the cache dict: the MCP
        # tools execute in FastMCP's worker threadpool, so both are touched
        # from multiple threads. RLock so a future nested call can't deadlock.
        self._lock = threading.RLock()
        self._initialize()

    def _cache_get(self, key: Tuple) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        ts, value = entry
        if time.monotonic() - ts >= _CACHE_TTL_SECONDS:
            # Pop the expired entry instead of leaving it to shadow the slot.
            del self._cache[key]
            return None
        # Hand back a copy so a caller mutating the result can't corrupt the
        # shared cache entry.
        return copy.deepcopy(value)

    def _cache_put(self, key: Tuple, value: Any) -> None:
        if key not in self._cache and len(self._cache) >= _CACHE_MAX_ENTRIES:
            self._evict()
        # Store an independent copy so a caller mutating the returned dict
        # (which it still holds a reference to) can't reach into the cache.
        self._cache[key] = (time.monotonic(), copy.deepcopy(value))

    def _evict(self) -> None:
        now = time.monotonic()
        expired = [
            k for k, (ts, _) in self._cache.items() if now - ts >= _CACHE_TTL_SECONDS
        ]
        for k in expired:
            del self._cache[k]
        # Still full after dropping expired entries: evict oldest-inserted
        # (dicts preserve insertion order) until there's room.
        while len(self._cache) >= _CACHE_MAX_ENTRIES:
            del self._cache[next(iter(self._cache))]

    def _initialize(self) -> None:
        # Path('').exists() is True (it resolves to '.'), so guard the empty
        # case explicitly and require an actual file -- otherwise an unset
        # SRA_MIRROR_PATH falls through to duckdb.connect('', read_only=True),
        # which raises and logs a scary traceback on every default-deploy boot.
        if not self.mirror_path:
            logger.info("SRA_MIRROR_PATH not set -- SRA mirror service disabled")
            return
        if not Path(self.mirror_path).is_file():
            logger.warning(
                "SRA mirror not found at %s -- service will report unavailable",
                self.mirror_path,
            )
            return
        # Build into locals and only publish to self on full success, so a
        # query failure after connect() can't leave self._con pointing at a
        # half-initialized handle. Distinct except arms give an actionable log
        # line instead of one flattened "failed" with a raw traceback.
        con: Optional[duckdb.DuckDBPyConnection] = None
        try:
            # Pin the spill directory. DuckDB defaults temp_directory to
            # "<database>.tmp", which here resolves inside the read-only bind
            # mount that carries the mirror -- and the container runs as a
            # non-root user while Docker creates that mount's parent as root,
            # so the process cannot create it either way. Any query large
            # enough to spill would fail on a path nobody chose. gettempdir()
            # honours TMPDIR and falls back to /tmp, which is writable.
            con = duckdb.connect(
                self.mirror_path,
                read_only=True,
                config={"temp_directory": tempfile.gettempdir()},
            )
            meta = dict(con.execute("SELECT key, value FROM mirror_meta").fetchall())
            total_runs = con.execute("SELECT COUNT(*) FROM runs").fetchone()[0]
        except duckdb.IOException as exc:
            logger.error("Could not open SRA mirror at %s: %s", self.mirror_path, exc)
        except duckdb.CatalogException as exc:
            logger.error(
                "SRA mirror at %s is missing an expected table: %s",
                self.mirror_path,
                exc,
            )
        except duckdb.Error as exc:
            logger.error("Failed to load SRA mirror at %s: %s", self.mirror_path, exc)
        else:
            self._con = con
            self._meta = meta
            self._total_runs = total_runs
            logger.info(
                "SRA mirror loaded: %s rows, built %s",
                f"{total_runs:,}",
                meta.get("mirror_built_at", "unknown"),
            )
            return

        # Reached only on a caught failure: close the opened handle so the
        # file lock doesn't linger until GC, and stay unavailable.
        if con is not None:
            con.close()
        self._con = None

    def is_available(self) -> bool:
        return self._con is not None

    def _provenance(self, resolved_names: List[str]) -> Dict[str, Any]:
        return {
            "mirror_built_at": self._meta.get("mirror_built_at"),
            "taxdump_version": self._meta.get("taxdump_version"),
            "total_runs_in_mirror": self._total_runs,
            "resolved_names_for_query": resolved_names,
        }

    def _resolve_organism(self, organism: str) -> tuple[Optional[int], List[str]]:
        """Resolve a user-supplied organism term to (taxid, names_in_mirror).

        Accepts either an NCBI taxonomy id ("5833") or a scientific name
        ("Plasmodium falciparum", or any known synonym such as "Candida
        auris"). Returns (taxid, list_of_names) -- the list is what to
        match against the `runs.organism` column.

        If the term doesn't match any known taxid or name, falls back to
        a single-element list with the literal input so the caller still
        gets a chance to find something via exact match.
        """
        if not self._con:
            return None, [organism]

        term = organism.strip()

        if term.isdigit():
            taxid = int(term)
            rows = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [taxid]
            ).fetchall()
            if rows:
                return taxid, [r[0] for r in rows]
            # A numeric taxid we don't know about isn't "resolved" -- mirror the
            # unknown-name path below so callers don't report a phantom organism.
            return None, [term]

        # Curated abbreviation alias check (case-insensitive, whitespace-
        # tolerant). NCBI's name table doesn't list lay abbreviations like
        # "SARS-CoV-2" or "TB", so these would otherwise miss.
        alias_taxid = _ORGANISM_ALIASES.get(" ".join(term.lower().split()))
        if alias_taxid is not None:
            rows = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [alias_taxid]
            ).fetchall()
            if rows:
                return alias_taxid, [r[0] for r in rows]
            return alias_taxid, [term]

        rows = self._con.execute(
            """
            SELECT DISTINCT taxid FROM taxid_names
            WHERE LOWER(name) = LOWER(?)
            ORDER BY taxid
            """,
            [term],
        ).fetchall()
        if rows:
            # Deterministic pick when a name maps to multiple taxids -- the
            # ORDER BY makes restarts/processes agree instead of taking
            # whatever row DuckDB happened to return first.
            taxid = rows[0][0]
            names = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [taxid]
            ).fetchall()
            return taxid, [r[0] for r in names]

        return None, [term]

    @_synchronized
    def summary_for_organism(self, organism: str) -> Dict[str, Any]:
        """High-leverage one-call snapshot for an organism.

        Returns total run count, top platforms/assays/countries, recent
        activity, top BioProjects, plus provenance metadata.
        """
        if not self._con:
            return {"error": "SRA mirror not available"}

        cache_key = ("summary", _norm_organism(organism))
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        con = self._con

        n_runs, n_projects, n_studies, earliest, latest = con.execute(
            """
            SELECT
                COUNT(*),
                COUNT(DISTINCT bioproject),
                COUNT(DISTINCT sra_study),
                MIN(releasedate),
                MAX(releasedate)
            FROM runs WHERE organism IN (SELECT UNNEST(?))
            """,
            [names],
        ).fetchone()

        if not n_runs:
            # Distinguish "we don't recognize this term" (likely a typo) from
            # "real organism, just no data" -- otherwise the model relays an
            # authoritative "no data" for a misspelling.
            resolved = taxid is not None
            if resolved:
                message = (
                    f"'{organism}' resolved to a known organism (taxid {taxid}) "
                    "but the SRA mirror has no runs for it."
                )
            else:
                message = (
                    f"Couldn't resolve '{organism}' to a known organism -- check "
                    "the spelling, or try the scientific name or NCBI taxid."
                )
            empty = {
                "input": organism,
                "resolved_taxid": taxid,
                "resolved": resolved,
                "n_runs": 0,
                "message": message,
                "_meta": self._provenance(names),
            }
            self._cache_put(cache_key, empty)
            return empty

        platforms = con.execute(
            """
            SELECT platform, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND platform IS NOT NULL
            GROUP BY platform ORDER BY n DESC LIMIT 5
            """,
            [names],
        ).fetchall()

        assays = con.execute(
            """
            SELECT assay_type, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND assay_type IS NOT NULL
            GROUP BY assay_type ORDER BY n DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        countries = con.execute(
            """
            SELECT geo_loc_name_country_calc AS country, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?))
              AND geo_loc_name_country_calc IS NOT NULL
              AND geo_loc_name_country_calc != 'uncalculated'
            GROUP BY country ORDER BY n DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        top_projects = con.execute(
            """
            SELECT bioproject, COUNT(*) AS n_runs, MIN(releasedate) AS earliest, MAX(releasedate) AS latest
            FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND bioproject IS NOT NULL
            GROUP BY bioproject ORDER BY n_runs DESC, bioproject DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        recent_count = con.execute(
            """
            SELECT COUNT(*) FROM runs
            WHERE organism IN (SELECT UNNEST(?))
              AND releasedate >= CURRENT_DATE - INTERVAL 90 DAY
            """,
            [names],
        ).fetchone()[0]

        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "resolved": True,
            "n_runs": n_runs,
            "n_bioprojects": n_projects,
            "n_studies": n_studies,
            "earliest_release": str(earliest) if earliest else None,
            "latest_release": str(latest) if latest else None,
            "runs_last_90_days": recent_count,
            "top_platforms": [{"platform": p, "n_runs": n} for p, n in platforms],
            "top_assay_types": [{"assay_type": a, "n_runs": n} for a, n in assays],
            "top_countries": [{"country": c, "n_runs": n} for c, n in countries],
            "top_bioprojects": [
                {
                    "bioproject": bp,
                    "n_runs": n,
                    "earliest_release": str(e) if e else None,
                    "latest_release": str(la) if la else None,
                }
                for bp, n, e, la in top_projects
            ],
            "_meta": self._provenance(names),
        }
        self._cache_put(cache_key, result)
        return result

    @_synchronized
    def search_runs(
        self,
        organism: str,
        assay_type: Optional[str] = None,
        platform: Optional[str] = None,
        country: Optional[str] = None,
        since: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Search for runs by organism + filters."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        # Clamp here too (the tool layer also clamps) so a non-tool caller
        # can't request an unbounded result set.
        limit = max(1, min(limit, 200))

        cache_key = (
            "search",
            _norm_organism(organism),
            _norm_filter(assay_type),
            _norm_filter(platform),
            _norm_filter(country),
            since,
            limit,
        )
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        clauses = ["organism IN (SELECT UNNEST(?))"]
        params: List[Any] = [names]

        if assay_type:
            clauses.append("LOWER(assay_type) = ?")
            params.append(_norm_filter(assay_type))
        if platform:
            clauses.append("LOWER(platform) = ?")
            params.append(_norm_filter(platform))
        if country:
            clauses.append("LOWER(geo_loc_name_country_calc) IN (SELECT UNNEST(?))")
            params.append(_country_candidates(country))
        if since:
            normalized_since = _normalize_since(since)
            if normalized_since is None:
                # Still honor the provenance contract -- every response carries
                # resolution info and _meta, even when a filter is rejected.
                return {
                    "input": organism,
                    "resolved_taxid": taxid,
                    "resolved": taxid is not None,
                    "error": (
                        f"Invalid 'since' date {since!r}. Use YYYY, YYYY-MM, "
                        "or YYYY-MM-DD (e.g. 2024, 2024-01, or 2024-01-01)."
                    ),
                    "_meta": self._provenance(names),
                }
            clauses.append("releasedate >= ?")
            params.append(normalized_since)

        where = " AND ".join(clauses)
        rows = self._con.execute(
            f"""
            SELECT acc, sra_study, bioproject, organism, assay_type, platform,
                   instrument, librarylayout, releasedate,
                   geo_loc_name_country_calc, mbases
            FROM runs WHERE {where}
            ORDER BY releasedate DESC, acc DESC
            LIMIT ?
            """,
            params + [limit],
        ).fetchall()

        results = [
            {
                "accession": r[0],
                "study": r[1],
                "bioproject": r[2],
                "organism": r[3],
                "assay_type": r[4],
                "platform": r[5],
                "instrument": r[6],
                "library_layout": r[7],
                "release_date": str(r[8]) if r[8] else None,
                "country": r[9],
                "mbases": r[10],
            }
            for r in rows
        ]

        resolved = taxid is not None or len(results) > 0
        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "resolved": resolved,
            "filters_applied": {
                k: v
                for k, v in {
                    "assay_type": assay_type,
                    "platform": platform,
                    "country": country,
                    "since": since,
                }.items()
                if v
            },
            "n_returned": len(results),
            "limit": limit,
            "runs": results,
            "_meta": self._provenance(names),
        }
        if not resolved:
            result["message"] = (
                f"Couldn't resolve '{organism}' to a known organism -- check "
                "the spelling, or try the scientific name or NCBI taxid."
            )
        self._cache_put(cache_key, result)
        return result

    @_synchronized
    def top_bioprojects_for_organism(
        self, organism: str, limit: int = 20
    ) -> Dict[str, Any]:
        """Per Anton #723: rank BioProjects by run count, include study count
        and earliest/latest release dates."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        limit = max(1, min(limit, 100))

        cache_key = ("top_bioprojects", _norm_organism(organism), limit)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        rows = self._con.execute(
            """
            SELECT bioproject,
                   COUNT(*) AS n_runs,
                   COUNT(DISTINCT sra_study) AS n_studies,
                   MIN(releasedate) AS earliest,
                   MAX(releasedate) AS latest
            FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND bioproject IS NOT NULL
            GROUP BY bioproject
            ORDER BY n_runs DESC, bioproject DESC
            LIMIT ?
            """,
            [names, limit],
        ).fetchall()

        resolved = taxid is not None or len(rows) > 0
        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "resolved": resolved,
            "n_returned": len(rows),
            "bioprojects": [
                {
                    "bioproject": bp,
                    "n_runs": n_runs,
                    "n_studies": n_studies,
                    "earliest_release": str(e) if e else None,
                    "latest_release": str(la) if la else None,
                }
                for bp, n_runs, n_studies, e, la in rows
            ],
            "_meta": self._provenance(names),
        }
        if not resolved:
            result["message"] = (
                f"Couldn't resolve '{organism}' to a known organism -- check "
                "the spelling, or try the scientific name or NCBI taxid."
            )
        self._cache_put(cache_key, result)
        return result

    @_synchronized
    def runs_by_accession(self, accessions: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Look up run metadata for a batch of run accessions.

        Built for annotating a page of sequence-search hits, so it takes the
        accessions as they come and returns only the ones the mirror knows --
        a caller should expect misses. How many depends on how the mirror was
        built: a taxid-filtered mirror misses most of what a Logan query
        matches, since Logan indexes all of SRA.

        The 'uncalculated' country and 'unspecified' instrument sentinels come
        back as None, matching _COHORT_FACETS and the export. All three describe
        the same runs on the same screen, and this was the one path still
        spelling an absence as a value -- a search's table showed a country of
        "uncalculated" beside a cohort that counted it as not recorded.
        """
        if not self._con or not accessions:
            return {}

        wanted = sorted({a.strip().upper() for a in accessions if a and a.strip()})
        if not wanted:
            return {}

        cache_key = ("runs_by_accession", tuple(wanted))
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        # Batch rather than truncate. Slicing to the batch size here silently
        # dropped annotations from any page larger than it -- and because
        # `wanted` is sorted, it dropped them by accession rather than by
        # score, so the rows that survived weren't even the ranked ones.
        rows: List[Any] = []
        for start in range(0, len(wanted), _ACCESSION_BATCH_SIZE):
            batch = wanted[start : start + _ACCESSION_BATCH_SIZE]
            rows.extend(
                self._con.execute(
                    """
                    SELECT acc, sra_study, bioproject, organism, assay_type,
                           platform,
                           nullif(instrument, 'unspecified'),
                           librarylayout, releasedate,
                           nullif(geo_loc_name_country_calc, 'uncalculated'),
                           mbases
                    FROM runs WHERE acc IN (SELECT UNNEST(?))
                    """,
                    [batch],
                ).fetchall()
            )

        result = {
            r[0]: {
                "assay_type": r[4],
                "bioproject": r[2],
                "country": r[9],
                "instrument": r[6],
                "library_layout": r[7],
                "mbases": r[10],
                "organism": r[3],
                "platform": r[5],
                "release_date": str(r[8]) if r[8] else None,
                "study": r[1],
            }
            for r in rows
        }
        self._cache_put(cache_key, result)
        return result

    # Deliberately not @_synchronized. That decorator holds the instance lock
    # for the whole call, and its own justification is that "queries are
    # sub-200ms"; this one is ~1s against a 43.5M-row table, so holding
    # the lock across it would park every MCP tool call and assistant lookup
    # behind one user's search. Instead the long query runs on a duckdb
    # cursor() -- an independent connection onto the already-open database --
    # and the lock is held only for the cache reads/writes and the cursor
    # handoff, which are the parts that actually touch shared state. Measured:
    # while a cursor ran a 1.4s query, the parent connection served 4,166
    # small queries with no errors and no measurable slowdown.
    def cohort_for_accessions(self, accessions: List[str]) -> Optional[Dict[str, Any]]:
        """
        Facet and count a complete hit set in one pass over the mirror.

        Built for the pre-cap hit list of a sequence search, which is why it
        takes every accession rather than a page: counting the paged rows
        describes the display cap, not the query. On a real 1,133,516-hit job
        the visible 50,000 reported E. coli first at 70% and dropped
        Salmonella enterica -- the actual leader -- off the list entirely.

        Returns the cohort dict, or None when the mirror is unavailable or the
        hit set is empty. A query failure is raised rather than swallowed: the
        caller has to be able to tell "the mirror was never there" (cache the
        result without a cohort) from "the read failed this time" (don't), and
        a half-filled cohort is worse than none, since the whole reason it
        exists is to be the number that can be trusted.
        """
        if not self._con or not accessions:
            return None

        wanted = sorted({a.strip().upper() for a in accessions if a and a.strip()})
        if not wanted:
            return None

        payload = "\n".join(wanted)
        # Key on a digest rather than the accession tuple runs_by_accession
        # uses: at 1.1M accessions that tuple would cost more to build, hash
        # and hold than the query it saves. Length is carried alongside so a
        # caller asking about the same set twice with different duplication
        # can't be served the wrong `total`.
        cache_key = (
            "cohort",
            hashlib.md5(payload.encode()).hexdigest(),
            len(accessions),
        )
        with self._lock:
            if (cached := self._cache_get(cache_key)) is not None:
                return cached
            cursor = self._con.cursor()

        # The staging file is the join's right-hand side; it exists only for
        # the duration of the statement and never outlives the call.
        staging = None
        try:
            staging = tempfile.NamedTemporaryFile(
                "w", suffix=".txt", prefix="cohort-", delete=False
            )
            staging.write(payload)
            staging.close()
            rows = cursor.execute(_cohort_sql(), [staging.name]).fetchall()
        finally:
            cursor.close()
            if staging is not None:
                staging.close()
                Path(staging.name).unlink(missing_ok=True)

        scalars = {value: n for facet, value, n in rows if facet == _COHORT_SCALAR_TAG}
        grouped: Dict[str, List[Tuple[Optional[str], int]]] = {
            name: [] for name, _expr in _COHORT_FACETS
        }
        organisms: List[Dict[str, Any]] = []
        for facet, value, n in rows:
            if facet in grouped:
                grouped[facet].append((value, n))
            elif facet == "organism":
                organisms.append({"count": n, "value": value})
        # UNION ALL does not promise to preserve branch order, so re-sort here
        # rather than trust the LIMIT'd subquery's ordering to survive.
        organisms.sort(key=lambda o: (-o["count"], o["value"]))

        cohort = {
            "bioprojects": scalars["bioprojects"],
            "countries": scalars["countries"],
            "facets": [
                _shape_facet(name, grouped[name]) for name, _expr in _COHORT_FACETS
            ],
            "in_mirror": scalars["in_mirror"],
            "organisms": scalars["organisms"],
            "studies": scalars["studies"],
            "top_organisms": organisms,
            # The caller's hit count, not the deduplicated or mirrored one, so
            # it lines up with the total_matches shown beside it. Everything
            # else counts mirrored rows and is therefore out of in_mirror --
            # about 99.6% of total on the measured job, and much less for a
            # query that matches organisms the mirror was not built to carry.
            "total": len(accessions),
        }
        with self._lock:
            self._cache_put(cache_key, cohort)
        return cohort

    # Not @_synchronized, for the reason spelled out above cohort_for_accessions:
    # this is a ~1.5s stage-and-write against a 43.5M-row table, and holding the
    # instance lock across it would park every MCP tool call behind one user's
    # download. The cursor gives it its own connection onto the open database;
    # the lock covers only the handoff.
    def export_hits(
        self, job_id: str, hits: List[Dict[str, Any]], export_dir: str
    ) -> Optional[Dict[str, Any]]:
        """
        Write a search's complete hit list, enriched from the mirror, to disk.

        Called during aggregation because that is the only moment the full
        match set exists: the aggregate keeps 50,000 hits and discards the
        rest, so afterwards the only way back to the other million is to
        re-download 84-280 shard datasets from a rate-limited Galaxy. Same
        window, and the same reason, as cohort_for_accessions.

        Writes to a partial name and renames into place, so a crash cannot
        leave a truncated file that reads as a complete export.

        @param job_id: Galaxy job the hits belong to; names the file.
        @param hits: every hit, before the display cap, as accession/score/shard
            dicts in ranked order.
        @param export_dir: configured export directory.
        @returns: {"rows": n, "status": ...} describing what a caller may now
            advertise, or None when nothing was written and nothing should be
            said about it -- the mirror is unavailable, the feature is off, or
            there were no hits. A write failure raises rather than returning a
            status, so the caller can tell a broken write from a disabled one.
        """
        destination = export_file_path(export_dir, job_id)
        if not self._con or destination is None or not hits:
            return None

        if len(hits) > EXPORT_MAX_ROWS:
            logger.warning(
                "kmindex job %s: %s hits exceeds the %s-row export ceiling; "
                "skipping materialization",
                job_id,
                f"{len(hits):,}",
                f"{EXPORT_MAX_ROWS:,}",
            )
            return {"rows": None, "status": EXPORT_TOO_LARGE}

        # Before the write, so the budget frees space for the file about to
        # land and the new export is never its own sweep candidate.
        destination.parent.mkdir(parents=True, exist_ok=True)
        sweep_exports(export_dir)

        # A per-attempt partial name, not a deterministic one. The aggregation
        # lock is an asyncio.Lock, so it orders one event loop and nothing more:
        # a second worker or replica writing the same job would otherwise share
        # this path and one would rename the other's half-written file into
        # place. mkstemp in the destination directory keeps the rename atomic
        # and removes the question.
        fd, partial_name = tempfile.mkstemp(
            dir=destination.parent,
            prefix=f"{destination.stem}-",
            suffix=f"{_EXPORT_SUFFIX}{_EXPORT_PARTIAL_SUFFIX}",
        )
        os.close(fd)
        partial = Path(partial_name)
        with self._lock:
            cursor = self._con.cursor()

        # The staging file is the join's left-hand side and never outlives the
        # call; it carries the rank because the app's md5 tie-break has no SQL
        # equivalent, and the export ships in the order the app ranked it.
        staging = None
        try:
            staging = tempfile.NamedTemporaryFile(
                "w", suffix=".tsv", prefix="kmindex-export-", delete=False
            )
            for ordinal, hit in enumerate(hits):
                staging.write(
                    f"{ordinal}\t{hit['accession']}\t{hit['score']}\t{hit['shard']}\n"
                )
            staging.close()
            cursor.execute(_export_sql(), [staging.name, str(partial)])
        except Exception:
            try:
                partial.unlink(missing_ok=True)
            except OSError:
                pass
            raise
        finally:
            cursor.close()
            if staging is not None:
                staging.close()
                Path(staging.name).unlink(missing_ok=True)

        partial.replace(destination)
        # Count the file, not the input. They agree only while runs.acc happens
        # to be unique -- there is no constraint on it -- and a LEFT JOIN that
        # fanned out would put a row count in the download's filename that the
        # file does not have.
        return {
            "rows": export_row_count(destination),
            "status": EXPORT_AVAILABLE,
        }

    @_synchronized
    def get_study_runs(self, accession: str, limit: int = 200) -> Dict[str, Any]:
        """Get runs by SRA study (SRP*/ERP*/DRP*) or BioProject (PRJ*) accession."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        # Accessions are conventionally upper-case; normalize so a
        # lowercase or whitespace-padded "prjna12345" still routes to the
        # bioproject column instead of silently missing on sra_study.
        accession = accession.strip().upper()
        limit = max(1, min(limit, 500))

        cache_key = ("study_runs", accession, limit)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        column = "bioproject" if accession.startswith("PRJ") else "sra_study"
        rows = self._con.execute(
            f"""
            SELECT acc, sra_study, bioproject, organism, assay_type, platform,
                   instrument, librarylayout, releasedate,
                   geo_loc_name_country_calc, mbases
            FROM runs
            WHERE {column} = ?
            ORDER BY releasedate DESC, acc DESC
            LIMIT ?
            """,
            [accession, limit],
        ).fetchall()

        result = {
            "accession": accession,
            "matched_column": column,
            "n_returned": len(rows),
            "limit": limit,
            "runs": [
                {
                    "accession": r[0],
                    "study": r[1],
                    "bioproject": r[2],
                    "organism": r[3],
                    "assay_type": r[4],
                    "platform": r[5],
                    "instrument": r[6],
                    "library_layout": r[7],
                    "release_date": str(r[8]) if r[8] else None,
                    "country": r[9],
                    "mbases": r[10],
                }
                for r in rows
            ],
            "_meta": self._provenance([]),
        }
        self._cache_put(cache_key, result)
        return result
