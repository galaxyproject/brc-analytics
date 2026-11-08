"""LOGAN_NARROWING_MODE=tool, offline.

A real AssistantAgent over FunctionModels and the F1 fixture served by the
evals' fixture-backed Galaxy, so the export reads and counts are real and only
the models are scripted. (Off is pinned against a capture of the pre-narrowing
agent in test_logan_narrowing_off.py.)
"""

from __future__ import annotations

import asyncio
import json

import pytest

from app.core.config import get_settings
from evals.logan_fixture import FixtureGalaxy, load_all_fixtures, load_fixture

F1 = "logan_pfal_18s"


def _count(where: str) -> int:
    import duckdb

    con = duckdb.connect()
    try:
        return con.execute(
            f"SELECT count(*) FROM read_parquet(?) WHERE {where}",
            [str(load_fixture(F1).parquet)],
        ).fetchone()[0]
    finally:
        con.close()


class _Script:
    """A scripted model: what the conversational call does, turn by turn.
    Records what each call was shown."""

    def __init__(self, reply="ok", tool_call=None):
        self.reply = reply
        self.tool_call = tool_call
        self.seen_tools: list[list[str]] = []
        self.seen_instructions: list[str | None] = []
        self.tool_returns: list[str] = []

    async def run(self, messages, info):
        from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart

        if info.output_tools:
            return ModelResponse(  # the tracker extractor
                parts=[ToolCallPart(info.output_tools[0].name, {})]
            )
        last = messages[-1]
        returns = [p for p in last.parts if p.part_kind == "tool-return"]
        if returns:
            self.tool_returns.extend(str(p.content) for p in returns)
            return ModelResponse(parts=[TextPart(self.reply)])
        self.seen_tools.append(sorted(t.name for t in info.function_tools))
        self.seen_instructions.append(getattr(last, "instructions", None))
        if self.tool_call:
            name, args = self.tool_call
            return ModelResponse(parts=[ToolCallPart(name, args)])
        return ModelResponse(parts=[TextPart(self.reply)])


_FIXTURES = object()


def _agent(monkeypatch, tmp_path, mode, script, galaxy=_FIXTURES):
    from pydantic_ai.models.function import FunctionModel

    from app.services.assistant_agent import AssistantAgent
    from evals.tasks import _make_cache

    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("AI_API_KEY", "stub")
    monkeypatch.setenv("ASSISTANT_OUTPUT_MODE", "tool")
    monkeypatch.setenv("LOGAN_NARROWING_MODE", mode)
    get_settings.cache_clear()
    monkeypatch.setattr(
        AssistantAgent, "_build_model", lambda self, name: FunctionModel(script.run)
    )
    if galaxy is _FIXTURES:
        galaxy = FixtureGalaxy(load_all_fixtures())
    return AssistantAgent(_make_cache(), galaxy=galaxy)


class NoExport(FixtureGalaxy):
    async def get_cached_kmindex_export(self, job_id):
        return None


def _logan_session(agent, fixture=F1):
    from app.models.logan import LoganSnapshot

    snap = LoganSnapshot.model_validate(load_fixture(fixture).snapshot)
    return asyncio.run(agent.create_logan_session_from_snapshot(snap, None))


def _chat(agent, session_id, *turns):
    async def go():
        resp = None
        for turn in turns:
            resp, _tel, state = await agent.chat_with_telemetry(
                turn, session_id=session_id
            )
        return resp, state

    return asyncio.run(go())


@pytest.fixture(autouse=True)
def _clear_settings():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.parametrize("raw", ["sometimes", "extract", " Extract "])
def test_an_unknown_mode_reads_as_off_and_says_so(monkeypatch, caplog, raw):
    # "extract" was a second mode, since removed; a deploy still setting it
    # gets the shipped behaviour rather than a half-configured one.
    monkeypatch.setenv("LOGAN_NARROWING_MODE", raw)
    get_settings.cache_clear()
    with caplog.at_level("WARNING", logger="app.core.config"):
        assert get_settings().LOGAN_NARROWING_MODE == "off"
    assert "LOGAN_NARROWING_MODE" in caplog.text


@pytest.mark.parametrize("raw", [" Tool ", "tool", "OFF", None])
def test_known_modes_are_read_loosely_and_quietly(monkeypatch, caplog, raw):
    if raw is None:
        monkeypatch.delenv("LOGAN_NARROWING_MODE", raising=False)
    else:
        monkeypatch.setenv("LOGAN_NARROWING_MODE", raw)
    get_settings.cache_clear()
    with caplog.at_level("WARNING", logger="app.core.config"):
        mode = get_settings().LOGAN_NARROWING_MODE
    assert mode == (raw or "off").strip().lower()
    assert "LOGAN_NARROWING_MODE" not in caplog.text


