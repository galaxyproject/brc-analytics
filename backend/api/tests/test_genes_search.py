"""Tests for gene search (/api/v1/genes/search), against the test gene
snapshot (conftest.py): 16 of 3D7's genes, chosen in
scripts/export_test_gene_snapshot.py."""

import os
from pathlib import Path

import pytest

from app.api.v1.genes import MAX_SEARCH_LENGTH, MAX_SEARCH_LIMIT, MAX_SEARCH_WORDS
from app.services.gene_catalog import GeneCatalogService
from tests.genes_helpers import altered_snapshot, make_client

AMA1 = "d9049485-ed74-5455-98c2-5dc13eef544a"


def search(client, q, **params):
    response = client.get("/api/v1/genes/search", params={"q": q, **params})
    assert response.status_code == 200, response.text
    return response.json()


def matches(body):
    """Each result's locus tag and what it matched on."""
    return [
        (r["locusTag"], r["matchedOn"]["type"], r["matchedOn"]["value"])
        for r in body["results"]
    ]


def test_a_symbol_prefix_finds_the_gene(gene_client, gene_service):
    body = search(gene_client, "ama")
    assert body == {
        "snapshot": {"buildId": gene_service.snapshot.build_id, "update": None},
        "query": "ama",
        "results": [
            {
                "matchedOn": {"type": "name", "value": "AMA1"},
                "geneUid": AMA1,
                "locusTag": "PF3D7_1133400",
                "name": "AMA1",
                "symbol": "AMA1",
                "assemblyAccession": "GCF_000002765.6",
                "organism": {
                    "name": "Plasmodium falciparum 3D7",
                    "speciesTaxonomyId": "5833",
                    "taxonomyId": "36329",
                },
                "pageUrl": f"https://brc-analytics.org/data/genes/detail?uid={AMA1}",
            }
        ],
        "truncated": False,
    }


@pytest.mark.parametrize(
    "q, matched_on",
    [
        ("PF3D7_1133400", ("locus_tag", "PF3D7_1133400")),
        ("pf3d7_1133400", ("locus_tag", "PF3D7_1133400")),
        ("AMA1", ("name", "AMA1")),
        ("Ama1", ("name", "AMA1")),
        ("810891", ("ncbi_gene_id", "810891")),
        ("XM_001347979.2", ("transcript_id", "XM_001347979.2")),
        ("XM_001347979", ("transcript_id", "XM_001347979.2")),
        ("XP_001348015.1", ("protein_accession", "XP_001348015.1")),
        ("XP_001348015", ("protein_accession", "XP_001348015.1")),
        ("antigen", ("protein_product", "apical membrane antigen 1")),
    ],
)
def test_each_kind_of_term_finds_the_gene(gene_client, q, matched_on):
    body = search(gene_client, q)
    assert [(r["geneUid"], tuple(r["matchedOn"].values())) for r in body["results"]][
        :1
    ] == [(AMA1, matched_on)]


def test_an_old_locus_tag_finds_its_gene(gene_client):
    assert matches(search(gene_client, "PF3D7_0105400.1")) == [
        ("PF3D7_0105400", "old_locus_tag", "PF3D7_0105400.1")
    ]


def test_a_transcript_product_word(gene_client):
    # PSH1's transcript product, not its protein's ("putative ATP-dependent
    # RNA helicase").
    assert matches(search(gene_client, "dna")) == [
        ("PF3D7_0103600", "transcript_product", "ATP-dependent DNA/RNA helicase PSH1")
    ]


def test_several_words_each_match_the_last_as_a_prefix(gene_client):
    assert matches(search(gene_client, "apical memb")) == [
        ("PF3D7_1133400", "protein_product", "apical membrane antigen 1"),
        (
            "PF3D7_1218000",
            "protein_product",
            "thrombospondin-related apical membrane protein",
        ),
    ]
    # Words before the last are whole words.
    assert search(gene_client, "apic membrane")["results"] == []
    # And each must match.
    assert search(gene_client, "apical helicase")["results"] == []


AMA1_AND_TRAMP = ["PF3D7_1133400", "PF3D7_1218000"]


