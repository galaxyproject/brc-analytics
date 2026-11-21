"""Running a query over a Logan job's export, off the event loop.

An export can hold half a million rows, so a query over it runs in a worker
thread on its own capped DuckDB connection. Two things make that more than a
`to_thread` call:

- a query the caller gives up on (a timeout, a cancelled turn) has to stop,
  and DuckDB's interrupt() only stops a statement that is already running;
- the connections are big (two threads, 512 MB each), so how many run at
  once is capped across the whole process, and a query keeps its slot until
  its thread has actually returned.

`run_export_query(parquet, work)` opens the connection with the export as the
`logan_hit` view, hands it to `work`, and owns everything above.
"""

from __future__ import annotations

import asyncio
import threading
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any, TypeVar

T = TypeVar("T")

# Export queries in flight at once, across every turn in the process.
EXPORT_QUERY_SLOTS = 2

# Process-wide, so the cap holds across event loops (and the workers' own
# loops). Released by the worker thread when it returns, so a query the caller
# has given up on keeps its slot until its thread is actually done.
_EXPORT_SLOTS = threading.BoundedSemaphore(EXPORT_QUERY_SLOTS)
# How often a query waiting for a slot tries again. The wait is on the event
# loop, not in a thread, so a queue of waiters holds no executor threads.
_SLOT_POLL_S = 0.05


class QueryCancelled(RuntimeError):
    """The caller gave up on an export query before or while it ran."""


class _Interrupt:
    """Lets the caller stop a query running in another thread.

    The flag covers what interrupt() can't: a cancel that lands while the
    connection is still opening, or between statements. The worker checks it
    right after connecting and before every statement, under the same lock
    cancel() takes to read the connection. A cancel in the instant between
    that check and the statement starting still lets one statement run; the
    slot is held until the worker returns, so that costs time, not
    concurrency.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._con: Any = None
        self._cancelled = False

    def cancel(self) -> None:
        with self._lock:
            self._cancelled = True
            con = self._con
        if con is not None:
            try:
                con.interrupt()
            except Exception:  # noqa: BLE001 -- closed in the meantime is fine
                pass

    def check(self) -> None:
        with self._lock:
            if self._cancelled:
                raise QueryCancelled("export query cancelled")

    def attach(self, con: Any) -> None:
        with self._lock:
            if self._cancelled:
                raise QueryCancelled("export query cancelled while connecting")
            self._con = con

    def detach(self) -> None:
        with self._lock:
            self._con = None


class _Checked:
    """A connection that refuses to start a statement once cancelled."""

    def __init__(self, con: Any, interrupt: _Interrupt) -> None:
        self._con = con
        self._interrupt = interrupt

    def execute(self, *args: Any, **kwargs: Any) -> Any:
        self._interrupt.check()
        return self._con.execute(*args, **kwargs)


@contextmanager
def _open(parquet: Path, interrupt: _Interrupt) -> Iterator[Any]:
    """The capped connection with the export as `logan_hit`, registered with
    `interrupt` from the moment it exists. Closed on exit."""
    from app.services.kmindex_filters import _connect
    from app.services.tools.catalog_query import create_logan_view

    con = _connect()
    try:
        interrupt.attach(con)
        create_logan_view(con, parquet)
        yield _Checked(con, interrupt)
    finally:
        interrupt.detach()
        con.close()


async def run_export_query(parquet: Path, work: Callable[[Any], T]) -> T:
    """Run `work(con)` over the export in a worker thread, at most
    EXPORT_QUERY_SLOTS at a time across the process, and stop it if the
    caller gives up.

    @raises LoganExportMismatch: when the file is not the shape logan_hit
        declares.
    @raises QueryCancelled: in the worker, when the cancel lands first.
    """
    interrupt = _Interrupt()
    # Whoever runs first of the thread and a cancel decides who releases the
    # slot: a call cancelled before its thread starts may never run at all.
    handoff = threading.Lock()
    started = abandoned = False

    def call() -> T:
        nonlocal started
        with handoff:
            if abandoned:
                raise QueryCancelled("export query cancelled before it ran")
            started = True
        try:
            interrupt.check()
            with _open(parquet, interrupt) as con:
                return work(con)
        finally:
            _EXPORT_SLOTS.release()

    while not _EXPORT_SLOTS.acquire(blocking=False):
        await asyncio.sleep(_SLOT_POLL_S)
    try:
        return await asyncio.to_thread(call)
    except asyncio.CancelledError:
        interrupt.cancel()
        with handoff:
            if not started:
                abandoned = True
                _EXPORT_SLOTS.release()
        raise
