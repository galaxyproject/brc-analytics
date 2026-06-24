"""Catalog Query IR + in-process DuckDB executor for the assistant.

A typed, column-agnostic query the model authors and the backend compiles to SQL:
  - `filters` is a flat list of {field, op, value}, AND-composed across fields.
  - within a field: OR via `in`/`contains_any`; range/AND via repeated predicates.
  - cross-field OR is deliberately not expressible.
  - `field`/`facet_by`/`sort` are validated against a per-entity allowlist.
  - the executor returns a summary ({total, returned, truncated, facets, rows}),
    never the raw corpus; facets attach automatically when a list is truncated so
    the model can offer narrowing instead of paging.

Assembly-first; organism is sketched. Workflows stay on their dedicated tools.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger(__name__)


class FieldType(str, Enum):
    """How a queryable field is typed — decides how a filter compiles to SQL.

    The same column name can be typed differently per entity (e.g. otherTaxa is a
    VARCHAR[] on assembly but scalar on organism), which is why types are declared
    per entity in ENTITY_SCHEMA rather than in one global set.
    """

    SCALAR = "scalar"  # plain column: eq/ne/in/not_in (no range)
    NUMERIC = "numeric"  # scalar that also supports range ops (gt/gte/lt/lte)
    LIST = "list"  # VARCHAR[] column: membership; eq/in coerce to membership


# Bare aliases so the per-entity field tables below read like a schema.
SCALAR, NUMERIC, LIST = FieldType.SCALAR, FieldType.NUMERIC, FieldType.LIST


@dataclass
class EntitySchema:
    """The catalog schema for one entity, declared once.

    Each queryable field is declared with its FieldType; the derived views
    (`field_names` / `list_fields` / `numeric_fields` / `configured_columns`) are
    computed from that single declaration, so the allowlist, list-ness and
    numeric-ness can never drift apart.
    """

    # Field name -> type. The model may filter / sort / facet on exactly these.
    fields: dict[str, FieldType]
    # Curated projection for `list` rows (bounded tokens vs SELECT *). May include
    # display-only columns absent from `fields` (e.g. ucscBrowserUrl) — shown but
    # not filterable; connect()'s drift check still requires them to exist.
    display: tuple[str, ...]
    # Default ordering for a `list` with no explicit sort, as (field, desc) terms.
    default_order: tuple[tuple[str, bool], ...] = ()
    # Facets auto-returned on a truncated list so the model can offer narrowing.
    auto_facets: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        self.field_names: set[str] = set(self.fields)
        self.list_fields: set[str] = {
            f for f, t in self.fields.items() if t is FieldType.LIST
        }
        self.numeric_fields: set[str] = {
            f for f, t in self.fields.items() if t is FieldType.NUMERIC
        }
        self.configured_columns: set[str] = self.field_names | set(self.display)
        # Fail at import on a misdeclared schema rather than late with malformed
        # SQL or an IndexError: a `list` always needs a projection, and every
        # column named for ordering/faceting must be a configured column (so the
        # connect() drift check guarantees it exists in the table).
        if not self.display:
            raise ValueError("EntitySchema.display must be non-empty")
        referenced = {field for field, _ in self.default_order} | set(self.auto_facets)
        unknown = referenced - self.configured_columns
        if unknown:
            raise ValueError(
                f"EntitySchema default_order/auto_facets reference unknown "
                f"column(s) {sorted(unknown)}"
            )


# Single source of truth for the catalog schema the query engine knows about.
# Only "assembly" is queryable today (see the `entity` Literal on CatalogQuery and
# the assembly-only table in connect()); the organism schema is kept as roadmap
# data — to enable it, add "organism" to that Literal and load its table.
ENTITY_SCHEMA: dict[str, EntitySchema] = {
    "assembly": EntitySchema(
        fields={
            "accession": SCALAR,
            "ncbiTaxonomyId": SCALAR,
            "speciesTaxonomyId": SCALAR,
            "lineageTaxonomyIds": LIST,
            "taxonomicLevelDomain": SCALAR,
            "taxonomicLevelKingdom": SCALAR,
            "taxonomicLevelPhylum": SCALAR,
            "taxonomicLevelClass": SCALAR,
            "taxonomicLevelOrder": SCALAR,
            "taxonomicLevelFamily": SCALAR,
            "taxonomicLevelGenus": SCALAR,
            "taxonomicLevelSpecies": SCALAR,
            "taxonomicLevelStrain": SCALAR,
            "taxonomicLevelSerotype": SCALAR,
            "taxonomicLevelIsolate": SCALAR,
            "taxonomicLevelRealm": SCALAR,
            "taxonomicGroup": LIST,
            "otherTaxa": LIST,
            "level": SCALAR,
            "isRef": SCALAR,
            "ploidy": LIST,
            "priority": SCALAR,
            "priorityPathogenName": SCALAR,
            "annotationStatus": SCALAR,
            "length": NUMERIC,
            "gcPercent": NUMERIC,
            "scaffoldN50": NUMERIC,
            "scaffoldL50": NUMERIC,
            "scaffoldCount": NUMERIC,
            "chromosomes": NUMERIC,
            "strainName": SCALAR,
            "coverage": SCALAR,
            "commonName": SCALAR,
            "geneModelUrl": SCALAR,
        },
        # ploidy is intentionally omitted from display — it's an organism-level
        # attribute (constant across an organism's assemblies), so a per-row column
        # is redundant. It stays a filterable field, just not displayed.
        display=(
            "accession",
            "taxonomicLevelSpecies",
            "strainName",
            "level",
            "isRef",
            "length",
            "scaffoldN50",
            "geneModelUrl",
            "ucscBrowserUrl",
        ),
        # Most relevant first: the reference assembly, then best quality (largest
        # scaffold N50), with accession as a stable tiebreaker — beats ordering by
        # an arbitrary accession id.
        default_order=(("isRef", True), ("scaffoldN50", True), ("accession", False)),
        auto_facets=("level", "isRef"),
    ),
    "organism": EntitySchema(
        fields={
            "ncbiTaxonomyId": SCALAR,
            "commonName": SCALAR,
            "assemblyCount": NUMERIC,
            "priority": SCALAR,
            "priorityPathogenName": SCALAR,
            "taxonomicGroup": LIST,
            "taxonomicLevelDomain": SCALAR,
            "taxonomicLevelKingdom": SCALAR,
            "taxonomicLevelPhylum": SCALAR,
            "taxonomicLevelClass": SCALAR,
            "taxonomicLevelOrder": SCALAR,
            "taxonomicLevelFamily": SCALAR,
            "taxonomicLevelGenus": SCALAR,
            "taxonomicLevelSpecies": SCALAR,
        },
        display=(
            "ncbiTaxonomyId",
            "taxonomicLevelSpecies",
            "commonName",
            "assemblyCount",
        ),
        auto_facets=("taxonomicLevelDomain",),
    ),
}

# Cap on buckets returned per faceted column (top-N by count) — keeps a facet on
# a high-cardinality field from returning thousands of rows.
_FACET_LIMIT = 50

# Max size (bytes) of a single JSON object read_json_auto will accept. The
# catalog is one big array; this raises the per-record ceiling well above
# DuckDB's default so a large assembly record can't trip the parser.
_MAX_JSON_OBJECT_SIZE = 20_000_000

# DuckDB base type names treated as numeric for the connect() schema-drift check.
_NUMERIC_DUCKDB_TYPES = {
    "TINYINT",
    "SMALLINT",
    "INTEGER",
    "BIGINT",
    "HUGEINT",
    "UTINYINT",
    "USMALLINT",
    "UINTEGER",
    "UBIGINT",
    "UHUGEINT",
    "FLOAT",
    "DOUBLE",
    "REAL",
    "DECIMAL",
    "NUMERIC",
}


def _schema_issues(
    coltypes: dict[str, str], entity: str
) -> tuple[list[str], list[str]]:
    """Compare an entity's loaded columns (name -> UPPERCASE DuckDB type) against
    its declared schema. Returns (missing, mistyped):

    - missing: configured columns absent from the table.
    - mistyped: numeric fields not inferred numeric, or list fields not inferred
      as lists — these compile to SQL that errors or mis-sorts at query time.

    Scoped to the entity's own fields: a column that is a list on another entity
    (e.g. assembly's otherTaxa) must not be flagged just because it appears as a
    scalar here.
    """
    schema = ENTITY_SCHEMA[entity]
    actual = set(coltypes)
    missing = sorted(schema.configured_columns - actual)
    mistyped = sorted(
        f"{c}={coltypes[c]}"
        for c in schema.numeric_fields & actual
        if coltypes[c].split("(")[0] not in _NUMERIC_DUCKDB_TYPES
    ) + sorted(
        f"{c}={coltypes[c]}"
        for c in schema.list_fields & actual
        if not coltypes[c].endswith("[]")
    )
    return missing, mistyped


class Op(str, Enum):
    eq = "eq"
    ne = "ne"
    in_ = "in"
    not_in = "not_in"
    gt = "gt"
    gte = "gte"
    lt = "lt"
    lte = "lte"
    contains = "contains"  # scalar value in a list column
    contains_any = "contains_any"  # any(values) in a list column (OR within a field)
    is_null = "is_null"
    not_null = "not_null"


Scalar = Union[str, int, float, bool]


class Filter(BaseModel):
    field: str
    op: Op
    value: Optional[Union[Scalar, list[Scalar]]] = None


class Sort(BaseModel):
    field: str
    desc: bool = False


class CatalogQuery(BaseModel):
    """A structured query over the BRC catalog; compiled to SQL and run."""

    entity: Literal["assembly"] = "assembly"
    filters: list[Filter] = Field(default_factory=list)
    operation: Literal["count", "list", "facets"] = "list"
    # Each facet column is a separate GROUP BY query in execute(); cap the count
    # so one call can't fan out into a burst of DB work. Realistic group-bys use
    # one or two columns — 4 is comfortable headroom.
    facet_by: list[str] = Field(default_factory=list, max_length=4)
    # Bound the page to a small, fixed size so a `list` is always a short, fully
    # rendered table — never a corpus dump or a variable-length one. The cap is the
    # default (the model can't inflate it); over it we truncate and offer to narrow
    # or sort rather than page.
    limit: int = Field(default=10, ge=1, le=10)
    offset: int = Field(default=0, ge=0)
    sort: list[Sort] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate(self) -> "CatalogQuery":
        # entity/operation are Literals — pydantic already rejects bad values and
        # advertises the allowed set in the tool schema.
        if self.operation == "facets" and not self.facet_by:
            raise ValueError("operation 'facets' needs at least one facet_by field")
        schema = ENTITY_SCHEMA[self.entity]
        allowed = schema.field_names
        referenced = (
            [f.field for f in self.filters]
            + list(self.facet_by)
            + [s.field for s in self.sort]
        )
        unknown = sorted({f for f in referenced if f not in allowed})
        if unknown:
            raise ValueError(
                f"unknown field(s) {unknown} for entity {self.entity!r}; "
                f"valid fields: {sorted(allowed)}"
            )
        # GROUP BY on a list column buckets by whole-list equality (and yields
        # list-repr keys), not per-element counts — reject it rather than mislead.
        list_fields = schema.list_fields
        numeric_fields = schema.numeric_fields
        list_facets = sorted({c for c in self.facet_by if c in list_fields})
        if list_facets:
            raise ValueError(
                f"cannot facet on list field(s) {list_facets}; "
                "group-by needs a scalar field"
            )
        for f in self.filters:
            # Every op except the null checks needs a value; without this, a None
            # compiles to a comparison against NULL that silently matches nothing.
            if f.op not in (Op.is_null, Op.not_null) and f.value is None:
                raise ValueError(f"{f.op.value} needs a value")
            # (A None *inside* a value list — IN (NULL, ...) — is already rejected
            # by the Filter type: list[Scalar] excludes None, so it can't occur.)
            if f.op in (Op.gt, Op.gte, Op.lt, Op.lte):
                if f.field not in numeric_fields:
                    raise ValueError(
                        f"range op {f.op.value} needs a numeric field, got {f.field!r}"
                    )
                # bool is an int subclass, so guard it explicitly.
                if isinstance(f.value, bool) or not isinstance(f.value, (int, float)):
                    raise ValueError(
                        f"range op {f.op.value} needs a numeric value, got {f.value!r}"
                    )
            # eq/ne on a scalar field take a scalar; a list value would compile to
            # `col = [..]` and error at execution. (On a list field, eq/ne coerce
            # to membership, so a list there is fine.)
            if (
                f.op in (Op.eq, Op.ne)
                and f.field not in list_fields
                and isinstance(f.value, list)
            ):
                raise ValueError(
                    f"{f.op.value} on {f.field!r} needs a scalar value; "
                    "use in/not_in for multiple values"
                )
            if f.op in (Op.contains, Op.contains_any) and f.field not in list_fields:
                raise ValueError(f"{f.op.value} needs a list field, got {f.field!r}")
            # `contains` tests one scalar element (list_contains needs a scalar);
            # a list value belongs to `contains_any`.
            if f.op is Op.contains and isinstance(f.value, list):
                raise ValueError(
                    "contains needs a scalar value; use contains_any for a list"
                )
            # An empty list value is never meaningful: invalid SQL (IN ()) or a
            # silent match-nothing/everything. Reject it for every op that
            # consumes a list — in/not_in/contains_any always, plus eq/ne when
            # they coerce to list membership on a list field.
            consumes_list = f.op in (Op.in_, Op.not_in, Op.contains_any) or (
                f.op in (Op.eq, Op.ne) and f.field in list_fields
            )
            if consumes_list and isinstance(f.value, list) and not f.value:
                raise ValueError(f"{f.op.value} needs a non-empty value list")
        return self


_SQL_BINOP = {
    Op.eq: "=",
    Op.ne: "!=",
    Op.gt: ">",
    Op.gte: ">=",
    Op.lt: "<",
    Op.lte: "<=",
}


def _qi(identifier: str) -> str:
    """Quote a SQL identifier (column/table name) for safe interpolation.

    Every dynamic identifier reaching the SQL string is allowlist-validated by
    the CatalogQuery model first; quoting is defense-in-depth and also lets the
    catalog use names that need quoting (mixed case, reserved words). DuckDB
    folds unquoted identifiers to lower case, so quoting pins the exact case —
    the field allowlist already carries the catalog's canonical casing.
    """
    return '"' + identifier.replace('"', '""') + '"'


def _order_by(terms: Sequence[tuple[str, bool]]) -> str:
    """Build an ORDER BY body from (field, desc) terms — quoted, with NULLS LAST.

    NULLS LAST so a column with missing values keeps the rows that have data at
    the top of the page (DuckDB defaults NULLs first on DESC).
    """
    return ", ".join(
        f"{_qi(field)} {'DESC' if desc else 'ASC'} NULLS LAST" for field, desc in terms
    )


def _list_membership(col: str) -> str:
    """SQL truthy when list column `col` shares any element with the ? param list."""
    return f"len(list_intersect({col}, ?)) > 0"


def _as_list(value) -> list:
    """Normalize a scalar-or-list filter value to a list."""
    return value if isinstance(value, list) else [value]


def _list_text(value) -> list[str]:
    """Stringify membership value(s) for a VARCHAR[] list column.

    Every list-typed column is VARCHAR[] (taxonomy-id lists, ploidy, ...), but
    the model naturally passes a taxid as a JSON number — and
    `list_contains(VARCHAR[], INTEGER)` / `list_intersect` is a DuckDB binder
    error, not a no-match. Compare as text so a numeric taxid still works.
    """
    return [str(v) for v in _as_list(value)]


def _compile_predicate(f: Filter, entity: str) -> tuple[str, list]:
    col = _qi(f.field)
    if f.op is Op.is_null:
        return f"{col} IS NULL", []
    if f.op is Op.not_null:
        return f"{col} IS NOT NULL", []
    # On a list column, scalar membership ops (eq/ne/in/not_in) mean list
    # membership — a list never equals a scalar, so this is the only sensible
    # reading. Coercing it lets the model's natural `eq`/`in` phrasing work
    # without a failed round-trip.
    if f.field in ENTITY_SCHEMA[entity].list_fields and f.op in (
        Op.eq,
        Op.ne,
        Op.in_,
        Op.not_in,
    ):
        expr = _list_membership(col)
        if f.op in (Op.ne, Op.not_in):
            # NULL-safe negation: a row with no value is "not a member" too, so
            # count it — otherwise count(eq) + count(ne) wouldn't sum to total.
            return f"(NOT ({expr}) OR {col} IS NULL)", [_list_text(f.value)]
        return expr, [_list_text(f.value)]
    if f.op in (Op.in_, Op.not_in):
        vals = _as_list(f.value)
        ph = ", ".join(["?"] * len(vals))
        if f.op is Op.not_in:
            return f"({col} NOT IN ({ph}) OR {col} IS NULL)", vals
        return f"{col} IN ({ph})", vals
    if f.op is Op.ne:
        # NULL-safe inequality (SQL `col != x` drops NULL rows).
        return f"({col} != ? OR {col} IS NULL)", [f.value]
    if f.op is Op.contains:
        return f"list_contains({col}, ?)", [str(f.value)]
    if f.op is Op.contains_any:
        return _list_membership(col), [_list_text(f.value)]
    return f"{col} {_SQL_BINOP[f.op]} ?", [f.value]


def _compile_where(q: CatalogQuery) -> tuple[str, list]:
    if not q.filters:
        return "TRUE", []
    frags, params = [], []
    for f in q.filters:
        frag, p = _compile_predicate(f, q.entity)
        frags.append(frag)
        params.extend(p)
    return " AND ".join(frags), params


def connect(catalog_dir: str):
    """Load the catalog into an in-memory DuckDB connection (assembly table).

    Returns the connection, or None if the catalog can't be loaded (the caller
    degrades to a "query engine unavailable" tool response).

    Concurrency invariant: the assistant's tools are sync and run on the asyncio
    event-loop thread, so this single connection is only ever touched by one
    thread at a time and needs no lock. DuckDB connections are not thread-safe,
    and per the DuckDB docs `cursor()` does NOT help — it is another handle on the
    same connection, and cursors from one connection cannot run queries at the
    same time. If tool execution is ever moved to a threadpool, "each thread must
    have its own connection" — but a fresh `duckdb.connect()` here would be a new,
    empty in-memory database without the loaded table, so true concurrency would
    require loading the catalog into a file-backed/shared DuckDB database, or
    serializing access through a single-thread executor.
    """
    import duckdb

    json_path = Path(catalog_dir) / "assemblies.json"
    if not json_path.is_file():
        logger.warning(
            "Catalog assemblies not found at %s — query engine disabled", json_path
        )
        return None

    # Build into a local handle and publish only on full success, so a load
    # failure can't leave a half-initialized connection in play. Distinct except
    # arms give an actionable log line instead of one flattened traceback.
    con: Optional["duckdb.DuckDBPyConnection"] = None
    try:
        con = duckdb.connect()
        # Bind the path as a parameter so DuckDB handles any special characters
        # (no bespoke quoting needed).
        con.execute(
            "CREATE TABLE assembly AS "
            "SELECT * FROM read_json_auto(?, "
            f"format='array', maximum_object_size={_MAX_JSON_OBJECT_SIZE})",
            [str(json_path)],
        )
        total = con.execute("SELECT count(*) FROM assembly").fetchone()[0]
        # The field allowlist and display projection are hand-maintained against
        # the catalog schema. If the schema has drifted (a configured column is
        # gone), fail closed — disable the engine rather than serve queries that
        # would error or silently mislead. A drift is a build problem to fix, not
        # something to paper over.
        coltypes = {
            row[0]: str(row[1]).upper()
            for row in con.execute("DESCRIBE assembly").fetchall()
        }
        missing, mistyped = _schema_issues(coltypes, "assembly")
        if missing or mistyped:
            logger.error(
                "Catalog query disabled: assembly schema has drifted from "
                "catalog_query.py — missing columns %s, mistyped %s",
                missing,
                mistyped,
            )
            con.close()
            return None
    except duckdb.IOException as exc:
        logger.error("Could not read catalog at %s: %s", json_path, exc)
    except duckdb.CatalogException as exc:
        logger.error(
            "Catalog at %s is missing an expected structure: %s", json_path, exc
        )
    except duckdb.Error as exc:
        logger.error("Failed to load catalog into DuckDB from %s: %s", json_path, exc)
    else:
        logger.info("Catalog query engine (DuckDB) loaded: %s assemblies", f"{total:,}")
        return con

    # Reached only on a caught failure: close the opened handle and stay disabled.
    if con is not None:
        con.close()
    return None


def execute(q: CatalogQuery, con) -> dict:
    """Run a CatalogQuery against DuckDB; return the summary contract.

    Entity/column/sort identifiers are interpolated into SQL, not parameterized
    (SQL identifiers can't be) — the CatalogQuery allowlist validator is what
    gates that interpolation, so don't loosen it without revisiting this.
    """
    where, params = _compile_where(q)
    cap = q.limit

    entity = _qi(q.entity)

    def _facets(cols: Sequence[str]) -> dict:
        out = {}
        for col in cols:
            qcol = _qi(col)
            # Cap to the top buckets by count — a high-cardinality field (e.g.
            # a species column) would otherwise return thousands of buckets.
            rows = con.execute(
                f"SELECT {qcol} AS k, count(*) AS c FROM {entity} WHERE {where} "
                # `, k` is a stable tiebreaker so equal-count buckets (and which
                # ones fall at the LIMIT boundary) don't shuffle across runs.
                f"GROUP BY {qcol} ORDER BY c DESC, k LIMIT {_FACET_LIMIT}",
                params,
            ).fetchall()
            out[col] = {("(none)" if k is None else str(k)): c for k, c in rows}
        return out

    total = con.execute(
        f"SELECT count(*) FROM {entity} WHERE {where}", params
    ).fetchone()[0]
    result: dict = {"total": total}
    if q.operation == "count":
        return result
    if q.operation == "facets":
        result["facets"] = _facets(q.facet_by)
        return result

    # Display columns are validated against the table at connect() time (the
    # engine fails closed on drift), so the projection is trusted here.
    schema = ENTITY_SCHEMA[q.entity]
    cols = schema.display
    # Always emit an ORDER BY so the capped page / truncation is reproducible
    # (LIMIT without a total order is unordered).
    if q.sort:
        # Honor the requested sort, appending a stable key (the first display
        # column) as a tiebreaker so equal-sort rows can't shuffle at the boundary.
        terms = [(s.field, s.desc) for s in q.sort]
        tiebreak = cols[0]
        if tiebreak not in {s.field for s in q.sort}:
            terms.append((tiebreak, False))
        order = "ORDER BY " + _order_by(terms)
    else:
        # No explicit sort: most-relevant-first per the entity's default_order;
        # fall back to the first display column for an entity without a default.
        default = schema.default_order
        order = "ORDER BY " + (_order_by(default) if default else _qi(cols[0]))
    select = ", ".join(_qi(c) for c in cols)
    cur = con.execute(
        f"SELECT {select} FROM {entity} WHERE {where} {order} "
        f"LIMIT {cap + 1} OFFSET {q.offset}",
        params,
    )
    colnames = [d[0] for d in cur.description]
    raw = cur.fetchall()
    rows = [dict(zip(colnames, r, strict=True)) for r in raw]
    result["truncated"] = len(rows) > cap
    result["rows"] = rows[:cap]
    result["returned"] = len(result["rows"])
    if result["truncated"]:
        # Auto-facets are narrowing hints: only surface a breakdown that actually
        # discriminates (>1 bucket). A single-bucket facet (e.g. isRef={No: N}
        # when nothing is a reference) offers no choice, so drop it.
        auto = {
            col: buckets
            for col, buckets in _facets(schema.auto_facets).items()
            if len(buckets) > 1
        }
        if auto:
            result["facets"] = auto
    return result
