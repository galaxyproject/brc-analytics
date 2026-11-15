"""Tests for the gene API, against the test gene snapshot (conftest.py)."""

import gzip
import json
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import duckdb
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import genes
from app.core.dependencies import get_bionym_graphs, get_gene_catalog_service
from app.services.bionym_graphs import BIONYM_GRAPHS_DIR, BionymGraphStore
from app.services.gene_catalog import GeneCatalogService

# The test snapshot's build, as tests/data/gene_snapshot/snapshot.csv has it.
BUILD_ID = "temp-GCF_000002765.6-2026-10-28T212348Z"


def make_client(
    service: Optional[GeneCatalogService] = None,
    graphs: Optional[BionymGraphStore] = None,
) -> TestClient:
    """A client for the gene routes, serving the given gene snapshot and
    BioNym graphs in place of the app's own."""
    app = FastAPI()
    app.include_router(genes.router, prefix="/api/v1/genes")
    if service is not None:
        app.dependency_overrides[get_gene_catalog_service] = lambda: service
    if graphs is not None:
        app.dependency_overrides[get_bionym_graphs] = lambda: graphs
    return TestClient(app)


def altered_snapshot(tmp_path, snapshot_path, sql: str) -> GeneCatalogService:
    """A service over a copy of the test snapshot, changed by sql."""
    path = tmp_path / "genes.duckdb"
    shutil.copy(snapshot_path, path)
    with duckdb.connect(str(path)) as con:
        con.execute(sql)
    return GeneCatalogService.local(str(path), "")


@pytest.fixture(scope="module")
def service(gene_snapshot_path):
    service = GeneCatalogService.local(
        str(gene_snapshot_path), "https://brc-analytics.org/"
    )
    yield service
    service.close()


@pytest.fixture
def client(service):
    return make_client(service)


@pytest.fixture(scope="module")
def gene_uid(service):
    """Look a gene's UID up in the snapshot by its locus tag."""

    def lookup(locus_tag: str) -> uuid.UUID:
        cur = service._con.cursor()
        try:
            row = cur.execute(
                "SELECT gene_uid FROM gene WHERE locus_tag = ?", [locus_tag]
            ).fetchone()
        finally:
            cur.close()
        return row[0]

    return lookup


def test_local_snapshot_opens(service):
    assert service.is_available()
    assert service.health() == {
        "status": "ready",
        "source": "local",
        "build_id": BUILD_ID,
    }


def test_gene(client, gene_uid):
    uid = gene_uid("PF3D7_1133400")
    response = client.get(f"/api/v1/genes/{uid}")
    assert response.status_code == 200
    body = response.json()
    assert body["snapshot"]["update"] is None
    gene = body["gene"]
    provenance = gene.pop("provenance")
    assert gene == {
        "geneUid": str(uid),
        "locusTag": "PF3D7_1133400",
        "name": "AMA1",
        "symbol": "AMA1",
        "biotype": "protein_coding",
        "assemblyAccession": "GCF_000002765.6",
        "ucscBrowserUrl": "https://genome.ucsc.edu/h/GCF_000002765.6",
        "organism": {
            "name": "Plasmodium falciparum 3D7",
            "speciesTaxonomyId": "5833",
            "taxonomyId": "36329",
        },
        "location": {
            "seqName": "NC_037282.1",
            "start": 1292966,
            "end": 1296696,
            "strand": "+",
        },
        "transcripts": [
            {
                "gff3RowId": "rna-XM_001347979.2",
                "transcriptId": "XM_001347979.2",
                "transcriptProduct": "apical membrane antigen 1",
                "proteinAccession": "XP_001348015.1",
                "proteinProduct": "apical membrane antigen 1",
                "location": {
                    "seqName": "NC_037282.1",
                    "start": 1292966,
                    "end": 1296696,
                    "strand": "+",
                },
            }
        ],
        "aliases": [
            {
                "value": value,
                "type": alias_type,
                "current": True,
                "publisher": "NCBI RefSeq",
                "via": None,
            }
            for value, alias_type in [
                ("AMA1", "symbol"),
                ("810891", "ncbi_gene_id"),
                ("XM_001347979.2", "transcript_id"),
                ("XP_001348015.1", "protein_accession"),
            ]
        ],
        "status": "current",
        "pageUrl": f"https://brc-analytics.org/data/genes/detail?uid={uid}",
    }
    assert provenance["annotationSetVersionId"].startswith(
        "ncbi-refseq-GCF_000002765.6-"
    )
    assert provenance["publisher"] == "NCBI RefSeq"
    assert provenance["provider"] == "Community Annotation"
    assert provenance["releaseLabel"] == "RS_2026_09"
    assert provenance["releaseDate"] == "2026-09-18"
    assert provenance["genesAsOf"] is None
    assert provenance["retrievedAt"].endswith("Z")


