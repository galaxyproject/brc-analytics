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
def test_an_unknown_mode_reads_as_off(monkeypatch, raw):
    # "extract" was a second mode, since removed; a deploy still setting it
    # gets the shipped behaviour rather than a half-configured one.
    monkeypatch.setenv("LOGAN_NARROWING_MODE", raw)
    get_settings.cache_clear()
    assert get_settings().LOGAN_NARROWING_MODE == "off"


def test_the_tool_mode_is_read_loosely(monkeypatch):
    monkeypatch.setenv("LOGAN_NARROWING_MODE", " Tool ")
    get_settings.cache_clear()
    assert get_settings().LOGAN_NARROWING_MODE == "tool"


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


class TestExportQueries:
    def test_a_cancelled_query_interrupts_its_connection(self):
        import threading
        import time as _time

        from app.services.logan_narrowing import run_export_query

        interrupted = threading.Event()

        class FakeCon:
            def interrupt(self):
                interrupted.set()

        def blocking(interrupt=None):
            interrupt.attach(FakeCon())
            for _ in range(50):
                if interrupted.is_set():
                    raise RuntimeError("interrupted")
                _time.sleep(0.02)
            return "finished"

        async def go():
            with pytest.raises(asyncio.TimeoutError):
                await asyncio.wait_for(run_export_query(blocking), timeout=0.1)

        asyncio.run(go())
        assert interrupted.wait(1.0)

    def test_a_cancel_before_the_connection_exists_still_stops_it(self):
        import threading

        from app.services.logan_narrowing import run_export_query
        from app.services.tools.catalog_query import QueryCancelled

        connecting, ran, raised = threading.Event(), [], []
        release = threading.Event()

        def slow_connect(interrupt=None):
            connecting.set()
            release.wait(2.0)  # the cancel lands here, before attach
            try:
                interrupt.attach(object())
            except QueryCancelled:
                raised.append(True)
                raise
            ran.append(True)

        async def go():
            task = asyncio.ensure_future(run_export_query(slow_connect))
            await asyncio.to_thread(connecting.wait, 2.0)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
            release.set()  # the cancel is in; now let the connect finish

        asyncio.run(go())
        deadline = threading.Event()
        for _ in range(100):
            if raised or ran:
                break
            deadline.wait(0.02)
        assert raised == [True] and ran == []

    def test_a_cancelled_query_keeps_its_slot_until_its_thread_returns(
        self, monkeypatch
    ):
        import threading

        import app.services.logan_narrowing as ln

        monkeypatch.setattr(ln, "_EXPORT_SLOTS", threading.BoundedSemaphore(1))
        first_done, second_started = threading.Event(), threading.Event()
        order = []

        def deaf(interrupt=None):
            # Ignores the interrupt, as a statement past its last check would.
            threading.Event().wait(0.3)
            order.append("first done")
            first_done.set()

        def second(interrupt=None):
            order.append("second started")
            second_started.set()
            return 2

        async def go():
            with pytest.raises(asyncio.TimeoutError):
                await asyncio.wait_for(ln.run_export_query(deaf), timeout=0.05)
            return await ln.run_export_query(second)

        assert asyncio.run(go()) == 2
        assert order == ["first done", "second started"]

    def test_waiting_for_a_slot_holds_no_thread_and_cancelling_frees_it(
        self, monkeypatch
    ):
        import threading

        import app.services.logan_narrowing as ln

        sem = threading.BoundedSemaphore(1)
        monkeypatch.setattr(ln, "_EXPORT_SLOTS", sem)
        entered, release = [], threading.Event()

        def hold(interrupt=None):
            entered.append("hold")
            release.wait(2.0)

        def quick(interrupt=None):
            entered.append("quick")

        async def go():
            holder = asyncio.ensure_future(ln.run_export_query(hold))
            waiters = [
                asyncio.ensure_future(ln.run_export_query(quick)) for _ in range(5)
            ]
            await asyncio.sleep(0.2)
            # Only the holder reached a thread; the rest wait on the loop.
            assert entered == ["hold"]
            for w in waiters:
                w.cancel()
            await asyncio.gather(*waiters, return_exceptions=True)
            release.set()
            await holder

        asyncio.run(go())
        assert entered == ["hold"]
        # Every slot came back: the one there is can be taken, and only one.
        assert sem.acquire(blocking=False) and not sem.acquire(blocking=False)
        sem.release()

    def test_a_call_cancelled_before_its_thread_starts_returns_the_slot(
        self, monkeypatch
    ):
        import threading

        import app.services.logan_narrowing as ln

        sem = threading.BoundedSemaphore(1)
        monkeypatch.setattr(ln, "_EXPORT_SLOTS", sem)
        ran = []

        async def go():
            loop = asyncio.get_running_loop()
            # One executor thread, kept busy, so the next call is queued
            # behind it and cancelled before it starts.
            from concurrent.futures import ThreadPoolExecutor

            pool = ThreadPoolExecutor(max_workers=1)
            loop.set_default_executor(pool)
            gate = threading.Event()
            busy = loop.run_in_executor(pool, gate.wait, 2.0)
            task = asyncio.ensure_future(
                ln.run_export_query(lambda interrupt=None: ran.append(1))
            )
            await asyncio.sleep(0.1)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
            gate.set()
            await busy

        asyncio.run(go())
        assert ran == []
        assert sem.acquire(blocking=False)
        sem.release()

    def test_concurrent_queries_are_bounded_across_event_loops(self, monkeypatch):
        import threading
        import time as _time

        import app.services.logan_narrowing as ln

        monkeypatch.setattr(ln, "_EXPORT_SLOTS", threading.BoundedSemaphore(2))
        lock = threading.Lock()
        running, peak = [0], [0]

        def work(interrupt=None):
            with lock:
                running[0] += 1
                peak[0] = max(peak[0], running[0])
            _time.sleep(0.05)
            with lock:
                running[0] -= 1
            return 1

        async def go():
            return await asyncio.gather(*(ln.run_export_query(work) for _ in range(3)))

        # Two loops in two threads, as two workers' requests would be.
        results = []
        loops = [
            threading.Thread(target=lambda: results.append(asyncio.run(go())))
            for _ in range(2)
        ]
        for t in loops:
            t.start()
        for t in loops:
            t.join()
        assert results == [[1] * 3, [1] * 3]
        assert peak[0] == 2
