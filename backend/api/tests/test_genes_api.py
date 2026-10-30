"""Tests for the gene API, against the checked-in 3D7 gene snapshot (#1904)."""

import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor

import duckdb
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import genes
from app.core.config import DEFAULT_GENE_SNAPSHOT_PATH
from app.core.dependencies import get_gene_catalog_service
from app.services.gene_catalog import GeneCatalogService


def make_client(service: GeneCatalogService) -> TestClient:
    app = FastAPI()
    app.include_router(genes.router, prefix="/api/v1/genes")
    app.dependency_overrides[get_gene_catalog_service] = lambda: service
    return TestClient(app)


@pytest.fixture(scope="module")
def service():
    service = GeneCatalogService(
        str(DEFAULT_GENE_SNAPSHOT_PATH), "https://brc-analytics.org/"
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


def test_checked_in_snapshot_opens(service):
    assert service.is_available()
    assert service.snapshot.build_id.startswith("temp-GCF_000002765.6-")


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


def test_unknown_gene_is_404(client):
    response = client.get(f"/api/v1/genes/{uuid.uuid4()}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_gene_uid_that_is_not_a_uuid_is_422(client):
    assert client.get("/api/v1/genes/PF3D7_1133400").status_code == 422


def test_missing_snapshot_is_503(tmp_path, gene_uid):
    service = GeneCatalogService(str(tmp_path / "missing.duckdb"), "")
    assert not service.is_available()
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
def test_snapshot_of_another_shape_is_unavailable(tmp_path, change):
    path = tmp_path / "genes.duckdb"
    shutil.copy(DEFAULT_GENE_SNAPSHOT_PATH, path)
    con = duckdb.connect(str(path))
    con.execute(change)
    con.close()
    service = GeneCatalogService(str(path), "")
    assert not service.is_available()
    response = make_client(service).get(f"/api/v1/genes/{uuid.uuid4()}")
    assert response.status_code == 503


def test_the_app_serves_genes_from_its_default_snapshot(app_with_stubbed_agent):
    # Through create_app's own route and service, not this module's overrides.
    response = TestClient(app_with_stubbed_agent).get(
        "/api/v1/genes/d9049485-ed74-5455-98c2-5dc13eef544a"
    )
    assert response.status_code == 200
    assert response.json()["gene"]["locusTag"] == "PF3D7_1133400"


def test_transcripts_are_in_genome_order(client, gene_uid):
    gene = client.get(f"/api/v1/genes/{gene_uid('PF3D7_0105400')}").json()["gene"]
    assert [t["transcriptId"] for t in gene["transcripts"]] == [
        "XM_001350949.2",
        "XM_024473365.1",
    ]
