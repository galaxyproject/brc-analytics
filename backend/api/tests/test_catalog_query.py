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
    compile_predicate,
    execute,
)

# --- IR validation (no DB) ----------------------------------------------------


def test_unknown_entity_rejected():
    with pytest.raises(ValueError, match="unknown entity"):
        CatalogQuery(entity="protein")


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


# --- predicate compilation (no DB) --------------------------------------------


def test_compile_scalar_and_range():
    assert compile_predicate(Filter(field="level", op=Op.eq, value="Chromosome")) == (
        "level = ?",
        ["Chromosome"],
    )
    assert compile_predicate(Filter(field="length", op=Op.gte, value=1000)) == (
        "length >= ?",
        [1000],
    )


def test_compile_in_and_null():
    frag, params = compile_predicate(
        Filter(field="level", op=Op.in_, value=["Chromosome", "Complete Genome"])
    )
    assert frag == "level IN (?, ?)"
    assert params == ["Chromosome", "Complete Genome"]
    assert compile_predicate(Filter(field="geneModelUrl", op=Op.is_null)) == (
        "geneModelUrl IS NULL",
        [],
    )


def test_compile_list_membership_and_coercion():
    # explicit contains / contains_any
    assert compile_predicate(
        Filter(field="ploidy", op=Op.contains, value="DIPLOID")
    ) == (
        "list_contains(ploidy, ?)",
        ["DIPLOID"],
    )
    # scalar eq on a list field coerces to membership (no failed round-trip)
    frag, params = compile_predicate(Filter(field="ploidy", op=Op.eq, value="DIPLOID"))
    assert frag == "len(list_intersect(ploidy, ?)) > 0"
    assert params == [["DIPLOID"]]
    # ne on a list field coerces to negated membership
    frag, _ = compile_predicate(Filter(field="ploidy", op=Op.ne, value="DIPLOID"))
    assert frag == "NOT (len(list_intersect(ploidy, ?)) > 0)"


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
        # accession, species, genus, strain, level, isRef, ploidy, length, n50, gtf, ucsc
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
    return c


def test_count_subtree_via_rank(con):
    q = CatalogQuery(
        operation="count",
        filters=[Filter(field="taxonomicLevelGenus", op=Op.eq, value="Anopheles")],
    )
    assert execute(q, con) == {"total": 3}


def test_count_or_within_field(con):
    q = CatalogQuery(
        operation="count",
        filters=[
            Filter(field="taxonomicLevelGenus", op=Op.eq, value="Anopheles"),
            Filter(field="level", op=Op.in_, value=["Chromosome", "Contig"]),
        ],
    )
    assert execute(q, con) == {"total": 2}  # A1 + A3


def test_count_empty_intersection_is_honest_zero(con):
    q = CatalogQuery(
        operation="count",
        filters=[
            Filter(field="taxonomicLevelSpecies", op=Op.eq, value="Candida albicans"),
            Filter(field="isRef", op=Op.eq, value="Yes"),
            Filter(field="level", op=Op.eq, value="Complete Genome"),
        ],
    )
    assert execute(q, con) == {"total": 0}


def test_count_numeric_range(con):
    q = CatalogQuery(
        operation="count",
        filters=[
            Filter(field="length", op=Op.gte, value=1_000_000_000),
            Filter(field="length", op=Op.lte, value=5_000_000_000),
        ],
    )
    assert execute(q, con) == {"total": 2}  # A1, A2


def test_count_is_null_for_missing_annotation(con):
    q = CatalogQuery(
        operation="count",
        filters=[Filter(field="geneModelUrl", op=Op.is_null)],
    )
    assert execute(q, con) == {"total": 2}  # A2, C2


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
