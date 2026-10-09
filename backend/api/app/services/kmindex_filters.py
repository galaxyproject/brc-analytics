"""
Filters over a kmindex job's export parquet.

The export is the whole match set -- every hit, LEFT JOINed to the SRA mirror
and written in rank order -- so a WHERE clause over it answers for the match
set rather than for the 50,000-row listing the unfiltered table pages. That is
the only reason filtering is allowed at all: the cohort card exists because
tallying the capped listing gives the wrong answer, and a filter applied to the
listing would give the same wrong answer with more confidence.

Nothing here touches the mirror or its lock. Every read opens its own DuckDB
connection over the file, pinned to a couple of threads and a memory ceiling so
one heavy filter cannot starve the VM, and closes it before returning.

Filters are an allowlisted model with bound values. There is no raw SQL path:
column names come from the tables below, and every value the caller supplied
reaches DuckDB as a parameter.
"""

import tempfile
from pathlib import Path
from typing import Annotated, Any, Dict, Iterable, Iterator, List, Optional, Tuple

import duckdb
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from app.services import country_iso
from app.services.sra_mirror import (
    _COHORT_FACETS,
    _COHORT_TOP_ORGANISMS,
    _EXPORT_TSV_BATCH,
    _shape_facet,
    _shape_geography,
    _tsv_field,
)

# Query parameters carrying a filter, e.g. ?f.platform=ILLUMINA. Prefixed so
# a filter can never collide with job, sort, the paging params or a site's
# feature-flag allowlist.
FILTER_PARAM_PREFIX = "f."

# Selects the runs with nothing recorded for a field (IS NULL). Spelled so it
# cannot be a real SRA value.
NONE_VALUE = "__none__"

MAX_VALUES_PER_FIELD = 50
MAX_VALUE_CHARS = 200

# Per-connection ceilings. The export is at most 5M rows; a summary is a single
# grouped scan over it and a page is a count plus a top-N, so two threads keep
# a request responsive without letting a burst of them take every core.
_FILTER_THREADS = 2
_FILTER_MEMORY_LIMIT = "512MB"

FilterValue = Annotated[
    str, StringConstraints(min_length=1, max_length=MAX_VALUE_CHARS)
]
IsoCode = Annotated[str, StringConstraints(pattern=r"^[A-Z]{3}$")]


class KmindexFilters(BaseModel):
    """
    What a reader narrowed a search's match set to.

    Values OR within a field and fields AND across, except that `country`
    (raw SRA strings, from the facet bars) and `country_iso` (ISO codes, from
    the map) are one dimension and OR together: clicking Kenya's bar and then
    Malawi on the map means either, not both.
    """

    model_config = ConfigDict(extra="forbid")

    assay_type: List[FilterValue] = Field(default=[], max_length=MAX_VALUES_PER_FIELD)
    country: List[FilterValue] = Field(default=[], max_length=MAX_VALUES_PER_FIELD)
    country_iso: List[IsoCode] = Field(default=[], max_length=MAX_VALUES_PER_FIELD)
    instrument: List[FilterValue] = Field(default=[], max_length=MAX_VALUES_PER_FIELD)
    library_layout: List[FilterValue] = Field(
        default=[], max_length=MAX_VALUES_PER_FIELD
    )
    platform: List[FilterValue] = Field(default=[], max_length=MAX_VALUES_PER_FIELD)
    score_min: Optional[float] = Field(default=None, ge=0, le=1)
    year_max: Optional[int] = Field(default=None, ge=1900, le=2100)
    year_min: Optional[int] = Field(default=None, ge=1900, le=2100)

    @model_validator(mode="after")
    def _ordered_years(self) -> "KmindexFilters":
        if (
            self.year_min is not None
            and self.year_max is not None
            and self.year_min > self.year_max
        ):
            raise ValueError("year range runs backwards")
        return self

    def is_empty(self) -> bool:
        """Whether this narrows nothing."""
        return not any(
            (
                self.assay_type,
                self.country,
                self.country_iso,
                self.instrument,
                self.library_layout,
                self.platform,
                self.score_min is not None,
                self.year_max is not None,
                self.year_min is not None,
            )
        )


