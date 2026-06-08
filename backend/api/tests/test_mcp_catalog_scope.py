"""Scope filtering for the MCP-server CatalogData (#1321).

The MCP server uses app.services.catalog_data.CatalogData, which is a separate
implementation from the assistant's app.services.tools.catalog_data.CatalogData
(covered in test_catalog_data.py). Both must hide non-ASSEMBLY-scope workflows
the guided single-organism/single-assembly flow can't drive.
"""

import json

import pytest

from app.services.catalog_data import CatalogData
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


@pytest.fixture
def mcp_catalog(tmp_path):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    return CatalogData(str(tmp_path))


class TestMcpScopeFiltering:
    """The ORGANISM-scope `assembly-with-flye` fixture must not surface via MCP."""

    def test_organism_scope_absent_from_category_listing(self, mcp_catalog):
        wfs = mcp_catalog.get_workflows_in_category("VARIANT_CALLING")
        iwc_ids = {w["iwcId"] for w in wfs}
        assert "assembly-with-flye" not in iwc_ids
        assert len(wfs) == 2

    def test_organism_scope_absent_from_compatible(self, mcp_catalog):
        # ANY ploidy + no taxonomy restriction would match if scope were ignored.
        wfs = mcp_catalog.get_compatible_workflows(["HAPLOID"])
        assert "assembly-with-flye" not in {w["iwcId"] for w in wfs}

    def test_organism_scope_details_returns_none(self, mcp_catalog):
        assert mcp_catalog.get_workflow_details("assembly-with-flye") is None

    def test_organism_scope_not_counted_in_categories(self, mcp_catalog):
        by_cat = {c["category"]: c for c in mcp_catalog.get_workflow_categories()}
        # VARIANT_CALLING holds 3 raw workflows but one is ORGANISM-scope.
        assert by_cat["VARIANT_CALLING"]["workflowCount"] == 2
