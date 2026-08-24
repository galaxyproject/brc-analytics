#!/usr/bin/env python
"""Build the SRA run-metadata mirror the Logan search joins against.

    python -m scripts.build_sra_mirror --out /tmp/sra-mirror.duckdb

Produces a single DuckDB file: every SRA run, 39 columns, plus NCBI taxonomy.
`app/services/sra_mirror.py` consumes it; the playbook bind-mounts it read-only
into the backend container (see brc-analytics-playbook, "SRA Mirror").

Inputs are all public -- SRA's parquet from S3, taxdump from NCBI, and the
catalog's organisms.json from this repo -- so this is reproducible off any
checkout. Expect ~6 minutes and ~9 GB out.

Design notes, each of which cost a measurement to learn.

  * 11 more top-level columns, for ~1.6 GB more read. Measured against the
    upstream parquet on 2026-08-21: the dataset is 13.52 GB across 38 columns,
    and FOUR of them -- attributes k/v, jattr and sample_name -- are 11.32 GB,
    i.e. 84%. Every other column together is 2.20 GB. DuckDB is columnar, so
    columns nobody selects cost nothing at query time -- a 37-column build
    measured FASTER on an accession probe than an 11-column one that carried
    more rows. Width is cheap; row count is what costs.

  * 15 fields EXTRACTED FROM `jattr` at build time. This is where the fields
    BRC actually wants live -- host, isolation_source, strain, tissue, lat_lon,
    the MIxS environmental triad -- and none of them are in the ENA/Solr 60
    either. Measured 2026-08-23 on one file (1,435,923 rows): 9.8 s to parse
    and extract, so ~5 min across all 30 files, and ~2.13 GB raw before
    DuckDB's dictionary encoding, which these columns take well (host has
    17,059 distinct values over 459k filled rows).

  * NO src_file hint. An earlier draft of this script stored the source file
    per run so a "fetch full record" could read one file instead of scanning
    30 (measured 0.3 s vs 9.8 s, 32x). BOTH halves of that idea are dead,
    tested 2026-08-23:

      - Filenames do not survive. On 08-21 all 30 files were stamped
        20260821_131645_00178_c4fix; two days later all 30 were
        20260823_134040_00077_9jwfb, every UUID different. SRA republishes the
        whole set at once, so a stored hint has a ~0% hit rate.
      - There is no stable substitute. Every one of the 30 files spans the
        entire accession space (DRR000001 .. SRR9999999) and all 29 adjacent
        [min,max] pairs overlap: the files are hash/round-robin distributed,
        not range-partitioned. So a file INDEX or a min/max range map is just
        as useless as the name.

    Hence: pull what we need into the mirror at build time. There is no cheap
    on-demand path back to S3, and pretending otherwise costs 9.8 s a click.

  * tax_id, resolved locally. SRA has no per-run taxid: not among the 37
    parquet columns, and inside jattr `tax_id_sam_ss_dpl29` is 0.02% filled.
    What SRA gives you is the organism NAME, and NCBI taxonomy is the
    authority that maps name -> taxid, so we do that here. Measured
    2026-08-24: 43,790,309 of 43,811,033 runs resolve = 99.95%.

    This was previously written off as "ENA-only", which was wrong. The
    mirror's own taxid_names table resolves just 39.7%, but only because it
    was filtered to the ~6,234 BRC catalog organisms -- so it misses Homo
    sapiens (8.2M runs), SARS-CoV-2 (7.6M) and every metagenome. That is a
    build choice we made, not a capability SRA lacks.

    taxid_names is left ALONE. Its `taxid` column is the BRC catalog id, not
    an NCBI taxid -- it folds strain and assembly taxids onto the catalog's
    primary organism so strain-level queries land on the right row, and
    _resolve_organism in the connector depends on that. The new tables are
    additive: ncbi_names, ncbi_nodes, name_to_taxid, and runs.tax_id.

The remaining Solr/ENA argument is free-text search across its 60 fields,
which we still cannot do at all -- see README.md.
"""