# The list fields that are plain export columns, by parameter name.
_LIST_COLUMNS: Dict[str, str] = {
    "assay_type": "assay_type",
    "instrument": "instrument",
    "library_layout": "library_layout",
    "platform": "platform",
}

# Every dimension a predicate can be built for. Country is one dimension over
# two parameters; year and score are ranges.
_DIMENSIONS: Tuple[str, ...] = (
    "assay_type",
    "country",
    "instrument",
    "library_layout",
    "platform",
    "score",
    "year",
)

# Which dimension each cohort breakdown leaves out (standard drill-down), keyed
# by the facet names the cohort already uses, so the card can render the
# result unchanged. Organisms are fully filtered: there is no organism filter
# yet to leave out.
_FACET_DIMENSION: Dict[str, str] = {
    "assay_type": "assay_type",
    "country": "country",
    "instrument": "instrument",
    "librarylayout": "library_layout",
    "platform": "platform",
    "release_year": "year",
}

# Same expressions the cohort SQL folds sentinels into, applied to export
# columns that already had them folded at write time.
_FACET_COLUMN: Dict[str, str] = {
    "assay_type": "assay_type",
    "country": "country",
    "instrument": "instrument",
    "librarylayout": "library_layout",
    "platform": "platform",
    "release_year": "CAST(year(release_date) AS VARCHAR)",
}

# What the filtered table can be sorted by, over export columns. Score is
# absent on purpose: the file is already in rank order, so score order is
# file_row_number and is handled separately.
_SORT_COLUMNS: Dict[str, str] = {
    "accession": "accession",
    "country": "country",
    "organism": "organism",
    "platform": "platform",
    "release_date": "release_date",
}

