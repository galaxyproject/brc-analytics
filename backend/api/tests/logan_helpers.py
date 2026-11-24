"""Asking the logan_hit engine for an answer from a test.

Goes through run_export_query, the path query_logan_hits takes, so the answer
comes over the real capped connection and view rather than a second copy of
those steps kept for tests.
"""

from __future__ import annotations

import asyncio
from collections.abc import Coroutine
from pathlib import Path
from typing import Any, TypeVar

from app.services.logan_export_query import run_export_query
from app.services.tools.catalog_query import LoganHitQuery, execute

T = TypeVar("T")

# Far longer than any of these queries takes, and short enough to fail fast.
WAIT_S = 5.0


def run_bounded(coro: Coroutine[Any, Any, T], timeout: float = WAIT_S) -> T:
    """asyncio.run with a ceiling.

    An export query waits for a slot for as long as it takes, so a regression
    that loses one would otherwise hang the test run instead of failing it.
    """

    async def bounded() -> T:
        return await asyncio.wait_for(coro, timeout)

    return asyncio.run(bounded())


def execute_logan_hits(q: LoganHitQuery, parquet: Path) -> dict:
    """The engine's summary for `q` over one job's export."""
    return run_bounded(run_export_query(parquet, lambda con: execute(q, con)))