@pytest.mark.parametrize(
    "q, searched, found",
    [
        # A product as the results list shows it: "1" is no product word.
        ("apical membrane antigen 1", "apical membrane antigen", ["PF3D7_1133400"]),
        # Stop words aren't product words either.
        ("putative apical membrane protein", "apical membrane", AMA1_AND_TRAMP),
        # Surrounding punctuation, as the build trims it from product words.
        ("Apical, membrane.", "apical membrane", AMA1_AND_TRAMP),
    ],
)
def test_words_no_product_word_can_be_are_left_out(gene_client, q, searched, found):
    body = search(gene_client, q)
    assert body["query"] == searched
    assert [r["locusTag"] for r in body["results"]] == found


@pytest.mark.parametrize("q", ["(AMA1)", "ama1,", '"AMA1"'])
def test_a_lone_word_is_trimmed_of_punctuation(gene_client, q):
    assert matches(search(gene_client, q)) == [("PF3D7_1133400", "name", "AMA1")]


def test_a_lone_short_or_stop_word_is_kept(gene_client):
    # It may start a longer term.
    assert search(gene_client, "am")["query"] == "am"
    assert [r["locusTag"] for r in search(gene_client, "am")["results"]] == [
        "PF3D7_1133400"
    ]
    assert search(gene_client, "the")["query"] == "the"


def test_a_query_of_only_left_out_words_keeps_its_last(gene_client):
    assert search(gene_client, "of the")["query"] == "the"


def test_internal_punctuation_is_kept(gene_client):
    assert search(gene_client, "der1-2")["query"] == "der1-2"
    assert search(gene_client, "PF3D7_0105400.1")["query"] == "pf3d7_0105400.1"


@pytest.mark.parametrize("q", ["\U0010ffff", "a\U0010ffff", "\U0010ffff\U0010ffff"])
def test_the_last_code_point_is_searched_not_an_error(gene_client, q):
    assert search(gene_client, q)["results"] == []


def test_one_word_finds_every_gene_it_starts_a_term_of(gene_client):
    assert [r["locusTag"] for r in search(gene_client, "apical")["results"]] == [
        "PF3D7_1133400",
        "PF3D7_1137200",
        "PF3D7_1141300",
        "PF3D7_1218000",
    ]


def test_a_symbol_two_genes_share_lists_both(gene_client):
    assert matches(search(gene_client, "der1-2")) == [
        ("PF3D7_0314300", "name", "DER1-2"),
        ("PF3D7_1032500", "name", "Der1-2"),
    ]


def test_a_locus_tag_that_is_another_genes_old_one_lists_both_current_first(
    gene_client,
):
    body = search(gene_client, "PF3D7_1440300")
    assert matches(body) == [
        ("PF3D7_1440300", "locus_tag", "PF3D7_1440300"),
        ("PF3D7_1440200", "old_locus_tag", "PF3D7_1440300"),
    ]
    assert body["results"][0]["name"] == "PBGS"


def test_each_gene_is_listed_once_at_its_best_match(gene_client):
    # AMA1 is its name, its symbol and a prefix of its locus tag's; listed
    # once, on its name.
    assert matches(search(gene_client, "ama1")) == [("PF3D7_1133400", "name", "AMA1")]


def test_ranking(tmp_path, gene_snapshot_path):
    # Five genes, each matching "zz" on one kind of term: the kind ranks
    # before the matched term's length.
    terms = [
        ("PF3D7_1130000", "zz", "transcript_product"),
        ("PF3D7_1130100", "zzxx", "symbol"),
        ("PF3D7_1130200", "zzx", "symbol"),
        ("PF3D7_1130400", "zzxxx", "locus_tag"),
        ("PF3D7_1133400", "zz", "protein_accession"),
        ("PF3D7_1218000", "zz", "name"),
    ]
    rank = {"transcript_product": 4, "symbol": 1, "protein_accession": 1}
    sql = ";".join(
        f"INSERT INTO search_term SELECT '{term}', '{kind}', gene_uid,"
        f" upper('{term}'), assembly_accession, NULL, {rank.get(kind, 0)}"
        f" FROM gene WHERE locus_tag = '{locus_tag}'"
        for locus_tag, term, kind in terms
    )
    service = altered_snapshot(tmp_path, gene_snapshot_path, sql)
    try:
        body = search(make_client(service), "zz")
    finally:
        service.close()
    assert [r["locusTag"] for r in body["results"]] == [
        "PF3D7_1218000",  # exact name
        "PF3D7_1133400",  # exact other alias
        "PF3D7_1130400",  # locus tag prefix
        "PF3D7_1130200",  # other alias prefix, shorter
        "PF3D7_1130100",  # other alias prefix
        "PF3D7_1130000",  # product word
    ]


