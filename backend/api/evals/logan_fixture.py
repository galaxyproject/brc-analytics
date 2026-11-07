"""Logan search fixtures for the evals, and a Galaxy stand-in that serves them.

A fixture is a pair captured from a real deployment by
`scripts/capture_logan_fixture.py`:

- `<name>.json` -- the `LoganSnapshot` the assistant would build, with the raw
  material later slices need under one extra key, `_fixture`, which the
  snapshot model ignores;
- `<name>.parquet` (optional) -- the job's export parquet, trimmed.

`FixtureGalaxy` answers the cache-only reads the assistant makes (the cached
results page, the cached export path, a job's status) from those files and
nothing else. A job id with no fixture reads as a cache miss, so "this search
has expired" is something a case can test.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

FIXTURE_DIR = Path(__file__).parent / "datasets" / "fixtures"
EXTRAS_KEY = "_fixture"


@dataclass
class LoganFixture:
    name: str
    snapshot: dict
    extras: dict = field(default_factory=dict)
    parquet: Optional[Path] = None

    @property
    def job_id(self) -> str:
        return self.snapshot["job_id"]


def load_fixture(name: str, fixture_dir: Path = FIXTURE_DIR) -> LoganFixture:
    """Read one fixture pair by name."""
    raw = json.loads((fixture_dir / f"{name}.json").read_text())
    extras = raw.pop(EXTRAS_KEY, {}) or {}
    parquet_name = extras.get("parquet")
    parquet = fixture_dir / parquet_name if parquet_name else None
    if parquet is not None and not parquet.is_file():
        parquet = None
    return LoganFixture(name=name, snapshot=raw, extras=extras, parquet=parquet)


def load_all_fixtures(fixture_dir: Path = FIXTURE_DIR) -> list[LoganFixture]:
    """Every fixture in the directory that carries the extras key.

    Older single-file snapshots (no `_fixture`) are skipped: they have no job
    to serve.
    """
    out = []
    for path in sorted(fixture_dir.glob("*.json")):
        raw = json.loads(path.read_text())
        if isinstance(raw, dict) and EXTRAS_KEY in raw:
            out.append(load_fixture(path.stem, fixture_dir))
    return out


def _export_hits(parquet: Path, offset: int, limit: int) -> list[dict]:
    """Export rows offset..offset+limit, shaped as results-page hits."""
    import duckdb

    from app.services.kmindex_filters import _hit_from_row

    con = duckdb.connect()
    try:
        cur = con.execute(
            "SELECT * FROM read_parquet(?) LIMIT ? OFFSET ?",
            [str(parquet), limit, offset],
        )
        names = [d[0] for d in cur.description]
        out = []
        for row in cur.fetchall():
            hit = _hit_from_row(names, row)
            hit["ani"] = dict(zip(names, row, strict=True)).get("ani")
            out.append(hit)
        return out
    finally:
        con.close()


class FixtureGalaxy:
    """The slice of GalaxyService the assistant reads, served from fixtures.

    Duck-typed rather than a GalaxyService subclass: the real constructor
    wants Redis and a Galaxy URL, and nothing here should be able to reach
    either. Calls are recorded in `calls` so tests can assert what was read.
    """

    def __init__(self, fixtures: list[LoganFixture]):
        self._by_job: dict[str, LoganFixture] = {}
        for fx in fixtures:
            if fx.job_id in self._by_job:
                raise ValueError(
                    f"fixtures {self._by_job[fx.job_id].name!r} and {fx.name!r} "
                    f"share job id {fx.job_id}; derived fixtures need their own"
                )
            self._by_job[fx.job_id] = fx
        self.calls: list[tuple[str, str]] = []

    def is_available(self) -> bool:
        return True

    def fixture_for(self, job_id: str) -> Optional[LoganFixture]:
        return self._by_job.get(job_id)

    async def get_job_status(self, job_id: str) -> Any:
        from app.models.galaxy import GalaxyJobStatus

        self.calls.append(("get_job_status", job_id))
        now = datetime.now(timezone.utc).isoformat()
        # Every job the evals ask about has finished: a fixture is a finished
        # job by construction, and an unknown id should read as expired rather
        # than still running.
        return GalaxyJobStatus(
            job_id=job_id,
            state="ok",
            created_time=now,
            updated_time=now,
            is_complete=True,
            is_successful=True,
        )

    async def get_cached_kmindex_results(
        self, job_id: str, limit: int = 25, offset: int = 0
    ) -> Any:
        """A results page, or None for a job with no fixture.

        The captured hits serve the top of the list. Past them, hits come from
        the fixture's export, which is written in the same rank order (for a
        trimmed export, exact through its top rows); a fixture without one
        has nothing past its captured hits.
        """
        from app.models.galaxy import KmindexResults

        self.calls.append(("get_cached_kmindex_results", job_id))
        fx = self._by_job.get(job_id)
        if fx is None or not fx.extras.get("results"):
            return None
        page = dict(fx.extras["results"])
        captured = list(page.get("hits") or [])
        hits = captured[offset : offset + limit]
        start = offset + len(hits)
        if len(hits) < limit and fx.parquet is not None:
            # Past a trimmed export's exact top rows the file is a sample, and
            # serving it as ranks would invent an order; stop there instead.
            trim = fx.extras.get("trim") or {}
            trimmed = trim.get("rows_kept") not in (None, trim.get("rows_total"))
            end = offset + limit
            if trimmed:
                end = min(end, trim.get("top", 1000))
            if end > start:
                hits += _export_hits(fx.parquet, start, end - start)
        page["hits"] = hits
        page["limit"] = limit
        page["offset"] = offset
        return KmindexResults.model_validate(page)

    async def get_cached_kmindex_export(self, job_id: str) -> Optional[Path]:
        """The fixture's trimmed export, or None when there is none."""
        self.calls.append(("get_cached_kmindex_export", job_id))
        fx = self._by_job.get(job_id)
        return fx.parquet if fx is not None else None