import argparse
import json
import os
import re
import tarfile
import time
import urllib.request
from pathlib import Path

import duckdb

GLOB = "s3://sra-pub-metadata-us-east-1/sra/metadata/*"
TAXDUMP_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz"

# Repo-relative default so the catalog input resolves for anyone who checks
# this out, not just on the machine it was written on.
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CATALOG = REPO_ROOT / "catalog" / "output" / "organisms.json"

parser = argparse.ArgumentParser(
    description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
)
parser.add_argument(
    "--out",
    type=Path,
    required=True,
    help="destination .duckdb file (written via a .new temp + rename)",
)
parser.add_argument(
    "--taxdump-dir",
    type=Path,
    default=Path("./taxdump"),
    help="where names.dmp/nodes.dmp live; downloaded if absent",
)
parser.add_argument(
    "--catalog",
    type=Path,
    default=DEFAULT_CATALOG,
    help="catalog/output/organisms.json, for the BRC taxid_names table",
)
parser.add_argument("--threads", type=int, default=4)
parser.add_argument("--memory-limit", default="10GB")
args = parser.parse_args()

OUT = args.out
TAXDUMP_DIR = args.taxdump_dir
CATALOG = args.catalog

# Name classes worth matching on. "authority" (950,838 rows) is deliberately
# excluded: those are citation strings like "Borrelia burgdorferi Johnson et
# al. 1984", not names SRA submitters use. Adding synonyms past the scientific
# name buys only ~2,000 runs out of 43.8M, but it costs nothing.
NAME_CLASSES = ("scientific name", "synonym", "equivalent name", "genbank synonym")

# Lower wins when one name maps to several taxids -- a string that is the
# scientific name of one taxon and a synonym of another resolves to the former.
CLASS_PRIORITY = {c: i for i, c in enumerate(NAME_CLASSES)}

# The 11 the connector already reads.
SLIM_COLS = [
    "acc",
    "sra_study",
    "bioproject",
    "organism",
    "assay_type",
    "platform",
    "instrument",
    "librarylayout",
    "releasedate",
    "geo_loc_name_country_calc",
    "mbases",
]

# Added top-level. Each earns its place for the Logan enrichment specifically:
#   librarysource/libraryselection  complete the picture assay_type starts
#   avgspotlen/insertsize/mbytes    decide which Galaxy workflow can run at all
#   center_name/biosample/sample_acc/experiment   provenance and cross-links
#   *_continent_calc                a geography rollup country cannot give
WIDE_COLS = [
    "librarysource",
    "libraryselection",
    "center_name",
    "biosample",
    "sample_acc",
    "experiment",
    "avgspotlen",
    "insertsize",
    "mbytes",
    "library_name",
    "geo_loc_name_country_continent_calc",
]

# Upstream types these VARCHAR[], but every value observed is a single-element
# list, so they are flattened to match every other column. The sanity check at
# the bottom counts multi-valued rows so that stays honest.
LIST_COLS = [
    ("collection_date_sam", "collection_date"),
    ("geo_loc_name_sam", "geo_loc_name"),
]

# alias -> the BASE jattr key. Never hardcode a _dplNNN suffix here; see
# resolve_jattr_keys for why. Fill rates measured 2026-08-23 on a 1.44M sample.
JATTR_FIELDS = {
    "host": "host_sam",  # 32.0%
    "host_disease": "host_disease_sam",  # 15.0%
    "host_sci_name": "host_scientific_name_sam",  # 10.3%
    "isolation_source": "isolation_source_sam",  # 32.5%
    "isolate": "isolate_sam_ss",  # 35.7%
    "strain": "strain_sam_ss",  # 17.1%
    "tissue": "tissue_sam_ss",  # 22.3%
    "lat_lon": "lat_lon_sam_s",  # 28.6%
    "collected_by": "collected_by_sam",  # 18.8%
    "collecting_institution": "collecting_institution_sam",  # 8.7%
    "geo_loc_country_sea": "geographic_location__country_and_or_sea__sam",  # 17.3%
    "env_broad_scale": "env_broad_scale_sam",  # 7.6%
    "env_local_scale": "env_local_scale_sam",  # 7.4%
    "env_medium": "env_medium_sam",  # 7.5%
    "center_name_j": "insdc_center_name_sam",  # 23.0%
}

