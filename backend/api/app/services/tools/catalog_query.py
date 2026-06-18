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
from enum import Enum
from pathlib import Path
from typing import Optional, Union

from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger(__name__)

ASSEMBLY_FIELDS: set[str] = {
    "accession",
    "ncbiTaxonomyId",
    "speciesTaxonomyId",
    "lineageTaxonomyIds",
    "taxonomicLevelDomain",
    "taxonomicLevelKingdom",
    "taxonomicLevelPhylum",
    "taxonomicLevelClass",
    "taxonomicLevelOrder",
    "taxonomicLevelFamily",
    "taxonomicLevelGenus",
    "taxonomicLevelSpecies",
    "taxonomicLevelStrain",
    "taxonomicLevelSerotype",
    "taxonomicLevelIsolate",
    "taxonomicLevelRealm",
    "taxonomicGroup",
    "otherTaxa",
    "level",
    "isRef",
    "ploidy",
    "priority",
    "priorityPathogenName",
    "annotationStatus",
    "length",
    "gcPercent",
    "scaffoldN50",
    "scaffoldL50",
    "scaffoldCount",
    "chromosomes",
    "strainName",
    "coverage",
    "commonName",
    "geneModelUrl",
}

ORGANISM_FIELDS: set[str] = {
    "ncbiTaxonomyId",
    "commonName",
    "assemblyCount",
    "priority",
    "priorityPathogenName",
    "taxonomicGroup",
    "taxonomicLevelDomain",
    "taxonomicLevelKingdom",
    "taxonomicLevelPhylum",
    "taxonomicLevelClass",
    "taxonomicLevelOrder",
    "taxonomicLevelFamily",
    "taxonomicLevelGenus",
    "taxonomicLevelSpecies",
}

ENTITY_FIELDS: dict[str, set[str]] = {
    "assembly": ASSEMBLY_FIELDS,
    "organism": ORGANISM_FIELDS,
}

LIST_FIELDS: set[str] = {"lineageTaxonomyIds", "ploidy", "taxonomicGroup", "otherTaxa"}
NUMERIC_FIELDS: set[str] = {
    "length",
    "gcPercent",
    "scaffoldN50",
    "scaffoldL50",
    "scaffoldCount",
    "chromosomes",
    "assemblyCount",
}

# Facets auto-returned on a truncated list, so the model can offer narrowing.
_AUTO_FACET_FIELDS: dict[str, list[str]] = {
    "assembly": ["level", "isRef"],
    "organism": ["taxonomicLevelDomain"],
}

# Curated projection for `list` rows (keeps tokens bounded vs SELECT *).
_DISPLAY_COLUMNS: dict[str, list[str]] = {
    "assembly": [
        "accession",
        "taxonomicLevelSpecies",
        "strainName",
        "level",
        "isRef",
        "ploidy",
        "length",
        "scaffoldN50",
        "geneModelUrl",
        "ucscBrowserUrl",
    ],
    "organism": [
        "ncbiTaxonomyId",
        "taxonomicLevelSpecies",
        "commonName",
        "assemblyCount",
    ],
}


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

    entity: str = "assembly"
    filters: list[Filter] = Field(default_factory=list)
    operation: str = "list"  # count | list | facets
    facet_by: list[str] = Field(default_factory=list)
    limit: int = 25
    offset: int = 0
    sort: list[Sort] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate(self) -> "CatalogQuery":
        if self.entity not in ENTITY_FIELDS:
            raise ValueError(
                f"unknown entity {self.entity!r}; valid: {sorted(ENTITY_FIELDS)}"
            )
        if self.operation not in ("count", "list", "facets"):
            raise ValueError(f"unknown operation {self.operation!r}")
        allowed = ENTITY_FIELDS[self.entity]
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
        for f in self.filters:
            if f.op in (Op.gt, Op.gte, Op.lt, Op.lte) and f.field not in NUMERIC_FIELDS:
                raise ValueError(
                    f"range op {f.op.value} needs a numeric field, got {f.field!r}"
                )
            if f.op in (Op.contains, Op.contains_any) and f.field not in LIST_FIELDS:
                raise ValueError(f"{f.op.value} needs a list field, got {f.field!r}")
        return self


_SQL_BINOP = {
    Op.eq: "=",
    Op.ne: "!=",
    Op.gt: ">",
    Op.gte: ">=",
    Op.lt: "<",
    Op.lte: "<=",
}


