"""Helpers for the gene API's tests, shared by their modules and conftest.py."""

import csv
import shutil
from pathlib import Path
from typing import Optional

import duckdb
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import genes
from app.core.dependencies import get_bionym_graphs, get_gene_catalog_service
from app.services.bionym_graphs import BionymGraphStore
from app.services.gene_catalog import GeneCatalogService

# Sixteen of 3D7's genes, exported from a snapshot as text so the fixture can
# be reviewed. scripts/export_test_gene_snapshot.py writes it, and lists the
# genes and what each is there to test.
GENE_SNAPSHOT_EXPORT = Path(__file__).parent / "data" / "gene_snapshot"

# The test snapshot's build ID, read from its export rather than from a
# service, so a test of a service's health doesn't compare it with itself.
with open(GENE_SNAPSHOT_EXPORT / "snapshot.csv", newline="") as _f:
    BUILD_ID = next(csv.DictReader(_f))["build_id"]


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