INDEXES = [
    ("idx_runs_organism", "organism"),
    ("idx_runs_acc", "acc"),
    ("idx_runs_bioproject", "bioproject"),
    ("idx_runs_study", "sra_study"),
    ("idx_runs_tax_id", "tax_id"),
]

KEY_SAMPLE = 200_000
_DPL = re.compile(r"_dpl\d+$")


def gb(p):
    return os.path.getsize(p) / 1000**3


def fetch_taxdump():
    """Make sure names.dmp and nodes.dmp are on disk; return the taxdump date.

    SRA carries no per-run tax_id -- it is not among the 37 parquet columns,
    and inside jattr `tax_id_sam_ss_dpl29` is 0.02% filled, i.e. noise. What
    SRA gives you is the organism NAME, and NCBI taxonomy is the authority
    that resolves name -> taxid. So we do the resolution here rather than
    treating taxid as something only ENA can provide.

    Measured 2026-08-24 against the full dump: scientific names alone resolve
    43,790,309 of 43,811,033 runs = 99.95%. The mirror's existing taxid_names
    table resolves 39.7%, because it was deliberately filtered to the ~6,234
    BRC catalog organisms and so misses Homo sapiens (8.2M runs), SARS-CoV-2
    (7.6M), Mus musculus (4.3M) and every metagenome.
    """
    names, nodes = TAXDUMP_DIR / "names.dmp", TAXDUMP_DIR / "nodes.dmp"
    if names.exists() and nodes.exists():
        stamp = time.strftime("%Y-%m-%d", time.localtime(names.stat().st_mtime))
        print(f"  using cached taxdump ({stamp})", flush=True)
        return stamp

    TAXDUMP_DIR.mkdir(parents=True, exist_ok=True)
    tgz = TAXDUMP_DIR / "taxdump.tar.gz"
    print(f"  downloading {TAXDUMP_URL} ...", flush=True)
    urllib.request.urlretrieve(TAXDUMP_URL, tgz)
    with tarfile.open(tgz) as tf:
        for member in ("names.dmp", "nodes.dmp"):
            tf.extract(member, path=TAXDUMP_DIR)
    tgz.unlink()
    return time.strftime("%Y-%m-%d")


def build_taxid_names(con):
    """Rebuild the BRC catalog's name-cluster table from organisms.json.

    NOTE this is a DIFFERENT thing from runs.tax_id. Here `taxid` is the BRC
    catalog's primary organism id, not an NCBI taxid: names from the species
    id, the assembly ids and each genome's speciesTaxonomyId are all folded
    onto the catalog row, so a strain-level query still lands on the right
    organism. SARS-CoV-2 is the motivating case -- the catalog carries species
    3418604 while its SRA submissions are tagged 2697049.
    _resolve_organism in the connector depends on exactly this shape.

    This used to be copied wholesale out of a 19 GB DuckDB file that existed
    on exactly one machine, which is what made the build unreproducible.
    organisms.json is in this repo and names.dmp is a public download, so it
    is rebuilt from those instead.
    """
    with open(CATALOG) as f:
        catalog = json.load(f)

    taxid_to_catalog = {}
    for d in catalog:
        species = d.get("ncbiTaxonomyId")
        if not species:
            continue
        species = int(species)
        related = {species}
        for atx in d.get("assemblyTaxonomyIds") or []:
            try:
                related.add(int(atx))
            except (TypeError, ValueError):
                pass
        for g in d.get("genomes") or []:
            for k in ("ncbiTaxonomyId", "speciesTaxonomyId"):
                if g.get(k):
                    try:
                        related.add(int(g[k]))
                    except (TypeError, ValueError):
                        pass
        for t in related:
            taxid_to_catalog[t] = species

    con.execute("""CREATE TEMP TABLE cat_map (ncbi_taxid INTEGER,
                                              catalog_taxid INTEGER)""")
    con.executemany("INSERT INTO cat_map VALUES (?, ?)", list(taxid_to_catalog.items()))

    # Same dedup rule as the original: one row per (catalog_taxid, name),
    # keeping the highest-priority name_class.
    cases = " ".join(f"WHEN '{c}' THEN {i}" for c, i in CLASS_PRIORITY.items())
    con.execute(f"""
        CREATE TABLE taxid_names AS
        SELECT catalog_taxid AS taxid, name, name_class,
               name_class = 'scientific name' AS is_current
        FROM (
            SELECT c.catalog_taxid, n.name, n.name_class,
                   row_number() OVER (
                       PARTITION BY c.catalog_taxid, n.name
                       ORDER BY CASE n.name_class {cases} ELSE 99 END
                   ) AS rn
            FROM ncbi_names n
            JOIN cat_map c ON c.ncbi_taxid = n.taxid
            WHERE n.name_class IN {NAME_CLASSES!r}
        ) WHERE rn = 1
    """)
    con.execute("CREATE INDEX idx_taxid_names_taxid ON taxid_names(taxid);")
    con.execute("CREATE INDEX idx_taxid_names_name ON taxid_names(name);")