def test_the_dataset_labels_a_run_with_the_mode_the_server_runs(monkeypatch):
    # The dataset used to parse the variable itself, without stripping it.
    from evals.datasets import logan_narrowing as ds

    monkeypatch.setenv("LOGAN_NARROWING_MODE", "tool ")
    get_settings.cache_clear()
    monkeypatch.setattr(ds, "make_logan_conversation_task", lambda deps, entry: None)
    dataset, _task, _primary = ds.build(None, None, None, only=["count_score"])
    assert dataset.cases[0].metadata["mode"] == "tool"


class TestToolMode:
    def test_the_tool_is_offered_only_in_logan_sessions(self, monkeypatch, tmp_path):
        script = _Script()
        agent = _agent(monkeypatch, tmp_path, "tool", script)
        state = _logan_session(agent)
        _chat(agent, state.session_id, "hi")
        _chat(agent, None, "hi")  # an ordinary session
        logan_tools, plain_tools = script.seen_tools
        assert "query_logan_hits" in logan_tools
        assert "query_logan_hits" not in plain_tools
        assert "`query_logan_hits`" in script.seen_instructions[0]
        assert script.seen_instructions[1] is None

    def test_without_galaxy_there_is_neither_tool_nor_hint(self, monkeypatch, tmp_path):
        script = _Script()
        agent = _agent(monkeypatch, tmp_path, "tool", script, galaxy=None)
        state = _logan_session(agent)
        _chat(agent, state.session_id, "hi")
        assert agent.narrowing_mode == "off"
        assert "query_logan_hits" not in script.seen_tools[0]
        assert "query_logan_hits" not in (script.seen_instructions[0] or "")

    def test_the_tool_counts_over_the_export(self, monkeypatch, tmp_path):
        query = {
            "filters": [
                {"field": "country", "op": "eq", "value": "Thailand"},
                {"field": "assay_type", "op": "eq", "value": "WGS"},
            ]
        }
        script = _Script(tool_call=("query_logan_hits", query), reply="181 runs.")
        agent = _agent(monkeypatch, tmp_path, "tool", script)
        state = _logan_session(agent)
        resp, _ = _chat(agent, state.session_id, "How many Thai WGS runs?")
        [ret] = script.tool_returns
        payload = json.loads(ret)
        assert payload["total"] == _count("country = 'Thailand' AND assay_type = 'WGS'")
        assert payload["total_matches"] == 17629
        assert resp.reply == "181 runs."

    def test_no_cached_export_points_at_the_results_page(self, monkeypatch, tmp_path):
        script = _Script(tool_call=("query_logan_hits", {"filters": []}))
        agent = _agent(
            monkeypatch, tmp_path, "tool", script, galaxy=NoExport(load_all_fixtures())
        )
        state = _logan_session(agent)
        _chat(agent, state.session_id, "How many?")
        payload = json.loads(script.tool_returns[0])
        assert payload["status"] == "export_not_cached"
        assert payload["results_url"].startswith("/logan-search?job=")


def test_every_logan_hit_field_is_named_everywhere():
    from app.services import logan_narrowing as ln
    from app.services.tools.catalog_query import ENTITY_SCHEMA

    for name in ENTITY_SCHEMA["logan_hit"].fields:
        for text in (ln.TOOL_HINT, ln.TOOL_DESCRIPTION):
            assert name in text, name


class TestToolErrors:
    """What query_logan_hits answers when it can't count. The eval's scorers
    rely on an error carrying no total."""

    def _call(self, logan, galaxy=None):
        from app.services.logan_narrowing import query_logan_hits
        from app.services.tools.catalog_query import LoganHitQuery
        from app.services.tools.catalog_tools import AssistantDeps

        deps = AssistantDeps(
            catalog=None,
            galaxy=galaxy or FixtureGalaxy(load_all_fixtures()),
            logan=logan,
        )
        return json.loads(asyncio.run(query_logan_hits(deps, LoganHitQuery())))

    def _logan(self):
        return dict(load_fixture(F1).snapshot)

    @pytest.mark.parametrize("logan", [None, {}, {"job_id": ""}])
    def test_no_search_is_an_error(self, logan):
        out = self._call(logan)
        assert "error" in out and "total" not in out

    def test_a_failed_query_is_an_error_without_a_total(self, monkeypatch):
        import app.services.logan_narrowing as ln

        def boom(q, con):
            raise RuntimeError("disk on fire")

        monkeypatch.setattr(ln, "execute", boom)
        out = self._call(self._logan())
        assert out == {"error": "Query failed; try a simpler filter."}

    def test_an_unreadable_export_is_not_worth_retrying(self, monkeypatch):
        import app.services.logan_narrowing as ln
        from app.services.tools.catalog_query import LoganExportMismatch

        def mismatch(q, con):
            raise LoganExportMismatch("missing ['score']")

        monkeypatch.setattr(ln, "execute", mismatch)
        out = self._call(self._logan())
        assert out["status"] == "export_unreadable"
        assert "total" not in out and "simpler filter" not in out["message"]
        assert out["results_url"].startswith("/logan-search?job=")

    def test_a_result_carries_the_searchs_total(self):
        out = self._call(self._logan())
        assert out["total"] == out["total_matches"] == 17629
