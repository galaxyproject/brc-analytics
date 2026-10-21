"""MCP tool calls that fail on the caller's input (unknown id, bad arguments)
are ordinary answers to a bad question and must not become Sentry errors;
anything else a tool raises still must."""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock

import pytest
import sentry_sdk
from fastmcp import Client
from fastmcp.exceptions import ToolError
from mcp.shared.exceptions import McpError
from pydantic import BaseModel, TypeAdapter
from sentry_sdk.transport import Transport

from app.core.errors import CallerInputError
from app.core.sentry import before_send
from app.services.catalog_data import CatalogData
from app.services.mcp_server import create_mcp_server
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


class _CapturingTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.events = []

    def capture_envelope(self, envelope):
        for item in envelope.items:
            if item.type == "event":
                self.events.append(item.payload.json)


@pytest.fixture()
def sentry_events():
    transport = _CapturingTransport()
    sentry_sdk.init(
        dsn="https://examplePublicKey@example.ingest.sentry.io/1",
        transport=transport,
        before_send=before_send,
        traces_sample_rate=1.0,
    )
    yield transport.events
    sentry_sdk.get_client().close()
    sentry_sdk.init()


@pytest.fixture()
def catalog(tmp_path):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    # All three files, or the missing-file error is itself a Sentry event.
    (tmp_path / "assemblies.json").write_text("[]")
    return CatalogData(str(tmp_path))


def _call(mcp, tool, args):
    async def go():
        async with Client(mcp) as client:
            with pytest.raises(ToolError) as exc:
                await client.call_tool(tool, args)
            return str(exc.value)

    return asyncio.run(go())


def _exception_types(events):
    return [v["type"] for e in events for v in e.get("exception", {}).get("values", [])]


@pytest.mark.parametrize(
    "tool,args",
    [
        ("get_organism", {"taxonomy_id": "99999999"}),
        ("get_assembly_details", {"accession": "GCF_999999999.1"}),
        ("get_workflow_details", {"iwc_id": "no-such-workflow"}),
        (
            "resolve_workflow_inputs",
            {"iwc_id": "no-such-workflow", "accession": "GCF_000002765.6"},
        ),
        # A str where the schema wants a list -- the BRC-ANALYTICS-DEV-5X shape.
        ("get_compatible_workflows", {"ploidies": "HAPLOID"}),
        ("search_ena_keywords", {"keywords": "Escherichia coli"}),
    ],
)
def test_caller_input_errors_are_not_reported(sentry_events, catalog, tool, args):
    ena = MagicMock()
    ena.search_by_keywords = AsyncMock(return_value={"data": []})
    mcp = create_mcp_server(catalog, ena)

    message = _call(mcp, tool, args)

    # The caller still gets a useful error back...
    assert message
    # ...but nothing is sent to Sentry.
    sentry_sdk.flush()
    assert sentry_events == []


def test_unknown_organism_resource_is_not_reported(sentry_events, catalog):
    mcp = create_mcp_server(catalog, MagicMock())

    async def go():
        async with Client(mcp) as client:
            with pytest.raises(McpError):
                await client.read_resource("brc://catalog/organisms/99999999")

    asyncio.run(go())
    sentry_sdk.flush()
    assert sentry_events == []


def test_upstream_failure_is_still_reported(sentry_events, catalog):
    # An ENA 400 is usually a query we built badly -- that is our bug, and it
    # has to keep reaching Sentry.
    ena = MagicMock()
    ena.search_by_keywords = AsyncMock(side_effect=RuntimeError("ENA said 400"))
    mcp = create_mcp_server(catalog, ena)

    _call(mcp, "search_ena_keywords", {"keywords": ["AMR Gene Detection"]})

    sentry_sdk.flush()
    assert "ToolError" in _exception_types(sentry_events)


def test_unexpected_tool_exception_is_still_reported(sentry_events, catalog):
    catalog.get_organism_by_taxonomy_id = MagicMock(side_effect=KeyError("boom"))
    mcp = create_mcp_server(catalog, MagicMock())

    _call(mcp, "get_organism", {"taxonomy_id": "5833"})

    sentry_sdk.flush()
    assert "KeyError" in _exception_types(sentry_events)


def test_pydantic_error_from_a_tool_body_is_still_reported(sentry_events, catalog):
    # fastmcp re-raises any pydantic ValidationError untouched, including one
    # from our own code inside the tool -- only argument validation is the
    # caller's fault.
    class Strict(BaseModel):
        n: int

    def broken(*_a, **_k):
        Strict(n="not a number")

    catalog.get_organism_by_taxonomy_id = MagicMock(side_effect=broken)
    mcp = create_mcp_server(catalog, MagicMock())

    _call(mcp, "get_organism", {"taxonomy_id": "5833"})

    sentry_sdk.flush()
    assert "ValidationError" in _exception_types(sentry_events)


def test_call_titled_error_from_a_tool_body_is_still_reported(sentry_events, catalog):
    # A TypeAdapter over a helper also titles its error "call[...]", so the
    # title alone can't tell argument validation from a bug in the tool body.
    def helper(n: int) -> int:
        return n

    def broken(*_a, **_k):
        TypeAdapter(helper).validate_python({"n": "not a number"})

    catalog.get_organism_by_taxonomy_id = MagicMock(side_effect=broken)
    mcp = create_mcp_server(catalog, MagicMock())

    _call(mcp, "get_organism", {"taxonomy_id": "5833"})

    sentry_sdk.flush()
    assert "ValidationError" in _exception_types(sentry_events)


def test_failure_while_handling_a_caller_error_is_still_reported():
    # Only fastmcp's own wrappers are looked through; a RuntimeError between
    # the ToolError and the CallerInputError is a real fault.
    try:
        try:
            raise CallerInputError("no such id")
        except CallerInputError as e:
            raise RuntimeError("recovery failed") from e
    except RuntimeError as e:
        inner = e
    try:
        raise ToolError("Error calling tool 'x'") from inner
    except ToolError as e:
        outer = e

    event = {"contexts": {"trace": {"op": "mcp.server"}}}
    hint = {"exc_info": (type(outer), outer, outer.__traceback__)}
    assert before_send(event, hint) is event


def test_wrapped_caller_error_is_dropped():
    try:
        try:
            raise CallerInputError("no such id")
        except CallerInputError as e:
            raise ToolError("Error calling tool 'x'") from e
    except ToolError as e:
        outer = e

    hint = {"exc_info": (type(outer), outer, outer.__traceback__)}
    assert before_send({}, hint) is None


def test_missing_catalog_file_is_logged_as_an_error(tmp_path, caplog):
    # With a file missing every lookup is a not-found, which Sentry now
    # ignores -- so the missing file itself has to be loud.
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    with caplog.at_level("ERROR", logger="app.services.catalog_data"):
        CatalogData(str(tmp_path))
    assert any(
        r.levelname == "ERROR" and "workflows.json" in r.getMessage()
        for r in caplog.records
    )