def test_old_locus_tags_are_former_ids(client, gene_uid):
    response = client.get(f"/api/v1/genes/{gene_uid('PF3D7_0105400')}")
    aliases = response.json()["gene"]["aliases"]
    assert [
        (a["value"], a["current"]) for a in aliases if a["type"] == "old_locus_tag"
    ] == [("PF3D7_0105400.1", False), ("PF3D7_0105400.2", False)]


def test_transcript_without_an_id(client, gene_uid):
    response = client.get(f"/api/v1/genes/{gene_uid('PF3D7_0203500')}")
    gene = response.json()["gene"]
    assert gene["biotype"] == "tRNA"
    assert [
        (t["transcriptId"], t["proteinAccession"]) for t in gene["transcripts"]
    ] == [(None, None)]
    assert all(a["type"] != "transcript_id" for a in gene["aliases"])


def test_assembly_without_a_ucsc_browser(tmp_path, gene_snapshot_path, gene_uid):
    service = altered_snapshot(
        tmp_path, gene_snapshot_path, "UPDATE assembly SET ucsc_browser_url = NULL"
    )
    try:
        response = make_client(service).get(
            f"/api/v1/genes/{gene_uid('PF3D7_1133400')}"
        )
    finally:
        service.close()
    assert response.status_code == 200
    assert response.json()["gene"]["ucscBrowserUrl"] is None