def load_taxonomy(con):
    """Parse names.dmp/nodes.dmp into ncbi_names + ncbi_nodes.

    The .dmp format is "field\t|\tfield\t|\t...", so splitting on '|' leaves
    a tab welded to both ends of every value. DuckDB's one-argument trim()
    strips spaces only, NOT tabs -- using it here yields name_class values like
    '\tscientific name\t' that silently match nothing and report 0% coverage.
    The two-argument form is required.
    """
    tab = "chr(9) || ' '"
    # nodes.dmp is 13 fields + a trailing '|' = 14 columns once split. We only
    # read the first three, but every column must still be declared or the CSV
    # sniffer refuses the file.
    node_cols = ",".join(f"'column{i}':'VARCHAR'" for i in range(14))
    con.execute(f"""
        CREATE TABLE ncbi_names AS
        SELECT CAST(trim(column0, {tab}) AS INTEGER) AS taxid,
               trim(column1, {tab}) AS name,
               trim(column3, {tab}) AS name_class
        FROM read_csv('{TAXDUMP_DIR / "names.dmp"}', delim='|', header=false,
                      quote='', escape='', ignore_errors=true,
                      columns={{'column0':'VARCHAR','column1':'VARCHAR',
                               'column2':'VARCHAR','column3':'VARCHAR',
                               'column4':'VARCHAR'}})
        WHERE column0 IS NOT NULL
    """)
    con.execute(f"""
        CREATE TABLE ncbi_nodes AS
        SELECT CAST(trim(column0, {tab}) AS INTEGER) AS taxid,
               CAST(trim(column1, {tab}) AS INTEGER) AS parent_taxid,
               trim(column2, {tab}) AS rank
        FROM read_csv('{TAXDUMP_DIR / "nodes.dmp"}', delim='|', header=false,
                      quote='', escape='', ignore_errors=true,
                      columns={{{node_cols}}})
        WHERE column0 IS NOT NULL
    """)
    # One row per name. Ties broken by class priority then lowest taxid, so the
    # mapping is deterministic across rebuilds.
    cases = " ".join(f"WHEN '{c}' THEN {i}" for c, i in CLASS_PRIORITY.items())
    con.execute(f"""
        CREATE TABLE name_to_taxid AS
        SELECT name, taxid FROM (
            SELECT name, taxid,
                   row_number() OVER (
                       PARTITION BY name
                       ORDER BY CASE name_class {cases} ELSE 99 END, taxid
                   ) AS rn
            FROM ncbi_names
            WHERE name_class IN {NAME_CLASSES!r}
        ) WHERE rn = 1
    """)
    con.execute("CREATE INDEX idx_name_to_taxid ON name_to_taxid(name);")