def test_truncation(gene_client):
    body = search(gene_client, "PF3D7_11", limit=5)
    assert [r["locusTag"] for r in body["results"]] == [
        "PF3D7_1130000",
        "PF3D7_1130100",
        "PF3D7_1130200",
        "PF3D7_1130300",
        "PF3D7_1130400",
    ]
    assert body["truncated"] is True
    body = search(gene_client, "PF3D7_11", limit=8)
    assert len(body["results"]) == 8
    assert body["truncated"] is False


def test_limit_defaults_to_10(gene_client):
    body = search(gene_client, "PF3D7_")
    assert len(body["results"]) == 10
    assert body["truncated"] is True


def test_by_assembly(gene_client):
    assert len(search(gene_client, "ama1", assembly="GCF_000002765.6")["results"]) == 1
    assert search(gene_client, "ama1", assembly="GCF_000001405.40")["results"] == []


def test_nothing_found(gene_client):
    assert search(gene_client, "nosuchgene") == {
        "snapshot": search(gene_client, "ama")["snapshot"],
        "query": "nosuchgene",
        "results": [],
        "truncated": False,
    }


def test_the_query_is_trimmed(gene_client):
    assert search(gene_client, "  ama  ")["query"] == "ama"


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"q": ""},
        {"q": "   "},
        # No words once punctuation is trimmed.
        {"q": "( )"},
        {"q": "a" * (MAX_SEARCH_LENGTH + 1)},
        {"q": " ".join(["ama"] * (MAX_SEARCH_WORDS + 1))},
        {"q": "ama", "limit": 0},
        {"q": "ama", "limit": MAX_SEARCH_LIMIT + 1},
    ],
)
def test_bad_queries_are_422(gene_client, params):
    assert gene_client.get("/api/v1/genes/search", params=params).status_code == 422


def test_search_is_503_without_gene_data(tmp_path):
    service = GeneCatalogService.local(str(tmp_path / "missing.duckdb"), "")
    response = make_client(service).get("/api/v1/genes/search?q=ama")
    assert response.status_code == 503


# The issue's examples (#1905), against 3D7's whole snapshot. Run when
# GENE_SNAPSHOT_3D7_PATH names one built by build_gene_snapshot.
FULL_3D7 = os.environ.get("GENE_SNAPSHOT_3D7_PATH")


@pytest.mark.skipif(not FULL_3D7, reason="GENE_SNAPSHOT_3D7_PATH isn't set")
def test_whole_3d7_snapshot():
    service = GeneCatalogService.local(str(Path(FULL_3D7)), "")
    client = make_client(service)
    try:
        assert matches(search(client, "ama"))[0] == ("PF3D7_1133400", "name", "AMA1")
        for q in ("810891", "XP_001348015"):
            assert [r["locusTag"] for r in search(client, q)["results"]] == [
                "PF3D7_1133400"
            ]
        assert [
            r["locusTag"]
            for r in search(client, "apical membrane antigen 1")["results"]
        ] == ["PF3D7_1133400"]
        apical = [r["locusTag"] for r in search(client, "apical memb")["results"]]
        assert apical[0] == "PF3D7_1133400"
        assert "PF3D7_1218000" in apical
        body = search(client, "PF3D7_11", limit=50)
        assert len(body["results"]) == 50
        assert body["truncated"] is True
        assert [r["locusTag"] for r in search(client, "der1-2")["results"]] == [
            "PF3D7_0314300",
            "PF3D7_1032500",
        ]
        assert matches(search(client, "PF3D7_1440300")) == [
            ("PF3D7_1440300", "locus_tag", "PF3D7_1440300"),
            ("PF3D7_1440200", "old_locus_tag", "PF3D7_1440300"),
        ]
    finally:
        service.close()
