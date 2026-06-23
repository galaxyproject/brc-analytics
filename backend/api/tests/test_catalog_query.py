"""Local (non-integrated) tests for the catalog query IR + DuckDB executor.

These exercise the query functionality directly — no model, no network — by
authoring CatalogQuery IRs by hand and either inspecting the compiled SQL or
running them against a small synthetic in-memory table with known contents.

The query shapes mirror the DoD example set (subtree-via-rank, OR-within-field,
AND empty-set, numeric range, facets/group-by, list-field membership, is_null),
but assert against a fixed fixture so they don't drift with the live catalog.
"""

from __future__ import annotations

import pytest

from app.services.tools.catalog_query import (
    ENTITY_SCHEMA,
    SCALAR,
    CatalogQuery,
    EntitySchema,
    Filter,
    Op,
    Sort,
    _compile_predicate,
    _schema_issues,
    connect,
    execute,
)

# --- IR validation (no DB) ----------------------------------------------------


def test_invalid_entity_rejected():
    # entity is a Literal["assembly"]; anything else — including the roadmap
    # "organism" whose table isn't loaded yet — is rejected by the schema.
    for bad in ("protein", "organism"):
        with pytest.raises(ValueError):
            CatalogQuery(entity=bad)


def test_unknown_operation_rejected():
    with pytest.raises(ValueError):
        CatalogQuery(operation="aggregate")


def test_unknown_field_rejected():
    with pytest.raises(ValueError, match="unknown field"):
        CatalogQuery(filters=[Filter(field="nope", op=Op.eq, value="x")])


def test_unknown_facet_and_sort_fields_rejected():
    with pytest.raises(ValueError, match="unknown field"):
        CatalogQuery(operation="facets", facet_by=["nope"])
    with pytest.raises(ValueError, match="unknown field"):
        CatalogQuery(sort=[Sort(field="nope")])


def test_range_op_requires_numeric_field():
    with pytest.raises(ValueError, match="numeric field"):
        CatalogQuery(filters=[Filter(field="level", op=Op.gt, value=1)])


def test_range_op_requires_numeric_value():
    # a numeric field with a non-numeric value (string, or bool) must be rejected
    with pytest.raises(ValueError, match="numeric value"):
        CatalogQuery(filters=[Filter(field="length", op=Op.gt, value="1000")])
    with pytest.raises(ValueError, match="numeric value"):
        CatalogQuery(filters=[Filter(field="length", op=Op.gt, value=True)])


def test_contains_op_requires_list_field():
    with pytest.raises(ValueError, match="needs a list field"):
        CatalogQuery(filters=[Filter(field="level", op=Op.contains, value="x")])


def test_contains_rejects_list_value():
    # contains tests a single scalar element; a list value belongs to contains_any.
    with pytest.raises(ValueError, match="use contains_any for a list"):
        CatalogQuery(
            filters=[Filter(field="ploidy", op=Op.contains, value=["DIPLOID"])]
        )


def test_eq_ne_reject_list_value_on_scalar_field():
    # a list value on eq/ne for a scalar field would compile to `col = [..]`
    # and error at execution — reject up front, pointing to in/not_in.
    with pytest.raises(ValueError, match="use in/not_in"):
        CatalogQuery(filters=[Filter(field="level", op=Op.eq, value=["Chromosome"])])
    with pytest.raises(ValueError, match="use in/not_in"):
        CatalogQuery(
            filters=[Filter(field="level", op=Op.ne, value=["Contig", "Scaffold"])]
        )
    # but eq/ne on a list field with a list value is fine (coerced to membership)
    CatalogQuery(filters=[Filter(field="ploidy", op=Op.eq, value=["DIPLOID"])])


# --- predicate compilation (no DB) --------------------------------------------


def test_compile_scalar_and_range():
    # Identifiers are quoted (defense-in-depth + exact-case pinning).
    assert _compile_predicate(
        Filter(field="level", op=Op.eq, value="Chromosome"), "assembly"
    ) == (
        '"level" = ?',
        ["Chromosome"],
    )
    assert _compile_predicate(
        Filter(field="length", op=Op.gte, value=1000), "assembly"
    ) == (
        '"length" >= ?',
        [1000],
    )