def resolve_jattr_keys(con, one_file):
    """Map each wanted base key to the live jattr key that actually holds data.

    `jattr` carries 39,305 distinct keys, and a logical field shows up as
    several competing spellings that differ only by a _dplNNN suffix -- of
    which exactly one is populated. Resolving alphabetically picks the wrong
    one: lat_lon_sam_s_dpl1 sorts before lat_lon_sam_s_dpl34, and _dpl1 is
    0.0% filled with 7 distinct values while _dpl34 is 28.6% filled with
    88,922. So resolve by FILL COUNT. This also absorbs suffix drift across
    republishes for free, which matters because the upstream files are
    regenerated wholesale (see the module docstring).
    """
    counts = dict(
        con.execute(f"""
        WITH s AS (
            SELECT jattr FROM read_parquet('{one_file}')
            WHERE jattr IS NOT NULL LIMIT {KEY_SAMPLE}
        )
        SELECT k, COUNT(*) FROM s, UNNEST(json_keys(jattr)) AS t(k) GROUP BY k
    """).fetchall()
    )

    best = {}
    for k, n in counts.items():
        b = _DPL.sub("", k)
        if b not in best or n > counts[best[b]]:
            best[b] = k

    resolved, missing = {}, []
    for alias, base in JATTR_FIELDS.items():
        k = best.get(base)
        (resolved.__setitem__(alias, k) if k else missing.append(alias))
    return resolved, missing, len(counts)


tmp = OUT.with_suffix(".duckdb.new")
if tmp.exists():
    tmp.unlink()

con = duckdb.connect(str(tmp))
con.execute("INSTALL httpfs; LOAD httpfs;")
con.execute("SET s3_region='us-east-1';")
con.execute("SET s3_access_key_id=''; SET s3_secret_access_key='';")
con.execute(f"SET memory_limit='{args.memory_limit}';")
con.execute(f"SET threads={args.threads};")
con.execute("SET http_timeout=120000;")
con.execute("SET http_retries=5;")
con.execute("SET http_retry_wait_ms=2000;")

one_file = con.execute(
    f"SELECT file_name FROM parquet_file_metadata('{GLOB}') ORDER BY file_name LIMIT 1"
).fetchone()[0]

print("Fetching NCBI taxdump...", flush=True)
taxdump_stamp = fetch_taxdump()
t0 = time.time()
load_taxonomy(con)
_names = con.execute("SELECT COUNT(*) FROM ncbi_names").fetchone()[0]
_map = con.execute("SELECT COUNT(*) FROM name_to_taxid").fetchone()[0]
print(f"  {_names:,} names -> {_map:,} resolvable, {time.time() - t0:.0f}s", flush=True)

print("\nProfiling jattr keys...", flush=True)
t0 = time.time()
jattr_keys, missing, n_keys = resolve_jattr_keys(con, one_file)
print(
    f"  {n_keys:,} distinct keys, resolved {len(jattr_keys)}/{len(JATTR_FIELDS)}"
    f" in {time.time() - t0:.1f}s",
    flush=True,
)
for alias, k in jattr_keys.items():
    if _DPL.search(k):
        print(
            f"    {alias:24s} -> {k}   (suffixed variant, chosen by fill)", flush=True
        )
if missing:
    print(f"  !! no live key for: {', '.join(missing)}", flush=True)

select = list(SLIM_COLS) + list(WIDE_COLS)
select += [f'list_extract("{s}", 1) AS {d}' for s, d in LIST_COLS]
# Values are inconsistently shaped: some keys hold a JSON array of strings,
# others a bare string (lat_lon is a bare string). COALESCE covers both --
# the array path yields NULL on a scalar rather than erroring.
select += [
    f"""COALESCE(json_extract_string(jattr, '$."{k}"[0]'),
                 json_extract_string(jattr, '$."{k}"')) AS {a}"""
    for a, k in jattr_keys.items()
]
n_cols = len(select)

