"""Cache-only Logan tools: a miss is an answer, never an aggregation."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.galaxy import GalaxyJobState, GalaxyJobStatus
from app.services.tools.catalog_tools import AssistantDeps
from app.services.tools.logan_tools import (
    LOGAN_HITS_MAX_LIMIT,
    logan_cohort,
    logan_hits,
    logan_job_status,
)
from tests.test_logan_snapshot import JOB, results


def _deps(galaxy=None) -> AssistantDeps:
    return AssistantDeps(catalog=MagicMock(), galaxy=galaxy)


def _galaxy(cached=None, status=None):
    g = MagicMock()
    g.is_available.return_value = True
    g.get_cached_kmindex_results = AsyncMock(return_value=cached)
    g.get_job_status = AsyncMock(return_value=status)
    g._aggregate_shards = AsyncMock(side_effect=AssertionError("cold path"))
    g.get_kmindex_results = AsyncMock(side_effect=AssertionError("cold path"))
    return g


def _status(state, complete, ok):
    return GalaxyJobStatus(
        job_id=JOB,
        state=state,
        created_time="t",
        updated_time="t",
        is_complete=complete,
        is_successful=ok,
    )


class TestUnavailable:
    @pytest.mark.asyncio
    async def test_no_galaxy(self):
        out = json.loads(await logan_cohort(_deps(None), JOB))
        assert out == {"error": "Logan search is not configured.", "available": False}


class TestStatus:
    @pytest.mark.asyncio
    async def test_reports_state(self):
        g = _galaxy(status=_status(GalaxyJobState.QUEUED, False, False))
        out = json.loads(await logan_job_status(_deps(g), JOB))
        assert out["job_id"] == JOB
        assert out["state"] == "queued"
        assert out["is_complete"] is False
        assert out["results_url"].endswith(JOB)

    @pytest.mark.asyncio
    async def test_bad_job_id_rejected_before_galaxy(self):
        g = _galaxy()
        out = json.loads(await logan_job_status(_deps(g), "not-a-job"))
        assert out["error"].startswith("Invalid job id")
        g.get_job_status.assert_not_called()


class TestCohort:
    @pytest.mark.asyncio
    async def test_miss_is_structured(self):
        g = _galaxy(cached=None, status=_status(GalaxyJobState.OK, True, True))
        out = json.loads(await logan_cohort(_deps(g), JOB))
        assert out["status"] == "expired"
        assert out["results_url"] == f"/logan-search?job={JOB}"
        g._aggregate_shards.assert_not_called()

    @pytest.mark.asyncio
    async def test_not_ready(self):
        g = _galaxy(cached=None, status=_status(GalaxyJobState.RUNNING, False, False))
        out = json.loads(await logan_cohort(_deps(g), JOB))
        assert out["status"] == "not_ready"

    @pytest.mark.asyncio
    async def test_hit_returns_cohort_and_totals(self):
        g = _galaxy(cached=results())
        out = json.loads(await logan_cohort(_deps(g), JOB))
        assert out["status"] == "ok"
        assert out["total_matches"] == 17629
        assert out["cohort"]["top_organisms"][0]["value"] == "Plasmodium falciparum"
        assert out["per_index"][0]["index"] == "GENOMIC_INV"
        assert "hits" not in out
        g.get_cached_kmindex_results.assert_awaited_once_with(JOB, limit=1, offset=0)


class TestHits:
    @pytest.mark.asyncio
    async def test_page(self):
        g = _galaxy(cached=results())
        out = json.loads(await logan_hits(_deps(g), JOB, offset=0, limit=2))
        assert out["status"] == "ok"
        assert out["total_hits"] == 17629
        assert [h["accession"] for h in out["hits"]][:1] == ["ERR662077"]
        assert out["hits"][0]["sra"]["organism"] == "Plasmodium falciparum"

    @pytest.mark.asyncio
    async def test_limit_clamped(self):
        g = _galaxy(cached=results())
        await logan_hits(_deps(g), JOB, offset=0, limit=10_000)
        g.get_cached_kmindex_results.assert_awaited_once_with(
            JOB, limit=LOGAN_HITS_MAX_LIMIT, offset=0
        )

    @pytest.mark.asyncio
    async def test_miss_is_structured(self):
        g = _galaxy(cached=None, status=_status(GalaxyJobState.OK, True, True))
        out = json.loads(await logan_hits(_deps(g), JOB))
        assert out["status"] == "expired"