def test_compile_in_and_null():
    frag, params = _compile_predicate(
        Filter(field="level", op=Op.in_, value=["Chromosome", "Complete Genome"]),
        "assembly",
    )
    assert frag == '"level" IN (?, ?)'
    assert params == ["Chromosome", "Complete Genome"]
    assert _compile_predicate(
        Filter(field="geneModelUrl", op=Op.is_null), "assembly"
    ) == (
        '"geneModelUrl" IS NULL',
        [],
    )


def test_compile_list_membership_and_coercion():
    # explicit contains / contains_any
    assert _compile_predicate(
        Filter(field="ploidy", op=Op.contains, value="DIPLOID"), "assembly"
    ) == (
        'list_contains("ploidy", ?)',
        ["DIPLOID"],
    )
    # scalar eq on a list field coerces to membership (no failed round-trip)
    frag, params = _compile_predicate(
        Filter(field="ploidy", op=Op.eq, value="DIPLOID"), "assembly"
    )
    assert frag == 'len(list_intersect("ploidy", ?)) > 0'
    assert params == [["DIPLOID"]]
    # ne on a list field coerces to NULL-safe negated membership
    frag, _ = _compile_predicate(
        Filter(field="ploidy", op=Op.ne, value="DIPLOID"), "assembly"
    )
    assert frag == '(NOT (len(list_intersect("ploidy", ?)) > 0) OR "ploidy" IS NULL)'


def test_list_field_value_is_stringified():
    # List-typed columns are VARCHAR[]; a numeric value (e.g. a taxid the model
    # passes as a JSON number) must be compared as text — list_contains/intersect
    # on VARCHAR[] with an INTEGER is a DuckDB binder error, not a no-match.
    _, params = _compile_predicate(
        Filter(field="lineageTaxonomyIds", op=Op.contains, value=1773), "assembly"
    )
    assert params == ["1773"]
    _, params = _compile_predicate(
        Filter(field="lineageTaxonomyIds", op=Op.contains_any, value=[1773, 5833]),
        "assembly",
    )
    assert params == [["1773", "5833"]]
    # coerced scalar eq on a list field stringifies too
    _, params = _compile_predicate(
        Filter(field="lineageTaxonomyIds", op=Op.eq, value=1773), "assembly"
    )
    assert params == [["1773"]]


def test_compile_ne_and_not_in_are_null_safe():
    # SQL `col != x` / `col NOT IN (...)` drop NULL rows; negation must include them.
    frag, _ = _compile_predicate(
        Filter(field="level", op=Op.ne, value="Contig"), "assembly"
    )
    assert frag == '("level" != ? OR "level" IS NULL)'
    frag, _ = _compile_predicate(
        Filter(field="level", op=Op.not_in, value=["Contig"]), "assembly"
    )
    assert frag == '("level" NOT IN (?) OR "level" IS NULL)'


def test_facet_on_list_field_rejected():
    with pytest.raises(ValueError, match="cannot facet on list field"):
        CatalogQuery(operation="facets", facet_by=["ploidy"])


def test_facet_by_count_is_capped():
    # Each facet column is a separate GROUP BY; the schema caps how many a single
    # call can request so it can't fan out into a burst of DB work.
    with pytest.raises(ValueError):
        CatalogQuery(
            operation="facets",
            facet_by=[
                "level",
                "isRef",
                "strainName",
                "taxonomicLevelGenus",
                "taxonomicLevelSpecies",
            ],
        )


def test_facets_requires_facet_by():
    # operation=facets with no facet_by would return an empty {} — reject it.
    with pytest.raises(ValueError, match="needs at least one facet_by"):
        CatalogQuery(operation="facets")


def test_empty_value_list_rejected():
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="level", op=Op.in_, value=[])])
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="ploidy", op=Op.contains_any, value=[])])
    # eq/ne on a list field coerce to membership, so an empty list there is the
    # same silent always-false/always-true trap — reject it too.
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="ploidy", op=Op.eq, value=[])])
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="ploidy", op=Op.ne, value=[])])


def test_missing_value_rejected():
    # ops other than is_null/not_null need a value; None would compile to a
    # comparison against NULL that silently matches nothing.
    with pytest.raises(ValueError, match="needs a value"):
        CatalogQuery(filters=[Filter(field="level", op=Op.eq, value=None)])
    # is_null needs no value
    CatalogQuery(filters=[Filter(field="geneModelUrl", op=Op.is_null)])


def test_null_in_value_list_rejected():
    # A None element is rejected by the Filter type (list[Scalar] excludes None),
    # so `IN (NULL, ...)` can never be constructed.
    with pytest.raises(ValueError):
        Filter(field="level", op=Op.in_, value=[None, "Contig"])