print(
    f"\nScanning SRA metadata parquet ({n_cols} columns incl. {len(jattr_keys)} "
    f"from jattr)...",
    flush=True,
)
t0 = time.time()
con.execute(f"""
    CREATE TABLE runs AS
    SELECT p.*, nt.taxid AS tax_id
    FROM (
        SELECT {", ".join(select)}
        FROM read_parquet('{GLOB}')
    ) p
    LEFT JOIN name_to_taxid nt ON nt.name = p.organism
""")
con.execute("CHECKPOINT;")
rows = con.execute("SELECT COUNT(*) FROM runs").fetchone()[0]
print(f"  {rows:,} runs in {time.time() - t0:.0f}s -- {gb(tmp):.2f} GB", flush=True)

for name, col in INDEXES:
    t = time.time()
    con.execute(f"CREATE INDEX {name} ON runs({col});")
    con.execute("CHECKPOINT;")
    print(f"  +{name:22s} total {gb(tmp):5.2f} GB ({time.time() - t:.0f}s)", flush=True)

build_taxid_names(con)

con.execute("CREATE TABLE mirror_meta (key VARCHAR, value VARCHAR);")
con.executemany(
    "INSERT INTO mirror_meta VALUES (?, ?)",
    [
        ("mirror_built_at", time.strftime("%Y-%m-%d")),
        ("filter_strategy", f"none -- all SRA runs, {n_cols} columns"),
        ("schema_version", "5"),
        ("ncbi_taxdump_version", taxdump_stamp),
        # Which jattr spelling each alias came from. Stored so a later fill-rate
        # regression can be traced to suffix drift instead of guessed at.
        ("jattr_key_map", json.dumps(jattr_keys, sort_keys=True)),
    ],
)
con.execute("CHECKPOINT;")

print("\n=== Sanity ===", flush=True)
for q, label in [
    ("SELECT COUNT(DISTINCT organism) FROM runs", "distinct organisms"),
    ("SELECT COUNT(DISTINCT bioproject) FROM runs", "distinct bioprojects"),
    (
        "SELECT COUNT(*) FROM runs WHERE librarysource IS NOT NULL",
        "librarysource filled",
    ),
    ("SELECT COUNT(*) FROM taxid_names", "taxid_names rows"),
]:
    print(f"  {label:32s} {con.execute(q).fetchone()[0]:>12,}", flush=True)

resolved = con.execute("SELECT COUNT(tax_id) FROM runs").fetchone()[0]
with_org = con.execute(
    "SELECT COUNT(*) FROM runs WHERE organism IS NOT NULL"
).fetchone()[0]
pct = 100 * resolved / with_org
print(f"  {'tax_id resolved':32s} {resolved:>12,}  {pct:>5.2f}%", flush=True)
if resolved / with_org < 0.95:
    print(
        "     <-- BELOW 95%, expected ~99.95%; check the .dmp tab-trimming", flush=True
    )

print("  -- jattr fill rates (expect these to match the docstring) --", flush=True)
for alias in jattr_keys:
    n = con.execute(f"SELECT COUNT({alias}) FROM runs").fetchone()[0]
    flag = "   <-- EMPTY, suffix drift?" if n == 0 else ""
    print(f"  {alias:32s} {n:>12,}  {100 * n / rows:>5.1f}%{flag}", flush=True)

# The flattening assumption above, made loud.
for src_col, _dest in LIST_COLS:
    n = con.execute(
        f"""SELECT COUNT(*) FROM read_parquet('{GLOB}') WHERE length("{src_col}") > 1"""
    ).fetchone()[0]
    flag = "" if n == 0 else "   <-- FLATTENING IS LOSING DATA"
    print(f"  {src_col + ' multi-valued':32s} {n:>12,}{flag}", flush=True)

con.close()
tmp.rename(OUT)
print(f"\nWrote {OUT} ({gb(OUT):.2f} GB) -- slim mirror untouched", flush=True)