def _list_membership(col: str) -> str:
    """SQL truthy when list column `col` shares any element with the ? param list."""
    return f"len(list_intersect({col}, ?)) > 0"


def compile_predicate(f: Filter) -> tuple[str, list]:
    col = f.field
    if f.op is Op.is_null:
        return f"{col} IS NULL", []
    if f.op is Op.not_null:
        return f"{col} IS NOT NULL", []
    # On a list column, scalar membership ops (eq/ne/in/not_in) mean list
    # membership — a list never equals a scalar, so this is the only sensible
    # reading. Coercing it lets the model's natural `eq`/`in` phrasing work
    # without a failed round-trip.
    if col in LIST_FIELDS and f.op in (Op.eq, Op.ne, Op.in_, Op.not_in):
        vals = f.value if isinstance(f.value, list) else [f.value]
        expr = _list_membership(col)
        neg = f.op in (Op.ne, Op.not_in)
        return (f"NOT ({expr})" if neg else expr), [list(vals)]
    if f.op in (Op.in_, Op.not_in):
        vals = f.value if isinstance(f.value, list) else [f.value]
        ph = ", ".join(["?"] * len(vals))
        neg = "NOT " if f.op is Op.not_in else ""
        return f"{col} {neg}IN ({ph})", list(vals)
    if f.op is Op.contains:
        return f"list_contains({col}, ?)", [f.value]
    if f.op is Op.contains_any:
        vals = f.value if isinstance(f.value, list) else [f.value]
        return _list_membership(col), [list(vals)]
    return f"{col} {_SQL_BINOP[f.op]} ?", [f.value]


def compile_where(q: CatalogQuery) -> tuple[str, list]:
    if not q.filters:
        return "TRUE", []
    frags, params = [], []
    for f in q.filters:
        frag, p = compile_predicate(f)
        frags.append(frag)
        params.extend(p)
    return " AND ".join(frags), params


def connect(catalog_dir: str):
    """Load the catalog into an in-memory DuckDB connection (assembly table).

    Returns the connection, or None if the catalog can't be loaded (the caller
    degrades to a "query engine unavailable" tool response).

    Concurrency invariant: the assistant's tools are sync and run on the asyncio
    event-loop thread, so this single connection is only ever touched by one
    thread at a time and needs no lock or per-thread cursor. If tool execution is
    ever moved to a threadpool, that invariant breaks — DuckDB does not allow
    concurrent use of one connection across threads (use con.cursor() per thread).
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
        con.execute(
            "CREATE TABLE assembly AS "
            f"SELECT * FROM read_json_auto('{json_path}', "
            "format='array', maximum_object_size=20000000)"
        )
        total = con.execute("SELECT count(*) FROM assembly").fetchone()[0]
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
    where, params = compile_where(q)
    cap = q.limit

    def _facets(cols: list[str]) -> dict:
        out = {}
        for col in cols:
            rows = con.execute(
                f"SELECT {col} AS k, count(*) AS c FROM {q.entity} "
                f"WHERE {where} GROUP BY {col} ORDER BY c DESC",
                params,
            ).fetchall()
            out[col] = {str(k): c for k, c in rows}
        return out

    total = con.execute(
        f"SELECT count(*) FROM {q.entity} WHERE {where}", params
    ).fetchone()[0]
    result: dict = {"total": total}
    if q.operation == "count":
        return result
    if q.operation == "facets":
        result["facets"] = _facets(q.facet_by)
        return result

    order = ""
    if q.sort:
        order = "ORDER BY " + ", ".join(
            f"{s.field} {'DESC' if s.desc else 'ASC'}" for s in q.sort
        )
    cols = _DISPLAY_COLUMNS.get(q.entity)
    select = ", ".join(cols) if cols else "*"
    cur = con.execute(
        f"SELECT {select} FROM {q.entity} WHERE {where} {order} "
        f"LIMIT {cap + 1} OFFSET {q.offset}",
        params,
    )
    colnames = [d[0] for d in cur.description]
    raw = cur.fetchall()
    rows = [dict(zip(colnames, r)) for r in raw]
    result["truncated"] = len(rows) > cap
    result["rows"] = rows[:cap]
    result["returned"] = len(result["rows"])
    if result["truncated"]:
        result["facets"] = _facets(_AUTO_FACET_FIELDS.get(q.entity, []))
    return result