def test_limit_and_offset_bounds():
    with pytest.raises(ValueError):
        CatalogQuery(limit=5000)  # exceeds the page cap
    with pytest.raises(ValueError):
        CatalogQuery(limit=11)  # just over the cap (max 10)
    with pytest.raises(ValueError):
        CatalogQuery(limit=0)
    with pytest.raises(ValueError):
        CatalogQuery(offset=-1)


# --- executor against a synthetic table ---------------------------------------


@pytest.fixture()
def con():
    duckdb = pytest.importorskip("duckdb")
    c = duckdb.connect()
    c.execute(
        """
        CREATE TABLE assembly (
            accession VARCHAR,
            taxonomicLevelSpecies VARCHAR,
            taxonomicLevelGenus VARCHAR,
            strainName VARCHAR,
            level VARCHAR,
            isRef VARCHAR,
            ploidy VARCHAR[],
            length BIGINT,
            scaffoldN50 BIGINT,
            geneModelUrl VARCHAR,
            ucscBrowserUrl VARCHAR
        )
        """
    )
    rows = [
        # accession, species, genus, strain, level, isRef, ploidy, len, n50, gtf, ucsc
        (
            "A1",
            "Anopheles gambiae",
            "Anopheles",
            None,
            "Chromosome",
            "Yes",
            ["DIPLOID"],
            2_000_000_000,
            1000,
            "g1",
            "u1",
        ),
        (
            "A2",
            "Anopheles gambiae",
            "Anopheles",
            None,
            "Scaffold",
            "No",
            ["DIPLOID"],
            1_500_000_000,
            900,
            None,
            "u2",
        ),
        (
            "A3",
            "Anopheles stephensi",
            "Anopheles",
            None,
            "Contig",
            "No",
            ["HAPLOID"],
            800_000,
            500,
            "g3",
            "u3",
        ),
        (
            "C1",
            "Candida albicans",
            "Candida",
            None,
            "Scaffold",
            "Yes",
            ["DIPLOID"],
            14_000_000,
            2000,
            "g4",
            "u4",
        ),
        (
            "C2",
            "Candida albicans",
            "Candida",
            None,
            "Chromosome",
            "No",
            ["DIPLOID"],
            14_500_000,
            3000,
            None,
            "u5",
        ),
    ]
    c.executemany("INSERT INTO assembly VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)
    yield c
    c.close()


@pytest.mark.parametrize(
    "label, filters, expected",
    [
        # subtree via a denormalized rank column (no lineage walk)
        ("subtree_via_rank", [("taxonomicLevelGenus", Op.eq, "Anopheles")], 3),
        # OR within a field via `in`, AND with another field
        (
            "or_within_field",
            [
                ("taxonomicLevelGenus", Op.eq, "Anopheles"),
                ("level", Op.in_, ["Chromosome", "Contig"]),  # A1 + A3
            ],
            2,
        ),
        # empty intersection -> honest zero (no constraint silently dropped)
        (
            "empty_intersection",
            [
                ("taxonomicLevelSpecies", Op.eq, "Candida albicans"),
                ("isRef", Op.eq, "Yes"),
                ("level", Op.eq, "Complete Genome"),
            ],
            0,
        ),
        # numeric range = two predicates on the same field (A1, A2)
        (
            "numeric_range",
            [("length", Op.gte, 1_000_000_000), ("length", Op.lte, 5_000_000_000)],
            2,
        ),
        # is_null = "missing" (A2, C2 have no gene annotation)
        ("is_null_missing", [("geneModelUrl", Op.is_null, None)], 2),
    ],
)
def test_count_shapes(con, label, filters, expected):
    q = CatalogQuery(
        operation="count",
        filters=[Filter(field=f, op=op, value=v) for f, op, v in filters],
    )
    assert execute(q, con) == {"total": expected}


def test_facets_group_by_level(con):
    q = CatalogQuery(operation="facets", facet_by=["level"])
    out = execute(q, con)
    assert out["total"] == 5
    assert out["facets"]["level"] == {
        "Chromosome": 2,
        "Scaffold": 2,
        "Contig": 1,
    }


def test_list_field_eq_coercion_matches_contains(con):
    # `eq` on the list field ploidy should behave like contains (membership)
    eq_q = CatalogQuery(
        operation="count", filters=[Filter(field="ploidy", op=Op.eq, value="DIPLOID")]
    )
    contains_q = CatalogQuery(
        operation="count",
        filters=[Filter(field="ploidy", op=Op.contains, value="DIPLOID")],
    )
    assert execute(eq_q, con) == execute(contains_q, con) == {"total": 4}


def test_ne_includes_null_rows(con):
    # All fixture rows have NULL strainName; `ne` must count them as "not X"
    # (plain SQL != would drop NULLs and return 0).
    q = CatalogQuery(
        operation="count",
        filters=[Filter(field="strainName", op=Op.ne, value="ABC")],
    )
    assert execute(q, con) == {"total": 5}


def test_list_truncation_attaches_facets(con):
    q = CatalogQuery(operation="list", limit=2)
    out = execute(q, con)
    assert out["total"] == 5
    assert out["returned"] == 2
    assert out["truncated"] is True
    assert len(out["rows"]) == 2
    # auto-facets attach on truncation so the model can offer narrowing
    assert "level" in out["facets"] and "isRef" in out["facets"]


def test_auto_facets_drop_single_bucket(con):
    # Filtered to non-reference only: isRef collapses to one bucket (no narrowing
    # value) so it's dropped; level still discriminates and stays.
    q = CatalogQuery(
        operation="list",
        filters=[Filter(field="isRef", op=Op.eq, value="No")],
        limit=2,
    )
    out = execute(q, con)
    assert out["truncated"] is True
    assert "isRef" not in out["facets"]
    assert "level" in out["facets"]


def test_list_no_truncation_when_under_limit(con):
    q = CatalogQuery(operation="list", limit=10)
    out = execute(q, con)
    assert out["returned"] == 5
    assert out["truncated"] is False
    assert "facets" not in out


def test_default_order_is_reference_then_quality(con):
    # No explicit sort: reference assemblies first, then largest scaffold N50,
    # accession as the stable tiebreaker. (Fixture refs: C1 n50=2000, A1 n50=1000.)
    out = execute(CatalogQuery(operation="list", limit=10), con)
    accs = [r["accession"] for r in out["rows"]]
    assert accs[:2] == ["C1", "A1"]  # both isRef=Yes, ordered by N50 desc
    refs = [r["isRef"] for r in out["rows"]]
    assert refs == sorted(refs, reverse=True)  # all "Yes" precede all "No"


def test_connect_fails_closed_on_schema_drift(tmp_path):
    # If the catalog is missing configured columns, the engine must disable
    # itself (return None) rather than degrade — drift is a build problem to fix.
    pytest.importorskip("duckdb")
    (tmp_path / "assemblies.json").write_text('[{"accession": "A1"}]')
    assert connect(str(tmp_path)) is None


def _ok_coltypes(entity: str = "assembly") -> dict[str, str]:
    """A schema where every column the entity is configured for is present and
    correctly typed (numeric -> BIGINT, list -> VARCHAR[], else VARCHAR)."""
    schema = ENTITY_SCHEMA[entity]
    out = {}
    for c in schema.configured_columns:
        if c in schema.numeric_fields:
            out[c] = "BIGINT"
        elif c in schema.list_fields:
            out[c] = "VARCHAR[]"
        else:
            out[c] = "VARCHAR"
    return out


def test_schema_issues_accepts_correct_schema():
    missing, mistyped = _schema_issues(_ok_coltypes(), "assembly")
    assert missing == [] and mistyped == []


def test_schema_issues_flags_missing_and_mistyped():
    cols = _ok_coltypes()
    cols["length"] = "VARCHAR"  # numeric field inferred as text
    cols["ploidy"] = "VARCHAR"  # list field inferred as scalar
    del cols["isRef"]  # a configured column dropped
    missing, mistyped = _schema_issues(cols, "assembly")
    assert "isRef" in missing
    assert any(m.startswith("length=") for m in mistyped)
    assert any(m.startswith("ploidy=") for m in mistyped)


def test_schema_issues_accepts_numeric_type_variants():
    cols = _ok_coltypes()
    cols["gcPercent"] = "DOUBLE"
    cols["length"] = "DECIMAL(18,3)"  # parameterized numeric type
    _, mistyped = _schema_issues(cols, "assembly")
    assert mistyped == []


# --- per-entity type classification -------------------------------------------


def test_type_classification_is_entity_scoped():
    # Derived views are subsets of the entity's declared fields (by construction).
    for schema in ENTITY_SCHEMA.values():
        assert schema.list_fields <= schema.field_names
        assert schema.numeric_fields <= schema.field_names
    # The classifications genuinely diverge: otherTaxa is a list on assembly but
    # not even a field on organism; assemblyCount is numeric only on organism;
    # taxonomicGroup is a list on both.
    asm, org = ENTITY_SCHEMA["assembly"], ENTITY_SCHEMA["organism"]
    assert "otherTaxa" in asm.list_fields
    assert "otherTaxa" not in org.list_fields
    assert "assemblyCount" in org.numeric_fields
    assert "assemblyCount" not in asm.numeric_fields
    assert "taxonomicGroup" in asm.list_fields
    assert "taxonomicGroup" in org.list_fields


def test_entity_schema_rejects_misdeclaration():
    # A `list` always needs a projection.
    with pytest.raises(ValueError, match="display must be non-empty"):
        EntitySchema(fields={"a": SCALAR}, display=())
    # default_order / auto_facets must name configured columns (caught at import,
    # not late as malformed SQL).
    with pytest.raises(ValueError, match="unknown column"):
        EntitySchema(fields={"a": SCALAR}, display=("a",), auto_facets=("ghost",))
    with pytest.raises(ValueError, match="unknown column"):
        EntitySchema(
            fields={"a": SCALAR}, display=("a",), default_order=(("ghost", True),)
        )
    # A display-only column (absent from fields) is a valid order/facet target.
    EntitySchema(
        fields={"a": SCALAR}, display=("a", "b"), default_order=(("b", False),)
    )


def test_compile_predicate_respects_entity_type():
    # Same field, same op — but otherTaxa is a list on assembly (eq coerces to
    # membership) and a scalar on organism (eq stays a plain `=`).
    frag_asm, _ = _compile_predicate(
        Filter(field="otherTaxa", op=Op.eq, value="x"), "assembly"
    )
    assert frag_asm == 'len(list_intersect("otherTaxa", ?)) > 0'
    frag_org, params_org = _compile_predicate(
        Filter(field="otherTaxa", op=Op.eq, value="x"), "organism"
    )
    assert frag_org == '"otherTaxa" = ?'
    assert params_org == ["x"]


def test_schema_issues_ignores_other_entity_list_field():
    # organisms.json carries a scalar otherTaxa column. It's a list field on
    # assembly but not queryable on organism, so the organism drift check must not
    # flag it as mistyped (which would wrongly disable the engine).
    cols = _ok_coltypes("organism")
    cols["otherTaxa"] = "VARCHAR"  # present in the table, scalar, not in org fields
    missing, mistyped = _schema_issues(cols, "organism")
    assert missing == [] and mistyped == []
    # The same scalar otherTaxa IS flagged under assembly, where it's a list field.
    asm = _ok_coltypes()
    asm["otherTaxa"] = "VARCHAR"
    _, asm_mistyped = _schema_issues(asm, "assembly")
    assert any(m.startswith("otherTaxa=") for m in asm_mistyped)


def test_explicit_sort_gets_stable_tiebreaker(con):
    # All fixture rows share isRef ties; a sort on isRef alone is ambiguous, so a
    # stable secondary key (accession) must make the page order reproducible.
    q = CatalogQuery(operation="list", sort=[Sort(field="isRef")])
    accs = [r["accession"] for r in execute(q, con)["rows"]]
    # within the "No" group (A2, A3, C2) the tiebreaker orders by accession
    assert [a for a in accs if a in {"A2", "A3", "C2"}] == ["A2", "A3", "C2"]


def test_explicit_sort_puts_nulls_last(con):
    # A DESC sort on a column with missing values must keep the rows that have
    # data at the top of the page (DuckDB defaults NULLs first on DESC).
    # Fixture geneModelUrl: A2 and C2 are NULL; the rest have values.
    q = CatalogQuery(operation="list", sort=[Sort(field="geneModelUrl", desc=True)])
    gtfs = [r["geneModelUrl"] for r in execute(q, con)["rows"]]
    # every non-null value precedes every null
    assert gtfs[-2:] == [None, None]
    assert all(g is not None for g in gtfs[:-2])


def test_facets_have_stable_order_on_count_ties(con):
    # Contig (1) is unique, but Chromosome and Scaffold both have 2 — the tie must
    # resolve deterministically by key, not shuffle.
    out = execute(CatalogQuery(operation="facets", facet_by=["level"]), con)
    assert list(out["facets"]["level"]) == ["Chromosome", "Scaffold", "Contig"]
