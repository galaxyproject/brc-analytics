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


class _FrozenDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return NOW if tz else NOW.replace(tzinfo=None)


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


def _started(minutes_after_submit, job, ran_for=None):
    created = datetime.fromisoformat(job["create_time"]).replace(tzinfo=timezone.utc)
    start = created + timedelta(minutes=minutes_after_submit)
    metrics = [{"name": "start_epoch", "raw_value": str(start.timestamp())}]
    if ran_for is not None:
        end = start + timedelta(minutes=ran_for)
        metrics.append({"name": "end_epoch", "raw_value": str(end.timestamp())})
    return metrics


@pytest.fixture()
def service(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "test-key")
    # NOW is taken at import; a real clock drifts from it by however long the
    # suite takes to reach these tests.
    monkeypatch.setattr(galaxy_service, "datetime", _FrozenDatetime)
    monkeypatch.setattr(galaxy_service, "_SERVICE_USER_IDS", {})
    from app.core.config import get_settings

    get_settings.cache_clear()
    svc = GalaxyService(DictCache())
    svc.gi = MagicMock()
    svc.gi.users.get_current_user = MagicMock(return_value={"id": "svc"})
    yield svc
    get_settings.cache_clear()


def _galaxy_with(svc, jobs, waits):
    """waits: job id -> minutes from submit to start (negative for a copy)."""
    by_id = {j["id"]: j for j in jobs}

    def _listing(state=None, **_):
        return [j for j in jobs if state is None or j["state"] in state]

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
    assert queue.oldest_waiting_minutes == 90.0
    assert queue.recent_searches == 0
    assert queue.recent_wait_minutes is None


@pytest.mark.asyncio
async def test_a_stuck_search_is_counted_but_not_aged(service):
    _galaxy_with(
        service,
        [
            _job("stuck", "queued", created_ago=12633),
            _job("w1", "queued", created_ago=30),
            _job("r1", "running", created_ago=20),
        ],
        {},
    )

    queue = await service.get_kmindex_queue()

    assert queue.waiting == 2
    assert queue.oldest_waiting_minutes == 30.0


@pytest.mark.asyncio
async def test_a_search_just_inside_the_stuck_horizon_still_ages(service):
    _galaxy_with(
        service,
        [
            _job("old", "queued", created_ago=24 * 60 - 1),
            _job("stuck", "queued", created_ago=24 * 60 + 1),
        ],
        {},
    )

    queue = await service.get_kmindex_queue()

    assert queue.waiting == 2
    assert queue.oldest_waiting_minutes == 24 * 60 - 1


@pytest.mark.asyncio
async def test_only_stuck_searches_waiting_leave_no_oldest(service):
    _galaxy_with(service, [_job("stuck", "new", created_ago=25 * 60)], {})

    queue = await service.get_kmindex_queue()

    assert queue.waiting == 1
    assert queue.oldest_waiting_minutes is None


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
async def test_the_listings_name_the_service_account(service):
    # Galaxy narrows a listing to the caller's jobs only for a non-admin, so an
    # admin key would otherwise count every user's searches.
    _galaxy_with(service, [], {})
    service.gi.users.get_current_user = MagicMock(return_value={"id": "svc"})

    await service.get_kmindex_queue()
    await service.get_kmindex_queue_history(24)

    calls = service.gi.jobs.get_jobs.call_args_list
    assert len(calls) == 3
    assert [c.kwargs["user_id"] for c in calls] == ["svc"] * 3
    service.gi.users.get_current_user.assert_called_once()


@pytest.mark.asyncio
async def test_an_unknown_account_never_lists_unscoped(service):
    # On an admin key an unscoped listing is every user's searches, so a failed
    # lookup fails the read instead -- and its snapshot never gets cached.
    _galaxy_with(service, [_job("w1", "queued", created_ago=5)], {})
    service.gi.users.get_current_user = MagicMock(side_effect=RuntimeError("down"))

    with pytest.raises(Exception):
        await service.get_kmindex_queue()

    service.gi.jobs.get_jobs.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "first", [RuntimeError("down"), {"username": "no id"}, {"id": ""}, None]
)
async def test_a_failed_lookup_is_not_remembered(service, first):
    _galaxy_with(service, [], {})
    answers = iter([first, {"id": "svc"}])

    def _current_user():
        answer = next(answers)
        if isinstance(answer, Exception):
            raise answer
        return answer

    service.gi.users.get_current_user = MagicMock(side_effect=_current_user)

    with pytest.raises(Exception):
        await service._service_user_id()
    assert galaxy_service._SERVICE_USER_IDS == {}
    assert await service._service_user_id() == "svc"


@pytest.mark.asyncio
async def test_a_user_credential_cannot_stand_in_for_the_service_account(service):
    from app.core.galaxy_credential import GalaxyCredential

    service.credential = GalaxyCredential(kind="user", secret="tok", user_sub="u1")
    service.gi.users.get_current_user = MagicMock(return_value={"id": "u1-galaxy"})

    with pytest.raises(Exception):
        await service._service_user_id()
    assert galaxy_service._SERVICE_USER_IDS == {}


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


