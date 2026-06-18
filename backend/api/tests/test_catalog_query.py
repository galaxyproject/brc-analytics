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
    CatalogQuery,
    Filter,
    Op,
    Sort,
    _compile_predicate,
    connect,
    execute,
)

# --- IR validation (no DB) ----------------------------------------------------


def test_unknown_entity_rejected():
    with pytest.raises(ValueError, match="unknown entity"):
        CatalogQuery(entity="protein")


def test_known_but_unloaded_entity_rejected():
    # organism vocab exists but connect() loads no organism table yet — reject at
    # validation with a clear message rather than failing mid-execution.
    with pytest.raises(ValueError, match="not queryable yet"):
        CatalogQuery(entity="organism")


def test_unknown_operation_rejected():
    with pytest.raises(ValueError, match="unknown operation"):
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
    with pytest.raises(ValueError, match="range op"):
        CatalogQuery(filters=[Filter(field="level", op=Op.gt, value=1)])


def test_contains_op_requires_list_field():
    with pytest.raises(ValueError, match="needs a list field"):
        CatalogQuery(filters=[Filter(field="level", op=Op.contains, value="x")])


def test_contains_rejects_list_value():
    # contains tests a single scalar element; a list value belongs to contains_any.
    with pytest.raises(ValueError, match="use contains_any for a list"):
        CatalogQuery(
            filters=[Filter(field="ploidy", op=Op.contains, value=["DIPLOID"])]
        )


# --- predicate compilation (no DB) --------------------------------------------


def test_compile_scalar_and_range():
    assert _compile_predicate(Filter(field="level", op=Op.eq, value="Chromosome")) == (
        "level = ?",
        ["Chromosome"],
    )
    assert _compile_predicate(Filter(field="length", op=Op.gte, value=1000)) == (
        "length >= ?",
        [1000],
    )


def test_compile_in_and_null():
    frag, params = _compile_predicate(
        Filter(field="level", op=Op.in_, value=["Chromosome", "Complete Genome"])
    )
    assert frag == "level IN (?, ?)"
    assert params == ["Chromosome", "Complete Genome"]
    assert _compile_predicate(Filter(field="geneModelUrl", op=Op.is_null)) == (
        "geneModelUrl IS NULL",
        [],
    )


def test_compile_list_membership_and_coercion():
    # explicit contains / contains_any
    assert _compile_predicate(
        Filter(field="ploidy", op=Op.contains, value="DIPLOID")
    ) == (
        "list_contains(ploidy, ?)",
        ["DIPLOID"],
    )
    # scalar eq on a list field coerces to membership (no failed round-trip)
    frag, params = _compile_predicate(Filter(field="ploidy", op=Op.eq, value="DIPLOID"))
    assert frag == "len(list_intersect(ploidy, ?)) > 0"
    assert params == [["DIPLOID"]]
    # ne on a list field coerces to NULL-safe negated membership
    frag, _ = _compile_predicate(Filter(field="ploidy", op=Op.ne, value="DIPLOID"))
    assert frag == "(NOT (len(list_intersect(ploidy, ?)) > 0) OR ploidy IS NULL)"


def test_compile_ne_and_not_in_are_null_safe():
    # SQL `col != x` / `col NOT IN (...)` drop NULL rows; negation must include them.
    frag, _ = _compile_predicate(Filter(field="level", op=Op.ne, value="Contig"))
    assert frag == "(level != ? OR level IS NULL)"
    frag, _ = _compile_predicate(Filter(field="level", op=Op.not_in, value=["Contig"]))
    assert frag == "(level NOT IN (?) OR level IS NULL)"


def test_facet_on_list_field_rejected():
    with pytest.raises(ValueError, match="cannot facet on list field"):
        CatalogQuery(operation="facets", facet_by=["ploidy"])


def test_empty_value_list_rejected():
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="level", op=Op.in_, value=[])])
    with pytest.raises(ValueError, match="non-empty value list"):
        CatalogQuery(filters=[Filter(field="ploidy", op=Op.contains_any, value=[])])


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
        CatalogQuery(limit=26)  # just over the cap
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


def test_list_no_truncation_when_under_limit(con):
    q = CatalogQuery(operation="list", limit=25)
    out = execute(q, con)
    assert out["returned"] == 5
    assert out["truncated"] is False
    assert "facets" not in out


def test_connect_fails_closed_on_schema_drift(tmp_path):
    # If the catalog is missing configured columns, the engine must disable
    # itself (return None) rather than degrade — drift is a build problem to fix.
    pytest.importorskip("duckdb")
    (tmp_path / "assemblies.json").write_text('[{"accession": "A1"}]')
    assert connect(str(tmp_path)) is None


def test_explicit_sort_gets_stable_tiebreaker(con):
    # All fixture rows share isRef ties; a sort on isRef alone is ambiguous, so a
    # stable secondary key (accession) must make the page order reproducible.
    q = CatalogQuery(operation="list", sort=[Sort(field="isRef")])
    accs = [r["accession"] for r in execute(q, con)["rows"]]
    assert accs == [r["accession"] for r in execute(q, con)["rows"]]
    # within the "No" group (A2, A3, C2) the tiebreaker orders by accession
    assert [a for a in accs if a in {"A2", "A3", "C2"}] == ["A2", "A3", "C2"]


def test_facets_have_stable_order_on_count_ties(con):
    # Contig (1) is unique, but Chromosome and Scaffold both have 2 — the tie must
    # resolve deterministically by key, not shuffle.
    out = execute(CatalogQuery(operation="facets", facet_by=["level"]), con)
    assert list(out["facets"]["level"]) == ["Chromosome", "Scaffold", "Contig"]
