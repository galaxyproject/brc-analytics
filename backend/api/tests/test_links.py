"""Smoke tests for links API endpoints.

These tests run against a live backend instance (via Docker).
Set API_BASE_URL environment variable to override the default endpoint.
"""

import os

import httpx
import pytest

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")


@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL, timeout=30.0)


def test_health_endpoint(client):
    """Health endpoint returns healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_assemblies_links_returns_expected_format(client):
    """Assemblies links endpoint returns expected format."""
    response = client.get("/api/v1/assemblies/links")
    assert response.status_code == 200
    data = response.json()
    assert "assemblies" in data
    assert isinstance(data["assemblies"], list)
    assert len(data["assemblies"]) > 0


def test_assemblies_links_has_required_fields(client):
    """Assembly links contain required fields."""
    response = client.get("/api/v1/assemblies/links")
    data = response.json()
    first_item = data["assemblies"][0]
    assert "assemblyAccession" in first_item
    assert "relativePath" in first_item
    assert first_item["relativePath"].startswith("/data/assemblies/")


def test_assembly_link_by_accession(client):
    """Single assembly link endpoint returns correct data."""
    # First get a valid accession from the list
    response = client.get("/api/v1/assemblies/links")
    data = response.json()
    accession = data["assemblies"][0]["assemblyAccession"]

    # Then fetch that specific accession
    response = client.get(f"/api/v1/assemblies/links/{accession}")
    assert response.status_code == 200
    item = response.json()
    assert item["assemblyAccession"] == accession
    assert "relativePath" in item


def test_assembly_link_not_found(client):
    """Single assembly link endpoint returns 404 for unknown accession."""
    response = client.get("/api/v1/assemblies/links/INVALID_ACCESSION")
    assert response.status_code == 404


def test_organisms_links_returns_expected_format(client):
    """Organisms links endpoint returns expected format."""
    response = client.get("/api/v1/organisms/links")
    assert response.status_code == 200
    data = response.json()
    assert "organisms" in data
    assert isinstance(data["organisms"], list)
    assert len(data["organisms"]) > 0


def test_organisms_links_has_required_fields(client):
    """Organism links contain required fields."""
    response = client.get("/api/v1/organisms/links")
    data = response.json()
    first_item = data["organisms"][0]
    assert "ncbiTaxonomyId" in first_item
    assert "relativePath" in first_item
    assert "/data/organisms/" in first_item["relativePath"]


def test_organism_link_by_taxon_id(client):
    """Single organism link endpoint returns correct data."""
    # First get a valid taxon ID from the list
    response = client.get("/api/v1/organisms/links")
    data = response.json()
    taxon_id = data["organisms"][0]["ncbiTaxonomyId"]

    # Then fetch that specific taxon ID
    response = client.get(f"/api/v1/organisms/links/{taxon_id}")
    assert response.status_code == 200
    item = response.json()
    assert item["ncbiTaxonomyId"] == taxon_id
    assert "relativePath" in item


def test_organism_link_not_found(client):
    """Single organism link endpoint returns 404 for unknown taxon ID."""
    response = client.get("/api/v1/organisms/links/999999999")
    assert response.status_code == 404


def test_assembly_url_format(client):
    """Assembly relative paths use underscore format for accessions."""
    response = client.get("/api/v1/assemblies/links")
    data = response.json()
    for item in data["assemblies"][:5]:
        accession = item["assemblyAccession"]
        path = item["relativePath"]
        expected_url_accession = accession.replace(".", "_")
        assert expected_url_accession in path, (
            f"Path {path} should contain {expected_url_accession}"
        )
