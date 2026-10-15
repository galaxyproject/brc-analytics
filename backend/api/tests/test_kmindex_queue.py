"""The search queue snapshot: how many searches wait, and how long recent ones did.

Vista's queue is invisible from here, so this is built from the service
account's own kmindex jobs -- the waiting ones from Galaxy's job list, the wait
of each finished one from its start_epoch metric.
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.api.v1.galaxy import get_queue_galaxy_service
from app.models.galaxy import KmindexQueueStatus
from app.services import galaxy_service
from app.services.galaxy_service import GalaxyService
from tests.test_galaxy_submit_ownership import app_client  # noqa: F401

NOW = datetime.now(timezone.utc)


class DictCache:
    def __init__(self):
        self.store = {}

    async def get(self, key):
        value = self.store.get(key)
        return None if value is None else json.loads(value)

    async def set(self, key, value, ttl=3600):
        self.store[key] = json.dumps(value, default=str)
        return True

    def make_key(self, prefix, params):
        return f"{prefix}:{json.dumps(params, sort_keys=True)}"


def _stamp(minutes_ago):
    # Galaxy's own format: naive UTC.
    return (NOW - timedelta(minutes=minutes_ago)).replace(tzinfo=None).isoformat()


def _job(job_id, state, created_ago, updated_ago=None):
    return {
        "create_time": _stamp(created_ago),
        "id": job_id,
        "state": state,
        "update_time": _stamp(created_ago if updated_ago is None else updated_ago),
    }


def _started(minutes_after_submit, job):
    created = datetime.fromisoformat(job["create_time"]).replace(tzinfo=timezone.utc)
    start = created + timedelta(minutes=minutes_after_submit)
    return [{"name": "start_epoch", "raw_value": str(start.timestamp())}]


@pytest.fixture()
def service(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "test-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    svc = GalaxyService(DictCache())
    svc.gi = MagicMock()
    yield svc
    get_settings.cache_clear()


def _galaxy_with(svc, jobs, waits):
    """waits: job id -> minutes from submit to start (negative for a copy)."""
    by_id = {j["id"]: j for j in jobs}

    def _listing(state, **_):
        return [j for j in jobs if j["state"] in state]

    svc.gi.jobs.get_jobs = MagicMock(side_effect=_listing)
    svc.gi.jobs.get_metrics = MagicMock(
        side_effect=lambda job_id: _started(waits[job_id], by_id[job_id])
    )


@pytest.mark.asyncio
async def test_counts_waiting_and_running_and_ages_the_oldest(service):
    _galaxy_with(
        service,
        [
            _job("w1", "queued", created_ago=90),
            _job("w2", "new", created_ago=5),
            _job("r1", "running", created_ago=20),
        ],
        {},
    )

    queue = await service.get_kmindex_queue()

    assert queue.waiting == 2
    assert queue.running == 1
    assert 89.5 <= queue.oldest_waiting_minutes <= 90.5
    assert queue.recent_searches == 0
    assert queue.recent_wait_minutes is None


@pytest.mark.asyncio
async def test_recent_waits_come_from_finished_jobs_in_the_window(service):
    jobs = [
        _job("a", "ok", created_ago=60, updated_ago=30),
        _job("b", "ok", created_ago=50, updated_ago=20),
        _job("c", "error", created_ago=40, updated_ago=10),
        # Finished before the window opened, so it says nothing about now.
        _job("old", "ok", created_ago=400, updated_ago=300),
        # A job-cache copy: Galaxy hands it the original's metrics, so it
        # "started" before it was submitted. It never queued.
        _job("copy", "ok", created_ago=15, updated_ago=15),
    ]
    _galaxy_with(service, jobs, {"a": 30, "b": 10, "c": 20, "old": 99, "copy": -60})

    queue = await service.get_kmindex_queue()

    assert queue.recent_searches == 3
    assert queue.recent_wait_minutes == 20.0
    assert queue.recent_wait_p90_minutes == 30.0
    assert queue.window_minutes == galaxy_service.KMINDEX_QUEUE_WINDOW_MINUTES
    read = {c.args[0] for c in service.gi.jobs.get_metrics.call_args_list}
    assert "old" not in read


@pytest.mark.asyncio
async def test_waiting_jobs_get_a_listing_of_their_own(service):
    # Galaxy lists newest update first and a queued job's update_time stops
    # moving, so a shared, limited listing drops the longest waits first.
    _galaxy_with(service, [], {})

    await service.get_kmindex_queue()

    active, recent = (c.kwargs for c in service.gi.jobs.get_jobs.call_args_list)
    assert set(active["state"]) == {
        "new",
        "queued",
        "waiting",
        "resubmitted",
        "running",
    }
    assert "date_range_min" not in active
    assert set(recent["state"]) == {"ok", "error"}
    assert recent["order_by"] == "update_time"
    for kwargs in (active, recent):
        assert kwargs["tool_id"] == service.settings.GALAXY_KMINDEX_TOOL_ID


@pytest.mark.asyncio
async def test_the_snapshot_is_shared_and_each_wait_is_read_once(service):
    jobs = [_job("a", "ok", created_ago=60, updated_ago=30)]
    _galaxy_with(service, jobs, {"a": 12})

    first = await service.get_kmindex_queue()
    second = await service.get_kmindex_queue()

    assert first == second
    assert service.gi.jobs.get_jobs.call_count == 2

    # Once the snapshot expires, the rebuild lists jobs again but reuses the
    # wait it already worked out -- a finished job's wait can't change.
    _expire_snapshot(service)
    await service.get_kmindex_queue()

    assert service.gi.jobs.get_jobs.call_count == 4
    assert service.gi.jobs.get_metrics.call_count == 1


@pytest.mark.asyncio
async def test_a_failed_metrics_read_is_tried_again_next_time(service):
    jobs = [_job("a", "ok", created_ago=60, updated_ago=30)]
    _galaxy_with(service, jobs, {"a": 12})
    service.gi.jobs.get_metrics.side_effect = [
        RuntimeError("502"),
        _started(12, jobs[0]),
    ]

    first = await service.get_kmindex_queue()
    _expire_snapshot(service)
    second = await service.get_kmindex_queue()

    assert first.recent_searches == 0
    assert second.recent_searches == 1
    assert second.recent_wait_minutes == 12.0


@pytest.mark.asyncio
async def test_one_rebuild_reads_a_bounded_number_of_metrics(service, monkeypatch):
    monkeypatch.setattr(galaxy_service, "KMINDEX_QUEUE_METRIC_READS", 2)
    jobs = [_job(f"j{i}", "ok", created_ago=60, updated_ago=30 - i) for i in range(5)]
    _galaxy_with(service, jobs, {j["id"]: 5 for j in jobs})

    queue = await service.get_kmindex_queue()

    assert service.gi.jobs.get_metrics.call_count == 2
    assert queue.recent_searches == 2


def _expire_snapshot(service):
    for key in [k for k in service.cache.store if "kmindex_queue:" in k]:
        del service.cache.store[key]


@pytest.mark.asyncio
async def test_concurrent_misses_share_one_read(service):
    _galaxy_with(service, [_job("w1", "queued", created_ago=10)], {})

    results = await asyncio.gather(*(service.get_kmindex_queue() for _ in range(5)))

    assert all(r.waiting == 1 for r in results)
    assert service.gi.jobs.get_jobs.call_count == 2


@pytest.mark.asyncio
async def test_galaxy_failing_serves_the_last_good_snapshot(service):
    _galaxy_with(service, [_job("w1", "queued", created_ago=10)], {})
    good = await service.get_kmindex_queue()

    _expire_snapshot(service)
    service.gi.jobs.get_jobs.side_effect = RuntimeError("galaxy down")
    stale = await service.get_kmindex_queue()

    assert stale == good


@pytest.mark.asyncio
async def test_a_failed_read_is_not_retried_by_every_caller(service):
    # Each caller would otherwise wait out its own timeout behind the lock.
    service.gi.jobs.get_jobs = MagicMock(side_effect=RuntimeError("galaxy down"))

    for _ in range(3):
        with pytest.raises(Exception, match="did not answer"):
            await service.get_kmindex_queue()

    assert service.gi.jobs.get_jobs.call_count == 1


@pytest.mark.asyncio
async def test_a_hung_read_times_out(service, monkeypatch):
    monkeypatch.setattr(galaxy_service, "KMINDEX_QUEUE_READ_TIMEOUT", 0.05)

    async def _hang():
        await asyncio.sleep(10)

    service._read_kmindex_queue = _hang

    with pytest.raises(Exception, match="did not answer"):
        await service.get_kmindex_queue()


def test_the_route_reads_as_the_service_account_even_when_signed_in(monkeypatch):
    # A user's token would list that user's jobs, not the queue everyone
    # else's searches are sitting in.
    monkeypatch.setenv("GALAXY_API_KEY", "service-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        svc = get_queue_galaxy_service(cache=DictCache())
        assert svc.credential.kind == "service"
        assert svc.credential.secret == "service-key"
    finally:
        get_settings.cache_clear()


def test_the_public_route_returns_the_snapshot(app_client):  # noqa: F811
    app, client = app_client
    snapshot = KmindexQueueStatus(
        as_of=NOW.isoformat(),
        oldest_waiting_minutes=42.0,
        recent_searches=3,
        recent_wait_minutes=20.0,
        recent_wait_p90_minutes=30.0,
        running=1,
        waiting=4,
        window_minutes=120,
    )
    stub = MagicMock()
    stub.is_available.return_value = True
    stub.get_kmindex_queue = AsyncMock(return_value=snapshot)
    app.dependency_overrides[get_queue_galaxy_service] = lambda: stub

    response = client.get("/api/v1/galaxy/kmindex/queue")

    assert response.status_code == 200
    assert response.json()["waiting"] == 4
    assert response.json()["oldest_waiting_minutes"] == 42.0


def test_a_failed_read_is_a_502_not_a_500(app_client):  # noqa: F811
    app, client = app_client
    stub = MagicMock()
    stub.is_available.return_value = True
    stub.get_kmindex_queue = AsyncMock(side_effect=RuntimeError("galaxy down"))
    app.dependency_overrides[get_queue_galaxy_service] = lambda: stub

    response = client.get("/api/v1/galaxy/kmindex/queue")

    assert response.status_code == 502
    assert "galaxy down" not in response.text