@pytest.mark.asyncio
async def test_a_lagging_node_clock_does_not_make_a_real_job_a_copy(service):
    # The node stamps start and end; Galaxy stamps create_time. A node a
    # minute behind puts this job's start before its submit, but it ran for
    # ten minutes past it, which no copy of a finished job can.
    job = _job("skewed", "ok", created_ago=30, updated_ago=20)
    service.gi.jobs.get_metrics = MagicMock(return_value=_started(-1, job, ran_for=10))

    timing = await service._job_timing(job)

    assert timing == {"copy": False, "run": 600.0, "wait": 0.0}


@pytest.mark.asyncio
async def test_a_copy_ends_before_it_was_submitted(service):
    job = _job("copy", "ok", created_ago=30, updated_ago=30)
    service.gi.jobs.get_metrics = MagicMock(return_value=_started(-20, job, ran_for=5))

    assert (await service._job_timing(job))["copy"] is True


class TestHistory:
    """The last day of searches, for the unlisted stats page."""

    JOBS = [
        _job("a", "ok", created_ago=600, updated_ago=500),
        _job("copy", "ok", created_ago=300, updated_ago=300),
        _job("run", "running", created_ago=40, updated_ago=10),
        _job("wait", "queued", created_ago=20),
        # Submitted before the window, finished inside it: not this day's.
        _job("old", "ok", created_ago=1500, updated_ago=60),
    ]

    @pytest.fixture(autouse=True)
    def _galaxy(self, service):
        by_id = {j["id"]: j for j in self.JOBS}
        timing = {"a": (90, 2), "copy": (-120, None), "old": (5, 1)}
        service.gi.jobs.get_jobs = MagicMock(return_value=self.JOBS)
        service.gi.jobs.get_metrics = MagicMock(
            side_effect=lambda job_id: _started(
                *timing[job_id][:1], by_id[job_id], ran_for=timing[job_id][1]
            )
        )

    @pytest.mark.asyncio
    async def test_each_search_in_the_window_gets_a_row(self, service):
        history = await service.get_kmindex_queue_history(24)

        assert history.searches == 4
        rows = {r.state + ("+copy" if r.cached else ""): r for r in history.rows}
        assert rows["ok"].wait_minutes == 90.0
        assert rows["ok"].run_minutes == 2.0
        # A cache hit never queued, so it has no wait to report.
        assert rows["ok+copy"].wait_minutes is None
        # A running job's start is when Galaxy last touched it.
        assert rows["running"].wait_minutes == 30.0
        assert rows["queued"].still_waiting
        assert rows["queued"].wait_minutes == 20.0
        assert [r.submitted for r in history.rows] == sorted(
            r.submitted for r in history.rows
        )

    @pytest.mark.asyncio
    async def test_the_summary_leaves_out_cache_hits_and_searches_still_waiting(
        self, service
    ):
        history = await service.get_kmindex_queue_history(24)

        assert history.cache_hits == 1
        # The finished job's 90 min and the running job's 30 min.
        assert history.wait_max_minutes == 90.0
        assert history.wait_p50_minutes == 30.0
        assert history.run_p50_minutes == 2.0
        assert not history.truncated

    @pytest.mark.asyncio
    async def test_a_stuck_search_shows_as_waiting_with_no_wait(self, service):
        stuck = _job("stuck", "queued", created_ago=30 * 60)
        service.gi.jobs.get_jobs = MagicMock(return_value=[*self.JOBS, stuck])

        history = await service.get_kmindex_queue_history(72)

        row = history.rows[0]
        assert row.still_waiting
        assert row.wait_minutes is None

    @pytest.mark.asyncio
    async def test_carries_no_job_ids(self, service):
        history = await service.get_kmindex_queue_history(24)

        dumped = json.dumps(history.model_dump())
        for job in self.JOBS:
            assert f'"{job["id"]}"' not in dumped

    @pytest.mark.asyncio
    async def test_is_cached_and_reuses_each_jobs_timing(self, service):
        await service.get_kmindex_queue_history(24)
        await service.get_kmindex_queue_history(24)
        assert service.gi.jobs.get_jobs.call_count == 1

        for key in [k for k in service.cache.store if "history" in k]:
            del service.cache.store[key]
        await service.get_kmindex_queue_history(24)

        assert service.gi.jobs.get_jobs.call_count == 2
        # "a" and "copy"; "old" is outside the window.
        assert service.gi.jobs.get_metrics.call_count == 2

    @pytest.mark.asyncio
    async def test_hours_are_clamped(self, service):
        history = await service.get_kmindex_queue_history(10_000)

        assert history.hours == galaxy_service.KMINDEX_HISTORY_MAX_HOURS


def test_the_history_route_bounds_hours(app_client):  # noqa: F811
    app, client = app_client
    stub = MagicMock()
    stub.is_available.return_value = True
    stub.get_kmindex_queue_history = AsyncMock(
        return_value=galaxy_service.KmindexQueueHistory(
            as_of=NOW.isoformat(),
            cache_hits=0,
            hours=24,
            rows=[],
            searches=0,
            truncated=False,
        )
    )
    app.dependency_overrides[get_queue_galaxy_service] = lambda: stub

    assert client.get("/api/v1/galaxy/kmindex/queue/history").status_code == 200
    stub.get_kmindex_queue_history.assert_awaited_with(24)
    assert (
        client.get("/api/v1/galaxy/kmindex/queue/history?hours=500").status_code == 422
    )
