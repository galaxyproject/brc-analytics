"""Tests for the MCP endpoint mount, tool discovery, and tool invocation.

These are regression tests for the FastMCP + FastAPI lifespan chaining pattern
in app/main.py. If the mounted FastMCP http_app's lifespan is not chained into
the parent FastAPI lifespan, the StreamableHTTPSessionManager's anyio task
group never starts and every request to /api/v1/mcp/ returns 500 with
RuntimeError("Task group is not initialized. Make sure to use run().").
"""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from fastmcp import Client

from app.services.catalog_data import CatalogData
from app.services.mcp_server import create_mcp_server
from app.services.sra_mirror import SRAMirrorService
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS
from tests.test_sra_mirror import _build_mirror

SRA_TOOL_NAMES = {"search_sra", "sra_data_summary", "get_sra_study_runs"}


def _make_app(tmp_path, monkeypatch, sra_mirror_path=None):
    """Build a fresh app via create_app() with a sample catalog and stubbed
    Redis-backed services. Optionally point SRA_MIRROR_PATH at a real mirror so
    the MCP server registers the SRA tools (exercises the main.py wiring)."""
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    if sra_mirror_path is not None:
        monkeypatch.setenv("SRA_MIRROR_PATH", sra_mirror_path)
    else:
        # Clear it explicitly -- config.py load_dotenv()s the developer's .env,
        # so without this the no-mirror tests pass or fail depending on whether
        # whoever is running them happens to have a mirror configured.
        monkeypatch.delenv("SRA_MIRROR_PATH", raising=False)

    fake_cache = MagicMock()
    fake_cache.clear_caches = AsyncMock(return_value=0)
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

    from app.main import create_app

    return create_app()


@pytest.fixture()
def mcp_app(tmp_path, monkeypatch):
    yield _make_app(tmp_path, monkeypatch)


@pytest.fixture()
def mcp_app_with_mirror(tmp_path, monkeypatch):
    mirror_path = str(tmp_path / "mcp-int-mirror.duckdb")
    _build_mirror(mirror_path)
    yield _make_app(tmp_path, monkeypatch, sra_mirror_path=mirror_path)


def _parse_sse(body: str) -> dict:
    """Return the JSON payload of the first SSE data frame in an MCP response."""
    for line in body.splitlines():
        if line.startswith("data: "):
            return json.loads(line[len("data: ") :])
    raise AssertionError(f"No SSE data frame in response:\n{body}")


def _mcp_post(
    client: TestClient,
    method: str,
    params: dict | None = None,
    path: str = "/api/v1/mcp/",
    follow_redirects: bool | None = None,
) -> dict:
    kwargs = {}
    if follow_redirects is not None:
        kwargs["follow_redirects"] = follow_redirects
    response = client.post(
        path,
        json={
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": 1,
        },
        headers={"Accept": "application/json, text/event-stream"},
        **kwargs,
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


def test_mcp_endpoint_without_trailing_slash_succeeds(mcp_app):
    """Regression test for the missing trailing slash issue.

    Mounting FastMCP causes Starlette to issue a 307 redirect if the path lacks
    a trailing slash, which breaks POST clients behind reverse proxies.
    MCPPathNormalizeMiddleware normalizes /api/v1/mcp in ASGI scope so both work.
    follow_redirects=False ensures the endpoint handles the request directly
    without issuing an HTTP 307 redirect.
    """
    with TestClient(mcp_app, follow_redirects=False) as client:
        result = _mcp_post(
            client,
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "pytest", "version": "1"},
            },
            path="/api/v1/mcp",
            follow_redirects=False,
        )
    assert result.get("error") is None
    assert result["result"]["serverInfo"]["name"] == "BRC Analytics"


def test_mcp_resources_list_exposes_expected_resources(mcp_app):
    with TestClient(mcp_app) as client:
        result = _mcp_post(client, "resources/list")

    uris = {r["uri"] for r in result["result"]["resources"]}
    expected = {
        "brc://catalog/summary",
        "brc://catalog/categories",
        "brc://catalog/workflows",
    }
    assert expected <= uris


