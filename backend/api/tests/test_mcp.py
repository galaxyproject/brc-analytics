"""Tests for the MCP endpoint mount, tool discovery, and tool invocation.

These are regression tests for the FastMCP + FastAPI lifespan chaining pattern
in app/main.py. If the mounted FastMCP http_app's lifespan is not chained into
the parent FastAPI lifespan, the StreamableHTTPSessionManager's anyio task
group never starts and every request to /api/v1/mcp/ returns 500 with
RuntimeError("Task group is not initialized. Make sure to use run().").
"""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


@pytest.fixture()
def mcp_app(tmp_path, monkeypatch):
    """Build a fresh app via create_app() with a sample catalog and stubbed
    Redis-backed services."""
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))

    fake_cache = MagicMock()
    fake_cache.flush_all = AsyncMock()
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()

    from app.core import dependencies
    from app.core.config import get_settings

    get_settings.cache_clear()
    dependencies.reset_all_services()

    monkeypatch.setattr(
        dependencies, "get_cache_service", MagicMock(return_value=fake_cache)
    )
    monkeypatch.setattr(
        dependencies, "get_auth_service", MagicMock(return_value=fake_auth)
    )
    monkeypatch.setattr(
        dependencies, "get_llm_service", MagicMock(return_value=MagicMock())
    )

    from app.main import create_app

    yield create_app()


def _parse_sse(body: str) -> dict:
    """Return the JSON payload of the first SSE data frame in an MCP response."""
    for line in body.splitlines():
        if line.startswith("data: "):
            return json.loads(line[len("data: ") :])
    raise AssertionError(f"No SSE data frame in response:\n{body}")


def _mcp_post(client: TestClient, method: str, params: dict | None = None) -> dict:
    response = client.post(
        "/api/v1/mcp/",
        json={
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": 1,
        },
        headers={"Accept": "application/json, text/event-stream"},
    )
    assert response.status_code == 200, (
        f"MCP {method} returned {response.status_code}: {response.text}"
    )
    return _parse_sse(response.text)


def test_mcp_initialize_succeeds(mcp_app):
    """Regression test for the FastMCP lifespan chaining bug.

    A broken mount returns HTTP 500 with a RuntimeError from the session
    manager. A correctly wired mount returns a JSON-RPC initialize result.
    """
    with TestClient(mcp_app) as client:
        result = _mcp_post(
            client,
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "pytest", "version": "1"},
            },
        )

    assert result.get("error") is None, result
    server_info = result["result"]["serverInfo"]
    assert server_info["name"] == "BRC Analytics"


def test_mcp_tools_list_exposes_expected_tools(mcp_app):
    with TestClient(mcp_app) as client:
        result = _mcp_post(client, "tools/list")

    tool_names = {tool["name"] for tool in result["result"]["tools"]}
    expected = {
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
    missing = expected - tool_names
    assert not missing, f"MCP tools/list is missing expected tools: {missing}"


def test_mcp_tool_call_search_organisms(mcp_app):
    with TestClient(mcp_app) as client:
        result = _mcp_post(
            client,
            "tools/call",
            {"name": "search_organisms", "arguments": {"query": "plasmodium"}},
        )

    structured = result["result"]["structuredContent"]
    assert structured["count"] >= 1
    species = {org["species"] for org in structured["organisms"]}
    assert "Plasmodium falciparum" in species
