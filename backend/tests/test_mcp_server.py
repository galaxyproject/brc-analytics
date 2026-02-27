"""Unit tests for MCP server tool registration and invocation.

Uses FastMCP's get_tool().run() to exercise the full tool dispatch
without HTTP. ENA tools use a mocked service.
"""

import os
import sys
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.catalog_data import CatalogData
from app.services.mcp_server import create_mcp_server

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "catalog", "output")

EXPECTED_TOOLS = {
    "search_organisms",
    "get_organism",
    "get_assemblies",
    "get_assembly_details",
    "list_workflow_categories",
    "get_workflows_in_category",
    "get_compatible_workflows",
    "get_workflow_details",
    "check_compatibility",
    "resolve_workflow_inputs",
    "search_ena",
    "search_ena_keywords",
}

SAMPLE_ENA_RECORDS = [
    {
        "run_accession": "SRR000001",
        "experiment_title": "WGS of E. coli",
        "instrument_platform": "ILLUMINA",
    },
    {
        "run_accession": "SRR000002",
        "experiment_title": "RNA-Seq of E. coli",
        "instrument_platform": "ILLUMINA",
    },
]


@pytest.fixture(scope="module")
def catalog_data():
    return CatalogData(CATALOG_PATH)


@pytest.fixture
def mock_ena_service():
    ena = AsyncMock()
    ena.search_by_taxonomy = AsyncMock(return_value={"data": SAMPLE_ENA_RECORDS})
    ena.search_by_keywords = AsyncMock(return_value={"data": SAMPLE_ENA_RECORDS})
    return ena


@pytest.fixture
def mcp(catalog_data, mock_ena_service):
    return create_mcp_server(catalog_data, mock_ena_service)


async def call_tool(mcp, name, args=None):
    """Helper: invoke an MCP tool by name and return structured_content."""
    tool = await mcp.get_tool(name)
    result = await tool.run(args or {})
    return result.structured_content


class TestMCPToolRegistration:
    @pytest.mark.asyncio
    async def test_has_expected_tool_count(self, mcp):
        tools = await mcp.get_tools()
        assert len(tools) == len(EXPECTED_TOOLS)

    @pytest.mark.asyncio
    async def test_tool_names(self, mcp):
        tools = await mcp.get_tools()
        assert set(tools.keys()) == EXPECTED_TOOLS


class TestMCPCatalogTools:
    @pytest.mark.asyncio
    async def test_search_organisms(self, mcp):
        result = await call_tool(mcp, "search_organisms", {"query": "Plasmodium"})
        assert result["count"] > 0
        assert len(result["organisms"]) > 0

    @pytest.mark.asyncio
    async def test_search_organisms_no_results(self, mcp):
        with pytest.raises(ValueError, match="No organisms found"):
            await call_tool(mcp, "search_organisms", {"query": "zzzznonexistent"})

    @pytest.mark.asyncio
    async def test_get_organism(self, mcp):
        result = await call_tool(mcp, "get_organism", {"taxonomy_id": "5833"})
        assert result["ncbiTaxonomyId"] == "5833"
        assert result["species"] == "Plasmodium falciparum"

    @pytest.mark.asyncio
    async def test_get_assemblies(self, mcp):
        result = await call_tool(mcp, "get_assemblies", {"taxonomy_id": "5833"})
        assert result["count"] > 0
        assert len(result["assemblies"]) > 0

    @pytest.mark.asyncio
    async def test_get_assembly_details(self, mcp):
        result = await call_tool(
            mcp, "get_assembly_details", {"accession": "GCF_000005845.2"}
        )
        assert result["accession"] == "GCF_000005845.2"

    @pytest.mark.asyncio
    async def test_list_workflow_categories(self, mcp):
        result = await call_tool(mcp, "list_workflow_categories")
        assert len(result["categories"]) == 8

    @pytest.mark.asyncio
    async def test_get_workflows_in_category(self, mcp):
        result = await call_tool(
            mcp, "get_workflows_in_category", {"category": "VARIANT_CALLING"}
        )
        assert result["count"] > 0

    @pytest.mark.asyncio
    async def test_get_compatible_workflows(self, mcp):
        result = await call_tool(
            mcp, "get_compatible_workflows", {"ploidies": ["HAPLOID"]}
        )
        assert result["count"] > 0

    @pytest.mark.asyncio
    async def test_get_workflow_details(self, mcp):
        result = await call_tool(
            mcp, "get_workflow_details", {"iwc_id": "amr_gene_detection-main"}
        )
        assert result["iwcId"] == "amr_gene_detection-main"
        assert result["name"] == "AMR Gene Detection"

    @pytest.mark.asyncio
    async def test_check_compatibility(self, mcp):
        result = await call_tool(
            mcp,
            "check_compatibility",
            {"iwc_id": "amr_gene_detection-main", "accession": "GCF_000005845.2"},
        )
        assert result["compatible"] is True

    @pytest.mark.asyncio
    async def test_resolve_workflow_inputs(self, mcp):
        result = await call_tool(
            mcp,
            "resolve_workflow_inputs",
            {"iwc_id": "amr_gene_detection-main", "accession": "GCF_000005845.2"},
        )
        assert "resolved" in result
        assert "unresolved" in result
        assert "compatible" in result


class TestMCPENATools:
    @pytest.mark.asyncio
    async def test_search_ena(self, mcp, mock_ena_service):
        result = await call_tool(mcp, "search_ena", {"taxonomy_id": "562"})
        assert result["count"] == 2
        assert len(result["records"]) == 2
        mock_ena_service.search_by_taxonomy.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_search_ena_no_results(self, mcp, mock_ena_service):
        mock_ena_service.search_by_taxonomy = AsyncMock(return_value={"data": []})
        with pytest.raises(ValueError, match="No ENA records"):
            await call_tool(mcp, "search_ena", {"taxonomy_id": "0000000"})

    @pytest.mark.asyncio
    async def test_search_ena_keywords(self, mcp, mock_ena_service):
        result = await call_tool(
            mcp, "search_ena_keywords", {"keywords": ["E. coli", "RNA-Seq"]}
        )
        assert result["count"] == 2
        mock_ena_service.search_by_keywords.assert_awaited_once()