def test_mcp_resource_read_summary(mcp_app):
    with TestClient(mcp_app) as client:
        result = _mcp_post(
            client,
            "resources/read",
            {"uri": "brc://catalog/summary"},
        )
    contents = result["result"]["contents"]
    assert len(contents) == 1
    summary = json.loads(contents[0]["text"])
    assert summary["name"] == "BRC Analytics Catalog"
    assert summary["organisms_count"] >= 1
    assert "categories" in summary


def test_mcp_resource_read_workflows_respects_scope(mcp_app):
    with TestClient(mcp_app) as client:
        result = _mcp_post(
            client,
            "resources/read",
            {"uri": "brc://catalog/workflows"},
        )
    contents = result["result"]["contents"]
    workflows = json.loads(contents[0]["text"])
    iwc_ids = {w["iwcId"] for w in workflows}
    # assembly-with-flye is ORGANISM-scope in SAMPLE_WORKFLOWS and must not appear
    assert "assembly-with-flye" not in iwc_ids
    # ...while the ASSEMBLY-scope ones must, or the exclusion above proves nothing.
    assert {"rnaseq-pe", "varcall-haploid", "varcall-diploid"} <= iwc_ids


def test_mcp_prompts_list_and_get(mcp_app):
    with TestClient(mcp_app) as client:
        list_res = _mcp_post(client, "prompts/list")
        prompt_names = {p["name"] for p in list_res["result"]["prompts"]}
        assert "plan_pathogen_analysis" in prompt_names

        get_res = _mcp_post(
            client,
            "prompts/get",
            {
                "name": "plan_pathogen_analysis",
                "arguments": {"organism": "Plasmodium falciparum"},
            },
        )
        messages = get_res["result"]["messages"]
        assert len(messages) == 1
        text = messages[0]["content"]["text"]
        assert "Plasmodium falciparum" in text
        # No mirror configured, so the prompt must not steer toward a missing tool.
        assert "search_sra" not in text
        assert "search_ena" in text


def test_mcp_prompt_mentions_search_sra_when_mirror_enabled(mcp_app_with_mirror):
    with TestClient(mcp_app_with_mirror) as client:
        get_res = _mcp_post(
            client,
            "prompts/get",
            {
                "name": "plan_pathogen_analysis",
                "arguments": {"organism": "Plasmodium falciparum"},
            },
        )
    text = get_res["result"]["messages"][0]["content"]["text"]
    assert "search_sra" in text


# -- SRA mirror exposure (opt-in, gated on mirror availability) --