# Columns that come from the mirror. A row with all of them NULL is a hit the
# mirror does not carry (about 0.44% of a real job). The export has no
# explicit flag for that yet, so this is the approximation the cohort's
# in_mirror is measured against until it does.
_METADATA_COLUMNS: Tuple[str, ...] = (
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
_IN_MIRROR = "(" + " OR ".join(f"{c} IS NOT NULL" for c in _METADATA_COLUMNS) + ")"

_HIT_COLUMNS: Tuple[str, ...] = ("accession", "score", "fp_correction", "shard")


def parse_filter_params(
    items: Iterable[Tuple[str, str]],
) -> Optional[KmindexFilters]:
    """
    Read the f.* query parameters into a filter.

    @param items: every query parameter, repeated keys included.
    @returns: the filter, or None when no f.* parameter was sent at all -- which
        is what keeps today's code path byte for byte for every existing caller.
    @raises ValueError: on an unknown field, a malformed range, or a value the
        model rejects (pydantic's ValidationError is a ValueError).
    """
    lists: Dict[str, List[str]] = {}
    scalars: Dict[str, Any] = {}
    seen = False
    for key, value in items:
        if not key.startswith(FILTER_PARAM_PREFIX):
            continue
        seen = True
        field = key[len(FILTER_PARAM_PREFIX) :]
        if field in _LIST_COLUMNS or field in ("country", "country_iso"):
            lists.setdefault(field, []).append(value)
        elif field == "year":
            if "year_min" in scalars or "year_max" in scalars:
                raise ValueError("f.year given more than once")
            scalars["year_min"], scalars["year_max"] = _parse_year(value)
        elif field == "score":
            if "score_min" in scalars:
                raise ValueError("f.score given more than once")
            try:
                scalars["score_min"] = float(value)
            except ValueError:
                raise ValueError(f"f.score is not a number: {value!r}") from None
        else:
            raise ValueError(f"Unknown filter field: {field!r}")
    if not seen:
        return None
    if NONE_VALUE in lists.get("country_iso", []):
        raise ValueError("f.country_iso takes ISO codes; use f.country=__none__")
    # Repeats of the same value are one value, and the order they arrived in
    # carries no meaning.
    deduped = {field: sorted(set(values)) for field, values in lists.items()}
    return KmindexFilters(**deduped, **scalars)


def _parse_year(value: str) -> Tuple[Optional[int], Optional[int]]:
    """'2015..2020', '2015..', '..2020' or '2015' as (min, max)."""
    low, sep, high = value.partition("..")
    if not sep:
        high = low
    try:
        bounds = (int(low) if low else None, int(high) if high else None)
    except ValueError:
        raise ValueError(f"f.year is not a year or a range: {value!r}") from None
    if bounds == (None, None):
        raise ValueError("f.year needs at least one bound")
    return bounds


def _list_predicate(
    column: str, values: List[str], name: str
) -> Tuple[str, Dict[str, Any]]:
    """`column` is one of `values`, with NONE_VALUE meaning IS NULL."""
    real = [v for v in values if v != NONE_VALUE]
    parts = []
    params: Dict[str, Any] = {}
    if NONE_VALUE in values:
        parts.append(f"{column} IS NULL")
    if real:
        parts.append(f"list_contains(${name}, {column})")
        params[name] = real
    return "(" + " OR ".join(parts) + ")", params


def _predicates(
    filters: KmindexFilters, iso_countries: List[str]
) -> Tuple[Dict[str, str], Dict[str, Any]]:
    """
    One boolean SQL expression per active dimension, and the values they bind.

    @param filters: the filter.
    @param iso_countries: raw country strings the filter's ISO codes resolved
        to (see resolve_iso_countries).
    @returns: {dimension: expression} for dimensions the filter narrows, and the
        named parameters those expressions reference.
    """
    predicates: Dict[str, str] = {}
    params: Dict[str, Any] = {}
    for field, column in _LIST_COLUMNS.items():
        values = getattr(filters, field)
        if values:
            predicates[field], bound = _list_predicate(column, values, f"v_{field}")
            params.update(bound)
    if filters.country or filters.country_iso:
        # An ISO code that resolves to no raw value in this file still narrows:
        # the reader asked for a country this search has no runs from, and the
        # honest answer is none, not everything.
        countries = sorted(set(filters.country) | set(iso_countries))
        if countries:
            predicates["country"], bound = _list_predicate(
                "country", countries, "v_country"
            )
            params.update(bound)
        else:
            predicates["country"] = "FALSE"
    if filters.year_min is not None or filters.year_max is not None:
        bounds = []
        if filters.year_min is not None:
            bounds.append("year(release_date) >= $year_min")
            params["year_min"] = filters.year_min
        if filters.year_max is not None:
            bounds.append("year(release_date) <= $year_max")
            params["year_max"] = filters.year_max
        predicates["year"] = "(" + " AND ".join(bounds) + ")"
    if filters.score_min is not None:
        predicates["score"] = "(score >= $score_min)"
        params["score_min"] = filters.score_min
    return predicates, params


def where(
    filters: KmindexFilters,
    exclude: Iterable[str] = (),
    iso_countries: Optional[List[str]] = None,
) -> Tuple[str, Dict[str, Any]]:
    """
    The filter as a WHERE clause body with bound values.

    @param filters: the filter.
    @param exclude: dimensions to leave out, for a breakdown counted over every
        filter but its own.
    @param iso_countries: raw strings the ISO codes resolved to.
    @returns: (sql, params). sql is "TRUE" when nothing is left to narrow.
    """
    predicates, params = _predicates(filters, iso_countries or [])
    kept = [expr for dim, expr in predicates.items() if dim not in set(exclude)]
    if not kept:
        return "TRUE", {}
    # Only the parameters the kept predicates use, since DuckDB rejects a named
    # parameter the statement never references.
    sql = " AND ".join(f"coalesce({expr}, false)" for expr in kept)
    return sql, {k: v for k, v in params.items() if f"${k}" in sql}


def _connect() -> duckdb.DuckDBPyConnection:
    """A private connection for one filtered read."""
    return duckdb.connect(
        config={
            "memory_limit": _FILTER_MEMORY_LIMIT,
            "temp_directory": tempfile.gettempdir(),
            "threads": _FILTER_THREADS,
        }
    )


def resolve_iso_countries(
    con: duckdb.DuckDBPyConnection, path: Path, codes: List[str]
) -> List[str]:
    """
    The raw country strings in this export that map to any of `codes`.

    The map keys countries by ISO code and the export carries SRA's raw string,
    and several raw strings share a code (Gaza Strip and West Bank are both
    PSE), so the mapping runs over the file's own distinct values -- a few
    hundred at most -- with the same lookup the geography rollup uses.
    """
    if not codes:
        return []
    wanted = set(codes)
    rows = con.execute(
        "SELECT DISTINCT country FROM read_parquet(?) WHERE country IS NOT NULL",
        [str(path)],
    ).fetchall()
    resolved = []
    for (value,) in rows:
        match = country_iso.lookup(value)
        if match is not None and match.iso_a3 in wanted:
            resolved.append(value)
    return sorted(resolved)


def _has_coordinates(con: duckdb.DuckDBPyConnection, path: Path) -> bool:
    """Whether this export carries lat/lon (written against a v6+ mirror)."""
    names = {
        row[0]
        for row in con.execute(
            "SELECT name FROM parquet_schema(?)", [str(path)]
        ).fetchall()
    }
    return {"latitude", "longitude"} <= names


def _order_by(sort: str, order: str) -> str:
    """ORDER BY body for a filtered page; rank breaks every tie."""
    if sort == "score":
        # The file is in rank order, so ascending score is that order reversed
        # -- the same thing the unfiltered path does to its listing.
        return "file_row_number" + (" DESC" if order == "asc" else "")
    column = _SORT_COLUMNS.get(sort)
    if column is None:
        raise ValueError(f"Cannot sort a filtered page by {sort!r}")
    direction = "DESC" if order == "desc" else "ASC"
    return f"{column} {direction} NULLS LAST, file_row_number"


def _hit_from_row(names: List[str], row: Tuple[Any, ...]) -> Dict[str, Any]:
    """An export row shaped as a KmindexHit dict."""
    values = dict(zip(names, row))
    metadata = {
        "assay_type": values.get("assay_type"),
        "bioproject": values.get("bioproject"),
        "country": values.get("country"),
        "instrument": values.get("instrument"),
        "library_layout": values.get("library_layout"),
        "mbases": values.get("mbases"),
        "organism": values.get("organism"),
        "platform": values.get("platform"),
        "release_date": (
            str(values["release_date"]) if values.get("release_date") else None
        ),
        "study": values.get("study"),
    }
    return {
        "accession": values["accession"],
        "fp_correction": values.get("fp_correction"),
        "score": values["score"],
        "shard": values["shard"],
        # Same posture as the unfiltered path: a run the mirror does not carry
        # has no metadata object rather than one full of nulls.
        "sra": metadata if any(v is not None for v in metadata.values()) else None,
    }


def subset_page(
    path: Path,
    filters: KmindexFilters,
    limit: int,
    offset: int,
    sort: str = "score",
    order: str = "desc",
) -> Dict[str, Any]:
    """
    One page of the filtered match set, and how many rows match in all.

    Pages the whole filtered set, not the top 50,000: filtering country =
    Malawi inside the capped listing would miss every Malawi run below the
    cap. Rows already carry their metadata, so there is no annotation pass.

    @param path: the job's current export.
    @param filters: the filter.
    @param limit: page size.
    @param offset: rows to skip.
    @param sort: a KmindexSort column.
    @param order: asc or desc.
    @returns: {"hits": [...], "matched": int}.
    """
    con = _connect()
    try:
        iso = resolve_iso_countries(con, path, filters.country_iso)
        clause, params = where(filters, iso_countries=iso)
        params = {**params, "path": str(path)}
        matched = con.execute(
            f"SELECT count(*) FROM read_parquet($path) WHERE {clause}", params
        ).fetchone()[0]
        columns = ", ".join(_HIT_COLUMNS + _METADATA_COLUMNS)
        cursor = con.execute(
            f"""
            SELECT {columns}
            FROM read_parquet($path, file_row_number=true)
            WHERE {clause}
            ORDER BY {_order_by(sort, order)}
            LIMIT $limit OFFSET $offset
            """,
            {**params, "limit": limit, "offset": offset},
        )
        names = [d[0] for d in cursor.description]
        hits = [_hit_from_row(names, row) for row in cursor.fetchall()]
    finally:
        con.close()
    return {"hits": hits, "matched": matched}


def _summary_sql(predicates: Dict[str, str], with_coordinates: bool) -> str:
    """
    Every breakdown the cohort card and map draw, in one scan of the file.

    Each dimension's predicate becomes a boolean column, evaluated once per
    row. Each breakdown then counts with `FILTER (WHERE ...)` over every
    predicate but its own, and GROUPING SETS gives each breakdown its own
    grouping in the same pass. A row that fails two or more predicates cannot
    be counted by any breakdown, so it is dropped before the aggregate.

    One statement rather than one per breakdown because the scan is the cost,
    and brc-dev is a shared VM: seven concurrent scans of a 5M-row file per
    request is the wrong default however fast each one is warm.
    """
    flags = ",\n                   ".join(
        f"coalesce({predicates.get(dim, 'TRUE')}, false) AS p_{dim}"
        for dim in _DIMENSIONS
    )
    facets = ",\n                   ".join(
        f"{_FACET_COLUMN[name]} AS {name}" for name, _expr in _COHORT_FACETS
    )
    coordinates = ", latitude, longitude" if with_coordinates else ""

    def passing(excluded: Optional[str]) -> str:
        return " AND ".join(f"p_{d}" for d in _DIMENSIONS if d != excluded)

    counts = ",\n               ".join(
        f"count(*) FILTER (WHERE {passing(_FACET_DIMENSION[name])}) AS n_{name}"
        for name, _expr in _COHORT_FACETS
    )
    failing = " + ".join(f"(NOT p_{d})::INT" for d in _DIMENSIONS)
    sets = [f"({name})" for name, _expr in _COHORT_FACETS] + ["(organism)"]
    tags = [
        f"WHEN grouping({name}) = 0 THEN '{name}'" for name, _expr in _COHORT_FACETS
    ] + ["WHEN grouping(organism) = 0 THEN 'organism'"]
    location_columns = ""
    if with_coordinates:
        sets.append("(latitude, longitude)")
        tags.append("WHEN grouping(latitude) = 0 THEN 'location'")
        location_columns = f""",
               latitude, longitude,
               count(*) FILTER (WHERE {passing("country")}) AS n_location,
               sum(score) FILTER (WHERE {passing("country")}) AS score_total,
               count(score) FILTER (WHERE {passing("country")}) AS scored"""
    values = ", ".join([name for name, _expr in _COHORT_FACETS] + ["organism"])
    return f"""
        WITH b AS (
            SELECT {facets},
                   organism, score{coordinates},
                   {_IN_MIRROR} AS in_mirror,
                   {flags}
            FROM read_parquet($path))
        SELECT CASE {" ".join(tags)} END AS facet,
               coalesce({values}) AS value,
               count(*) FILTER (WHERE {passing(None)}) AS n_full,
               {counts}{location_columns}
        FROM b
        WHERE in_mirror AND ({failing}) <= 1
        GROUP BY GROUPING SETS ({", ".join(sets)})
    """


def _scalars_sql(clause: str) -> str:
    """The fully filtered headline numbers, which do not merge across groups."""
    return f"""
        SELECT count(*) AS matched,
               count(*) FILTER (WHERE {_IN_MIRROR}) AS in_mirror,
               count(DISTINCT organism) FILTER (WHERE {_IN_MIRROR}) AS organisms,
               count(DISTINCT bioproject) FILTER (WHERE {_IN_MIRROR}) AS bioprojects,
               count(DISTINCT study) FILTER (WHERE {_IN_MIRROR}) AS studies,
               count(DISTINCT country) FILTER (WHERE {_IN_MIRROR}) AS countries
        FROM read_parquet($path) WHERE {clause}
    """


def subset_summary(path: Path, filters: KmindexFilters) -> Dict[str, Any]:
    """
    The cohort and geography of the filtered match set, shaped exactly as the
    unfiltered ones so the card renders them unchanged.

    Headline numbers (matched, in_mirror, the distinct counts, top organisms)
    apply every filter. Each facet, the year timeline and the map leave their
    own field out, so after picking ILLUMINA the platform bars still show the
    other platforms. Each breakdown's parts still sum to its own total --
    which is what the card divides by -- but not to in_mirror once a filter is
    active, because each is counted over a different set.

    @param path: the job's current export.
    @param filters: the filter.
    @returns: {"cohort", "geography", "matched"}.
    """
    con = _connect()
    try:
        iso = resolve_iso_countries(con, path, filters.country_iso)
        predicates, params = _predicates(filters, iso)
        with_coordinates = _has_coordinates(con, path)
        rows = con.execute(
            _summary_sql(predicates, with_coordinates),
            {**params, "path": str(path)},
        ).fetchall()
        clause, clause_params = where(filters, iso_countries=iso)
        scalars = con.execute(
            _scalars_sql(clause), {**clause_params, "path": str(path)}
        ).fetchone()
    finally:
        con.close()

    matched, in_mirror, organisms, bioprojects, studies, countries = scalars
    facet_index = {name: i for i, (name, _expr) in enumerate(_COHORT_FACETS)}
    grouped: Dict[str, List[Tuple[Optional[str], int]]] = {
        name: [] for name, _expr in _COHORT_FACETS
    }
    organism_counts: List[Tuple[str, int]] = []
    located: Optional[List[Tuple[float, float, int, Optional[float], int]]] = (
        [] if with_coordinates else None
    )
    for row in rows:
        facet, value, n_full = row[0], row[1], row[2]
        if facet in facet_index:
            n = row[3 + facet_index[facet]]
            # A value every row of which fails the other filters is not in
            # this breakdown at all, not a zero-height bar.
            if n:
                grouped[facet].append((value, n))
        elif facet == "organism":
            if value is not None and n_full:
                organism_counts.append((value, n_full))
        elif facet == "location" and located is not None:
            lat, lon, n, score_total, scored = row[-5:]
            if lat is not None and lon is not None and n:
                located.append((lat, lon, n, score_total, scored))

    organism_counts.sort(key=lambda vn: (-vn[1], vn[0]))
    cohort = {
        "bioprojects": bioprojects,
        "countries": countries,
        "facets": [_shape_facet(name, grouped[name]) for name, _ in _COHORT_FACETS],
        "in_mirror": in_mirror,
        "organisms": organisms,
        "studies": studies,
        "top_organisms": [
            {"count": n, "value": value}
            for value, n in organism_counts[:_COHORT_TOP_ORGANISMS]
        ],
        "total": matched,
    }
    geography = _shape_geography(grouped["country"], located)
    return {"cohort": cohort, "geography": geography, "matched": matched}


def subset_row_count(path: Path, filters: KmindexFilters) -> int:
    """How many export rows the filter keeps, for the download's filename."""
    con = _connect()
    try:
        iso = resolve_iso_countries(con, path, filters.country_iso)
        clause, params = where(filters, iso_countries=iso)
        return con.execute(
            f"SELECT count(*) FROM read_parquet($path) WHERE {clause}",
            {**params, "path": str(path)},
        ).fetchone()[0]
    finally:
        con.close()


def iter_subset_tsv(path: Path, filters: KmindexFilters) -> Iterator[bytes]:
    """
    Stream the filtered export as TSV, in rank order, a batch at a time.

    iter_export_tsv with a WHERE: the header comes off the file, and the
    connection is closed when the generator is, including on a client that
    disconnects mid-download.
    """
    con = _connect()
    try:
        iso = resolve_iso_countries(con, path, filters.country_iso)
        clause, params = where(filters, iso_countries=iso)
        rows = con.execute(
            f"""
            SELECT * EXCLUDE (file_row_number)
            FROM read_parquet($path, file_row_number=true)
            WHERE {clause} ORDER BY file_row_number
            """,
            {**params, "path": str(path)},
        )
        yield ("\t".join(name for name, *_rest in rows.description) + "\n").encode()
        while batch := rows.fetchmany(_EXPORT_TSV_BATCH):
            yield "".join(
                "\t".join(map(_tsv_field, row)) + "\n" for row in batch
            ).encode()
    finally:
        con.close()
