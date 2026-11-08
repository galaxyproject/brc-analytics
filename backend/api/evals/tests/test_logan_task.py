"""The Logan eval task and its fixture-backed Galaxy, offline.

The task drives a real AssistantAgent; here its model is a FunctionModel, so
what is checked is the plumbing -- what the output reports about each turn,
and what the stand-in Galaxy serves -- not any model's behaviour.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.services.logan_snapshot import build_logan_snapshot
from evals.logan_fixture import (
    EXTRAS_KEY,
    FixtureGalaxy,
    LoganFixture,
    load_all_fixtures,
    load_fixture,
)
from evals.tasks import _trace_parts, _turn_messages
from tests.test_logan_snapshot import JOB
from tests.test_logan_snapshot import results as logan_page

OTHER_JOB = "0123456789abcdef"


def _write_fixture(dirpath: Path, name: str, with_parquet: bool = True) -> None:
    page = logan_page()
    snap = build_logan_snapshot(page, captured_at="t").model_dump(mode="json")
    extras = {"results": page.model_dump(mode="json")}
    if with_parquet:
        (dirpath / f"{name}.parquet").write_bytes(b"PAR1 stand-in")
        extras["parquet"] = f"{name}.parquet"
    snap[EXTRAS_KEY] = extras
    (dirpath / f"{name}.json").write_text(json.dumps(snap))


def test_load_fixture_splits_snapshot_from_extras(tmp_path):
    _write_fixture(tmp_path, "pf")
    fx = load_fixture("pf", tmp_path)
    assert EXTRAS_KEY not in fx.snapshot
    assert fx.job_id == JOB
    assert fx.parquet == tmp_path / "pf.parquet"
    assert fx.extras["results"]["job_id"] == JOB


def test_load_all_refuses_a_bare_snapshot(tmp_path):
    _write_fixture(tmp_path, "pf")
    (tmp_path / "old.json").write_text(json.dumps({"job_id": "x"}))
    with pytest.raises(ValueError, match="old.json"):
        load_all_fixtures(tmp_path)


def test_a_fixture_without_an_export_has_no_parquet(tmp_path):
    _write_fixture(tmp_path, "pf", with_parquet=False)
    assert load_fixture("pf", tmp_path).parquet is None


def test_a_named_export_that_is_missing_is_an_error(tmp_path):
    # Read as "no export", the fixture would serve its 25 captured hits as the
    # whole job.
    _write_fixture(tmp_path, "pf")
    (tmp_path / "pf.parquet").unlink()
    with pytest.raises(FileNotFoundError, match="pf.parquet"):
        load_fixture("pf", tmp_path)


def test_fixture_galaxy_serves_known_jobs_and_misses_unknown(tmp_path):
    _write_fixture(tmp_path, "pf")
    galaxy = FixtureGalaxy(load_all_fixtures(tmp_path))

    async def go():
        page = await galaxy.get_cached_kmindex_results(JOB, limit=2, offset=1)
        assert page is not None
        assert [h.accession for h in page.hits] == ["SRR7590703", "ERR450106"]
        assert page.offset == 1
        assert await galaxy.get_cached_kmindex_results(OTHER_JOB) is None
        assert await galaxy.get_cached_kmindex_export(JOB) == tmp_path / "pf.parquet"
        assert await galaxy.get_cached_kmindex_export(OTHER_JOB) is None
        status = await galaxy.get_job_status(OTHER_JOB)
        assert status.is_complete and status.is_successful

    asyncio.run(go())
    assert ("get_cached_kmindex_results", OTHER_JOB) in galaxy.calls


def test_fixture_galaxy_refuses_two_fixtures_for_one_job():
    fx = LoganFixture(name="a", snapshot={"job_id": JOB})
    twin = LoganFixture(name="b", snapshot={"job_id": JOB})
    with pytest.raises(ValueError, match="share job id"):
        FixtureGalaxy([fx, twin])


def test_turn_slice_starts_at_the_last_user_prompt():
    history = [
        {
            "kind": "request",
            "instructions": "FIRST",
            "parts": [{"part_kind": "user-prompt"}],
        },
        {"kind": "response", "parts": [{"part_kind": "text"}]},
        {
            "kind": "request",
            "instructions": "SECOND",
            "parts": [{"part_kind": "user-prompt"}],
        },
        {
            "kind": "response",
            "parts": [
                {"part_kind": "tool-call", "tool_name": "t", "args": '{"a": 1}'},
                {"part_kind": "tool-call", "tool_name": "u", "args": "not json"},
            ],
        },
        {
            "kind": "request",
            "instructions": "THIRD",
            "parts": [{"part_kind": "tool-return", "content": {"total": 3}}],
        },
    ]
    turn = _turn_messages(history)
    assert len(turn) == 3
    instructions, calls, returns, _ = _trace_parts(turn)
    assert instructions == "SECOND"
    assert calls == [("t", {"a": 1}), ("u", {"_raw": "not json"})]
    assert returns == ['{"total": 3}']


def test_each_call_is_paired_with_its_own_return():
    turn = [
        {
            "kind": "response",
            "parts": [
                {"part_kind": "tool-call", "tool_name": "t", "tool_call_id": "a"},
                {"part_kind": "tool-call", "tool_name": "t", "tool_call_id": "b"},
                {"part_kind": "tool-call", "tool_name": "t", "tool_call_id": "c"},
            ],
        },
        {
            "kind": "request",
            "parts": [
                # Out of order, one a validation retry rather than a return.
                {"part_kind": "tool-return", "tool_call_id": "c", "content": "C"},
                {"part_kind": "retry-prompt", "tool_call_id": "b", "content": "bad"},
                {"part_kind": "tool-return", "tool_call_id": "a", "content": {"n": 1}},
            ],
        },
    ]
    assert _trace_parts(turn).call_returns == ['{"n": 1}', None, "C"]


def test_task_reports_instructions_tools_and_context(tmp_path, monkeypatch):
    """End to end over a FunctionModel that calls logan_cohort on a job with
    no fixture, then answers: the output carries the Logan block, the tool
    call, its "expired" return, and a context that holds the intro."""
    from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart
    from pydantic_ai.models.function import FunctionModel

    import evals.tasks as tasks_mod

    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("AI_API_KEY", "stub")
    monkeypatch.setenv("ASSISTANT_OUTPUT_MODE", "tool")
    get_settings.cache_clear()

    def model_fn(messages, info):
        if info.output_tools:  # the tracker extractor
            return ModelResponse(parts=[ToolCallPart(info.output_tools[0].name, {})])
        last = messages[-1]
        if any(p.part_kind == "tool-return" for p in last.parts):
            return ModelResponse(parts=[TextPart("It matched 17,629 runs.")])
        return ModelResponse(
            parts=[ToolCallPart("logan_cohort", {"job_id": OTHER_JOB})]
        )

    def fake_prepare(svc, entry):
        svc.agent._model = FunctionModel(model_fn)
        svc.extract_agent._model = FunctionModel(model_fn)

    monkeypatch.setattr(tasks_mod, "_prepare_service", fake_prepare)
    _write_fixture(tmp_path, "pf")
    galaxy = FixtureGalaxy(load_all_fixtures(tmp_path))
    deps = tasks_mod.EvalDeps(
        settings=get_settings(), cache=tasks_mod._make_cache(), catalog=None
    )
    task = tasks_mod.make_logan_conversation_task(deps, entry=None, galaxy=galaxy)
    try:
        # By name: the fixture resolves through the galaxy the task was given,
        # not through the committed fixture directory.
        out = asyncio.run(task({"fixture": "pf", "turns": ["What is this?"]}))
    finally:
        get_settings.cache_clear()

    assert out.reply == "It matched 17,629 runs."
    assert "## Logan search context" in out.instructions
    assert out.tool_calls == [("logan_cohort", {"job_id": OTHER_JOB})]
    [turn] = out.turns
    assert turn.message == "What is this?"
    assert '"status": "expired"' in turn.tool_returns[0]
    # Paired to its call by id, from the real pydantic-ai history.
    assert turn.call_returns == turn.tool_returns
    assert turn.latency_s >= 0
    # The context the numbers check reads holds each turn's instructions and
    # every tool return, not just the fallback re-render.
    assert "## Logan search context" in turn.instructions
    assert "## Logan search context" in out.context
    assert '"status": "expired"' in out.context
    # The intro (the session's first message) and the user's words are context.
    assert "This Logan search" in out.context
    assert "What is this?" in out.context
    assert out.session_metadata["logan"]["job_id"] == JOB


def test_pages_past_the_captured_hits_come_from_the_export(tmp_path):
    import duckdb

    _write_fixture(tmp_path, "pf")
    # A real export behind the fixture: the three captured hits, then two more.
    con = duckdb.connect()
    con.execute(
        f"""COPY (SELECT * FROM (VALUES
            ('ERR662077', 1.0, 1.0, 's', 'Plasmodium falciparum', 1),
            ('SRR7590703', 1.0, 1.0, 's', 'Plasmodium falciparum', 2),
            ('ERR450106', 0.98, 0.99, 's', 'Plasmodium falciparum', 3),
            ('SRR0000004', 0.7, 0.98, 's', 'Plasmodium vivax', 4),
            ('SRR0000005', 0.6, 0.97, 's', NULL, 5)
        ) t(accession, score, ani, shard, organism, n) ORDER BY n)
        TO '{tmp_path / "pf.parquet"}' (FORMAT parquet)"""
    )
    con.close()
    galaxy = FixtureGalaxy(load_all_fixtures(tmp_path))

    async def go():
        page = await galaxy.get_cached_kmindex_results(JOB, limit=4, offset=1)
        return page

    page = asyncio.run(go())
    assert [h.accession for h in page.hits] == [
        "SRR7590703",
        "ERR450106",
        "SRR0000004",
        "SRR0000005",
    ]
    assert page.hits[2].sra.organism == "Plasmodium vivax"
    # A run the mirror doesn't carry has no metadata object, as on the page.
    assert page.hits[3].sra is None


def test_a_trimmed_export_is_not_paged_past_its_exact_rows(tmp_path):
    import duckdb

    _write_fixture(tmp_path, "pf")
    con = duckdb.connect()
    con.execute(
        "COPY (SELECT 'SRR' || i AS accession, 1.0 - i / 100 AS score, 0.9 AS ani, "
        f"'s' AS shard FROM range(10) t(i)) TO '{tmp_path / 'pf.parquet'}' "
        "(FORMAT parquet)"
    )
    con.close()
    data = json.loads((tmp_path / "pf.json").read_text())
    data["_fixture"]["trim"] = {"rows_total": 500, "rows_kept": 10, "top": 5}
    (tmp_path / "pf.json").write_text(json.dumps(data))
    galaxy = FixtureGalaxy(load_all_fixtures(tmp_path))
    page = asyncio.run(galaxy.get_cached_kmindex_results(JOB, limit=10, offset=0))
    # Three captured hits, then export rows 3 and 4 -- and nothing sampled.
    assert len(page.hits) == 5
