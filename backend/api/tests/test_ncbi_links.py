"""Smoke tests for NCBI links API endpoints.

These tests run against a live backend instance (via Docker).
Set BASE_URL environment variable to override the default endpoint.
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


def test_organism_links_returns_list(client):
    """Organism links endpoint returns a non-empty list."""
    response = client.get("/api/v1/links/organism-links.json")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_organism_links_has_required_fields(client):
    """Organism links contain required fields."""
    response = client.get("/api/v1/links/organism-links.json")
    data = response.json()
    first_item = data[0]
    assert "ncbiTaxonomyId" in first_item
    assert "url" in first_item
    assert "scientificName" in first_item
    assert "brc-analytics.org" in first_item["url"]


def test_assembly_links_returns_list(client):
    """Assembly links endpoint returns a non-empty list."""
    response = client.get("/api/v1/links/assembly-links.json")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_assembly_links_has_required_fields(client):
    """Assembly links contain required fields."""
    response = client.get("/api/v1/links/assembly-links.json")
    data = response.json()
    first_item = data[0]
    assert "accession" in first_item
    assert "url" in first_item
    assert "ncbiTaxonomyId" in first_item
    assert "brc-analytics.org" in first_item["url"]


def test_assembly_url_format(client):
    """Assembly URLs use underscore format for accessions."""
    response = client.get("/api/v1/links/assembly-links.json")
    data = response.json()
    for item in data[:5]:
        accession = item["accession"]
        url = item["url"]
        expected_url_accession = accession.replace(".", "_")
        assert expected_url_accession in url, f"URL {url} should contain {expected_url_accession}"
