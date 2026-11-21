"""Running export queries: the real path over F1, and the cancel and slot
rules over a stand-in connection, where a test can say exactly when things
happen."""

from __future__ import annotations

import asyncio
import threading
from contextlib import contextmanager
from pathlib import Path

import duckdb
import pytest

import app.services.logan_export_query as leq
from app.services.logan_export_query import QueryCancelled, run_export_query
from app.services.tools.catalog_query import (
    LoganExportMismatch,
    LoganHitQuery,
    execute,
    execute_logan_hits,
)

F1 = (
    Path(__file__).resolve().parents[1]
    / "evals"
    / "datasets"
    / "fixtures"
    / "logan_pfal_18s.parquet"
)
MALAWI = LoganHitQuery.model_validate(
    {"filters": [{"field": "country", "op": "eq", "value": "Malawi"}]}
)


def test_a_query_runs_over_the_export():
    got = asyncio.run(run_export_query(F1, lambda con: execute(MALAWI, con)))
    assert got == execute_logan_hits(MALAWI, F1)
    assert got["total"] > 0


def test_a_file_of_the_wrong_shape_is_reported(tmp_path):
    bad = tmp_path / "old.parquet"
    con = duckdb.connect()
    con.execute(f"COPY (SELECT 'SRR1' AS accession) TO '{bad}' (FORMAT parquet)")
    con.close()
    with pytest.raises(LoganExportMismatch):
        asyncio.run(run_export_query(bad, lambda con: execute(MALAWI, con)))


def test_a_cancel_during_connect_closes_without_running_anything(monkeypatch):
    from app.services import kmindex_filters

    connecting, release = threading.Event(), threading.Event()
    opened, ran = [], []
    real = kmindex_filters._connect

    def slow_connect():
        connecting.set()
        release.wait(2.0)  # the cancel lands here, before the connection exists
        con = real()
        opened.append(con)
        return con

    monkeypatch.setattr(kmindex_filters, "_connect", slow_connect)

    async def go():
        task = asyncio.ensure_future(run_export_query(F1, ran.append))
        await asyncio.to_thread(connecting.wait, 2.0)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        release.set()

    asyncio.run(go())
    for _ in range(100):
        if opened:
            break
        threading.Event().wait(0.02)
    assert ran == []
    with pytest.raises(duckdb.ConnectionException):
        opened[0].execute("SELECT 1")


def test_a_cancel_between_statements_stops_the_next_one():
    interrupt = leq._Interrupt()
    with leq._open(F1, interrupt) as con:
        assert con.execute("SELECT count(*) FROM logan_hit").fetchone()[0] > 0
        interrupt.cancel()
        with pytest.raises(QueryCancelled):
            con.execute("SELECT 1")


def test_a_running_statement_is_interrupted_once():
    interrupt = leq._Interrupt()
    seen = []

    class Con:
        def interrupt(self):
            seen.append("interrupt")

    interrupt.attach(Con())
    interrupt.cancel()
    assert seen == ["interrupt"]
    interrupt.detach()
    interrupt.cancel()  # nothing attached: no second interrupt
    assert seen == ["interrupt"]


# ---------- the cancel and slot rules, over a stand-in connection ----------


class _FakeCon:
    def __init__(self):
        self.interrupted = threading.Event()

    def interrupt(self):
        self.interrupted.set()


@pytest.fixture
def fake_open(monkeypatch):
    """Swap the real connection for one the test can watch."""
    cons: list[_FakeCon] = []

    @contextmanager
    def _open(parquet, interrupt):
        con = _FakeCon()
        cons.append(con)
        interrupt.attach(con)
        try:
            yield con
        finally:
            interrupt.detach()

    monkeypatch.setattr(leq, "_open", _open)
    return cons


@pytest.fixture
def one_slot(monkeypatch):
    sem = threading.BoundedSemaphore(1)
    monkeypatch.setattr(leq, "_EXPORT_SLOTS", sem)
    return sem


def test_a_cancelled_query_interrupts_its_connection(fake_open):
    def blocking(con):
        if not con.interrupted.wait(2.0):
            return "finished"
        raise RuntimeError("interrupted")

    async def go():
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(run_export_query(F1, blocking), timeout=0.1)

    asyncio.run(go())
    assert fake_open[0].interrupted.wait(1.0)


def test_a_cancelled_query_keeps_its_slot_until_its_thread_returns(fake_open, one_slot):
    order = []

    def deaf(con):
        # Ignores the interrupt, as a statement past its last check would.
        threading.Event().wait(0.3)
        order.append("first done")

    def second(con):
        order.append("second started")
        return 2

    async def go():
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(run_export_query(F1, deaf), timeout=0.05)
        return await run_export_query(F1, second)

    assert asyncio.run(go()) == 2
    assert order == ["first done", "second started"]


def test_waiting_for_a_slot_holds_no_thread_and_cancelling_frees_it(
    fake_open, one_slot
):
    entered, holding, release = [], threading.Event(), threading.Event()

    def hold(con):
        entered.append("hold")
        holding.set()
        release.wait(2.0)

    async def go():
        holder = asyncio.ensure_future(run_export_query(F1, hold))
        await asyncio.to_thread(holding.wait, 2.0)
        waiters = [
            asyncio.ensure_future(
                run_export_query(F1, lambda con: entered.append("quick"))
            )
            for _ in range(5)
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
    assert one_slot.acquire(blocking=False) and not one_slot.acquire(blocking=False)
    one_slot.release()


def test_a_call_cancelled_before_its_thread_starts_returns_the_slot(
    fake_open, one_slot
):
    from concurrent.futures import ThreadPoolExecutor

    ran = []

    async def go():
        loop = asyncio.get_running_loop()
        # One executor thread, kept busy, so the next call is queued behind
        # it and cancelled before it starts.
        pool = ThreadPoolExecutor(max_workers=1)
        loop.set_default_executor(pool)
        gate = threading.Event()
        busy = loop.run_in_executor(pool, gate.wait, 2.0)
        task = asyncio.ensure_future(run_export_query(F1, ran.append))
        await asyncio.sleep(0.1)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        gate.set()
        await busy

    asyncio.run(go())
    assert ran == []
    assert one_slot.acquire(blocking=False)
    one_slot.release()


def test_concurrent_queries_are_bounded_across_event_loops(fake_open, monkeypatch):
    monkeypatch.setattr(leq, "_EXPORT_SLOTS", threading.BoundedSemaphore(2))
    lock = threading.Lock()
    running, peak = [0], [0]
    # Two queries must be inside at once to pass this, so the cap is reached
    # on any runner, however slow; a third would make the count 3.
    pair = threading.Barrier(2, timeout=5)

    def work(con):
        with lock:
            running[0] += 1
            peak[0] = max(peak[0], running[0])
        pair.wait()
        with lock:
            running[0] -= 1
        return 1

    async def go():
        return await asyncio.gather(*(run_export_query(F1, work) for _ in range(3)))

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
