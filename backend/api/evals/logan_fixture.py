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
        """The captured results page, or None for a job with no fixture.

        Only the captured hits exist, so a page past them comes back empty.
        """
        from app.models.galaxy import KmindexResults

        self.calls.append(("get_cached_kmindex_results", job_id))
        fx = self._by_job.get(job_id)
        if fx is None or not fx.extras.get("results"):
            return None
        page = dict(fx.extras["results"])
        hits = list(page.get("hits") or [])
        page["hits"] = hits[offset : offset + limit]
        page["limit"] = limit
        page["offset"] = offset
        return KmindexResults.model_validate(page)

    async def get_cached_kmindex_export(self, job_id: str) -> Optional[Path]:
        """The fixture's trimmed export, or None when there is none."""
        self.calls.append(("get_cached_kmindex_export", job_id))
        fx = self._by_job.get(job_id)
        return fx.parquet if fx is not None else None