def test_unknown_gene_is_404(client):
    response = client.get(f"/api/v1/genes/{uuid.uuid4()}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_gene_uid_that_is_not_a_uuid_is_422(client):
    assert client.get("/api/v1/genes/PF3D7_1133400").status_code == 422


def test_missing_snapshot_is_503(tmp_path, gene_uid):
    service = GeneCatalogService.local(str(tmp_path / "missing.duckdb"), "")
    assert not service.is_available()
    assert service.status == "unavailable"
    response = make_client(service).get(f"/api/v1/genes/{gene_uid('PF3D7_1133400')}")
    assert response.status_code == 503
    assert response.json() == {"detail": "Gene data is unavailable"}


def test_transcript_and_protein_products_differ(client, gene_uid):
    response = client.get(f"/api/v1/genes/{gene_uid('PF3D7_0103600')}")
    [transcript] = response.json()["gene"]["transcripts"]
    assert transcript["transcriptProduct"] == "ATP-dependent DNA/RNA helicase PSH1"
    assert transcript["proteinProduct"] == "putative ATP-dependent RNA helicase"


def test_concurrent_requests(service, gene_uid):
    # Each request makes its own cursor from the shared connection.
    uids = [gene_uid(lt) for lt in ["PF3D7_1133400", "PF3D7_0105400"]] * 50
    with ThreadPoolExecutor(max_workers=16) as pool:
        genes = list(pool.map(service.get_gene, uids))
    assert [g.locus_tag for g in genes] == ["PF3D7_1133400", "PF3D7_0105400"] * 50


@pytest.mark.parametrize(
    "change",
    [
        "UPDATE snapshot SET schema_version = 2",
        "DROP TABLE alt_id",
        "ALTER TABLE transcript DROP COLUMN protein_product",
    ],
)
def test_snapshot_of_another_shape_is_unavailable(tmp_path, gene_snapshot_path, change):
    service = altered_snapshot(tmp_path, gene_snapshot_path, change)
    assert not service.is_available()
    response = make_client(service).get(f"/api/v1/genes/{uuid.uuid4()}")
    assert response.status_code == 503


def test_the_app_serves_genes_from_its_local_snapshot(app_with_stubbed_agent):
    # Through create_app's own route and service, not this module's overrides.
    response = TestClient(app_with_stubbed_agent).get(
        "/api/v1/genes/d9049485-ed74-5455-98c2-5dc13eef544a"
    )
    assert response.status_code == 200
    assert response.json()["gene"]["locusTag"] == "PF3D7_1133400"


def test_the_app_starts_and_stops_a_local_snapshot(app_with_stubbed_agent):
    # The lifespan starts every service; a local one is already open, so it
    # must not start a loader that opens it a second time. Shutdown closes it.
    with TestClient(app_with_stubbed_agent) as client:
        service = get_gene_catalog_service()
        assert service._loader is None
        assert client.get("/api/v1/health").json()["genes"] == {
            "status": "ready",
            "source": "local",
            "build_id": BUILD_ID,
        }
    assert service._con is None


def test_transcripts_are_in_genome_order(client, gene_uid):
    gene = client.get(f"/api/v1/genes/{gene_uid('PF3D7_0105400')}").json()["gene"]
    assert [t["transcriptId"] for t in gene["transcripts"]] == [
        "XM_001350949.2",
        "XM_024473365.1",
    ]


# The checked-in BioNym graphs (app/data/bionym), by gene.
KELCH13_UID = "f0adadd3-973b-5c61-9e11-7c688b4e0895"
BIONYM_GENES = {
    KELCH13_UID: "PF3D7_1343700",
    "01acd065-284a-5e6d-9ffd-92ec072b2b01": "PF3D7_0709000",
    "d9049485-ed74-5455-98c2-5dc13eef544a": "PF3D7_1133400",
}


def write_graph(directory, gene_uid: str, sources: dict) -> None:
    """Write a BioNym graph in which each source reports one claim.

    sources maps a source's node ID to its node type and URL. The graph's
    query is a gene node, PF3D7_0000000, with no edges.
    """
    nodes = {"PF3D7_0000000": {"type": "Gene", "label": "PF3D7_0000000", "url": None}}
    edges = []
    for i, (source_id, (node_type, url)) in enumerate(sources.items()):
        claim_id = f"claim:claim {i}"
        nodes[source_id] = {"type": node_type, "label": f"Source {i}", "url": url}
        nodes[claim_id] = {"type": "Claim", "label": f"Claim {i}", "url": None}
        edges.append(
            {
                "subject": source_id,
                "predicate": "reports",
                "object": claim_id,
                "confidence": 0.9,
                "evidence": [
                    {
                        "retrieved_at": "2026-11-02T17:00:00Z",
                        "payload": {"claim": f"Claim {i}", "quote": f"Quote {i}."},
                    }
                ],
            }
        )
    graph = {
        "nodes": nodes,
        "edges": edges,
        "metadata": {"input": "PF3D7_0000000", "query": "PF3D7_0000000"},
    }
    with gzip.open(directory / f"{gene_uid}.json.gz", "wt") as f:
        json.dump(graph, f)


@pytest.fixture(scope="module")
def checked_in_graphs() -> BionymGraphStore:
    return BionymGraphStore(BIONYM_GRAPHS_DIR)


def test_bionym_claims(checked_in_graphs):
    response = make_client(graphs=checked_in_graphs).get(
        f"/api/v1/genes/{KELCH13_UID}/bionym"
    )
    assert response.status_code == 200
    body = response.json()
    assert body["geneUid"] == KELCH13_UID
    assert body["input"] == "PF3D7_1343700"
    assert body["runDate"] == "2026-11-02"
    assert sum(len(s["claims"]) for s in body["sources"]) == 783
    [paper] = [
        s
        for s in body["sources"]
        if s["title"].startswith(
            "Role of Plasmodium falciparum Kelch 13 Protein Mutations"
        )
    ]
    assert paper["kind"] == "paper"
    assert paper["url"].startswith("https://")
    claim = next(
        c
        for c in paper["claims"]
        if c["text"] == "PfK13 mutations are associated with artemisinin resistance"
    )
    assert claim["confidence"] == 0.99
    assert claim["quote"].startswith("Mutations in the Plasmodium falciparum")
    # Sources by title; each source's claims by confidence, highest first.
    titles = [s["title"] for s in body["sources"]]
    assert titles == sorted(titles, key=str.casefold)
    for source in body["sources"]:
        confidences = [c["confidence"] for c in source["claims"]]
        assert confidences == sorted(confidences, reverse=True)


@pytest.mark.parametrize("gene_uid, locus_tag", BIONYM_GENES.items())
def test_every_checked_in_bionym_graph_is_read(checked_in_graphs, gene_uid, locus_tag):
    claims = checked_in_graphs.get_claims(uuid.UUID(gene_uid))
    assert claims is not None
    assert claims.input == locus_tag
    assert {s.kind for s in claims.sources} == {"paper", "dataset"}


def test_bionym_graph(checked_in_graphs):
    response = make_client(graphs=checked_in_graphs).get(
        f"/api/v1/genes/{KELCH13_UID}/bionym/graph"
    )
    assert response.status_code == 200
    body = response.json()
    assert body["geneUid"] == KELCH13_UID
    # The whole graph, ortholog-group members included.
    assert len(body["nodes"]) == 5239
    assert len(body["edges"]) == 6536
    assert sum(e["predicate"] == "has_member" for e in body["edges"]) == 2460
    [root] = [n for n in body["nodes"] if n["id"] == body["query"]]
    assert (root["id"], root["type"]) == ("PF3D7_1343700", "Gene")
    # Only the fields the explorer draws.
    assert set(root) == {"id", "type", "label", "url"}
    assert set(body["edges"][0]) == {"subject", "predicate", "object", "confidence"}


@pytest.mark.parametrize("gene_uid, locus_tag", BIONYM_GENES.items())
def test_every_checked_in_bionym_graph_has_its_gene_as_root(
    checked_in_graphs, gene_uid, locus_tag
):
    graph = checked_in_graphs.get_graph(uuid.UUID(gene_uid))
    assert graph is not None
    assert graph.query == locus_tag
    assert {n.type for n in graph.nodes if n.id == locus_tag} == {"Gene"}


@pytest.mark.parametrize("path", ["bionym", "bionym/graph"])
def test_gene_without_a_bionym_graph_is_404(tmp_path, path):
    response = make_client(graphs=BionymGraphStore(tmp_path)).get(
        f"/api/v1/genes/{uuid.uuid4()}/{path}"
    )
    assert response.status_code == 404


def test_bionym_gene_uid_that_is_not_a_uuid_is_422(tmp_path):
    response = make_client(graphs=BionymGraphStore(tmp_path)).get(
        "/api/v1/genes/PF3D7_1343700/bionym"
    )
    assert response.status_code == 422


def test_bionym_links_other_than_https_are_dropped(tmp_path):
    uid = str(uuid.uuid4())
    write_graph(
        tmp_path,
        uid,
        {
            "pubmed:1": ("Publication", "https://pubmed.ncbi.nlm.nih.gov/1/"),
            "pubmed:2": ("Publication", "http://pubmed.ncbi.nlm.nih.gov/2/"),
            "dataset:3": ("Dataset", "javascript:alert(1)"),
            "dataset:4": ("Dataset", None),
        },
    )
    sources = (
        make_client(graphs=BionymGraphStore(tmp_path))
        .get(f"/api/v1/genes/{uid}/bionym")
        .json()["sources"]
    )
    assert {s["id"]: (s["kind"], s["url"]) for s in sources} == {
        "pubmed:1": ("paper", "https://pubmed.ncbi.nlm.nih.gov/1/"),
        "pubmed:2": ("paper", None),
        "dataset:3": ("dataset", None),
        "dataset:4": ("dataset", None),
    }
    nodes = (
        make_client(graphs=BionymGraphStore(tmp_path))
        .get(f"/api/v1/genes/{uid}/bionym/graph")
        .json()["nodes"]
    )
    assert {n["id"]: n["url"] for n in nodes if n["type"] != "Claim"} == {
        "PF3D7_0000000": None,
        "pubmed:1": "https://pubmed.ncbi.nlm.nih.gov/1/",
        "pubmed:2": None,
        "dataset:3": None,
        "dataset:4": None,
    }


def test_bionym_claim_from_a_node_that_is_not_a_source_is_an_error(tmp_path):
    uid = uuid.uuid4()
    write_graph(tmp_path, str(uid), {"assembly:1": ("Assembly", None)})
    with pytest.raises(ValueError, match="isn't a source"):
        BionymGraphStore(tmp_path)


def _rewrite_graph(directory, gene_uid: str, change) -> None:
    path = directory / f"{gene_uid}.json.gz"
    with gzip.open(path, "rt") as f:
        graph = json.load(f)
    change(graph)
    with gzip.open(path, "wt") as f:
        json.dump(graph, f)


def test_bionym_graph_whose_query_is_not_a_node_is_an_error(tmp_path):
    uid = str(uuid.uuid4())
    write_graph(tmp_path, uid, {"pubmed:1": ("Publication", None)})
    _rewrite_graph(tmp_path, uid, lambda g: g["metadata"].update(query="PF3D7_9999999"))
    with pytest.raises(ValueError, match="isn't a node"):
        BionymGraphStore(tmp_path)


def test_bionym_graph_edge_to_a_missing_node_is_an_error(tmp_path):
    uid = str(uuid.uuid4())
    write_graph(tmp_path, uid, {"pubmed:1": ("Publication", None)})
    _rewrite_graph(
        tmp_path,
        uid,
        lambda g: g["edges"].append(
            {**g["edges"][0], "predicate": "cited_in", "object": "pubmed:missing"}
        ),
    )
    with pytest.raises(ValueError, match="not a node"):
        BionymGraphStore(tmp_path)
