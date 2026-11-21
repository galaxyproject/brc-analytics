"""Asking the logan_hit engine for an answer from a test.

Goes through run_export_query, the path query_logan_hits takes, so the answer
comes over the real capped connection and view rather than a second copy of
those steps kept for tests.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from app.services.logan_export_query import run_export_query
from app.services.tools.catalog_query import LoganHitQuery, execute


def execute_logan_hits(q: LoganHitQuery, parquet: Path) -> dict:
    """The engine's summary for `q` over one job's export."""
    return asyncio.run(run_export_query(parquet, lambda con: execute(q, con)))