def _catalog_data(tmp_path) -> CatalogData:
    cat_dir = tmp_path / "catalog"
    cat_dir.mkdir()
    (cat_dir / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (cat_dir / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    return CatalogData(str(cat_dir))


def _tool_names(mcp) -> set:
    return {t.name for t in asyncio.run(mcp.list_tools())}


def _call_tool(mcp, name, arguments) -> dict:
    async def go():
        async with Client(mcp) as client:
            return await client.call_tool(name, arguments)

    return asyncio.run(go()).data


@pytest.fixture()
def mirror(tmp_path):
    path = str(tmp_path / "unit-mirror.duckdb")
    _build_mirror(path)
    svc = SRAMirrorService(path)
    assert svc.is_available()
    return svc


class TestSRAToolGating:
    """The three SRA tools register only when a mirror is passed and available;
    a default deploy (no mirror) exposes exactly the tools it does today."""

    def test_registered_when_mirror_available(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        assert SRA_TOOL_NAMES <= _tool_names(mcp)

    def test_absent_by_default(self, tmp_path):
        # No sra_mirror argument at all -- backward-compatible default.
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock())
        assert not (SRA_TOOL_NAMES & _tool_names(mcp))

    def test_absent_when_mirror_none(self, tmp_path):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=None)
        assert not (SRA_TOOL_NAMES & _tool_names(mcp))

    def test_absent_when_mirror_unavailable(self, tmp_path):
        unavailable = SRAMirrorService(str(tmp_path / "missing.duckdb"))
        assert unavailable.is_available() is False
        mcp = create_mcp_server(
            _catalog_data(tmp_path), MagicMock(), sra_mirror=unavailable
        )
        assert not (SRA_TOOL_NAMES & _tool_names(mcp))


class TestSRAInstructions:
    """Routing guidance is added to the server instructions only when the SRA
    tools are registered (same discipline as the assistant prompt, F1)."""

    def test_instructions_mention_sra_when_available(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        assert "search_sra" in mcp.instructions

    def test_instructions_silent_without_mirror(self, tmp_path):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=None)
        assert "search_sra" not in mcp.instructions
        assert "SRA" not in mcp.instructions


class TestSRAToolCalls:
    """Each wrapper returns the service dict as-is."""

    def test_search_sra_returns_runs(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        data = _call_tool(mcp, "search_sra", {"organism": "Plasmodium falciparum"})
        assert data["n_returned"] >= 1
        assert "SRR001" in {run["accession"] for run in data["runs"]}

    def test_search_sra_passes_filters(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        data = _call_tool(
            mcp,
            "search_sra",
            {"organism": "Plasmodium falciparum", "platform": "OXFORD_NANOPORE"},
        )
        accs = {run["accession"] for run in data["runs"]}
        assert accs == {"SRR002"}

    def test_sra_data_summary_returns_counts(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        data = _call_tool(
            mcp, "sra_data_summary", {"organism": "Plasmodium falciparum"}
        )
        assert data["resolved"] is True
        assert data["n_runs"] >= 2

    def test_get_sra_study_runs_returns_runs(self, tmp_path, mirror):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), sra_mirror=mirror)
        data = _call_tool(mcp, "get_sra_study_runs", {"accession": "PRJNA12345"})
        assert data["matched_column"] == "bioproject"
        assert data["n_returned"] == 2


class TestSRAMCPWiring:
    """End-to-end through create_app(): SRA_MIRROR_PATH set wires the mirror
    into the mounted MCP server; unset leaves the SRA tools off."""

    def test_tools_list_includes_sra_with_mirror(self, mcp_app_with_mirror):
        with TestClient(mcp_app_with_mirror) as client:
            result = _mcp_post(client, "tools/list")
        names = {tool["name"] for tool in result["result"]["tools"]}
        assert SRA_TOOL_NAMES <= names

    def test_tool_call_sra_data_summary(self, mcp_app_with_mirror):
        with TestClient(mcp_app_with_mirror) as client:
            result = _mcp_post(
                client,
                "tools/call",
                {
                    "name": "sra_data_summary",
                    "arguments": {"organism": "Plasmodium falciparum"},
                },
            )
        structured = result["result"]["structuredContent"]
        assert structured["resolved"] is True
        assert structured["n_runs"] >= 2

    def test_tools_list_excludes_sra_without_mirror(self, mcp_app):
        with TestClient(mcp_app) as client:
            result = _mcp_post(client, "tools/list")
        names = {tool["name"] for tool in result["result"]["tools"]}
        assert not (SRA_TOOL_NAMES & names)


LOGAN_TOOL_NAMES = {"logan_job_status", "logan_cohort", "logan_hits"}


def _fake_galaxy(available=True, cached=None):
    g = MagicMock()
    g.is_available.return_value = available
    g.get_cached_kmindex_results = AsyncMock(return_value=cached)
    g.get_job_status = AsyncMock()
    return g


class TestLoganToolGating:
    def test_absent_without_galaxy(self, tmp_path):
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock())
        assert not (LOGAN_TOOL_NAMES & _tool_names(mcp))

    def test_absent_when_galaxy_unconfigured(self, tmp_path):
        mcp = create_mcp_server(
            _catalog_data(tmp_path), MagicMock(), galaxy=_fake_galaxy(False)
        )
        assert not (LOGAN_TOOL_NAMES & _tool_names(mcp))

    def test_registered_with_galaxy(self, tmp_path):
        mcp = create_mcp_server(
            _catalog_data(tmp_path), MagicMock(), galaxy=_fake_galaxy()
        )
        assert LOGAN_TOOL_NAMES <= _tool_names(mcp)
        assert "logan_cohort" in mcp.instructions

    def test_cohort_miss_is_a_dict(self, tmp_path):
        galaxy = _fake_galaxy(cached=None)
        galaxy.get_job_status = AsyncMock(return_value=MagicMock(is_complete=True))
        mcp = create_mcp_server(_catalog_data(tmp_path), MagicMock(), galaxy=galaxy)
        out = _call_tool(mcp, "logan_cohort", {"job_id": "fe6f66a714dcbec8"})
        assert out["status"] == "expired"
        assert out["results_url"] == "/logan-search?job=fe6f66a714dcbec8"
