"""The temporary partner API over HTTP.

Galaxy, Redis and the database are stubbed; the routes, the key check, the
idempotency handling and the Sunset stamping all run for real.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.v1 import partner as partner_module
from app.core import dependencies
from app.core.config import get_settings
from app.core.partner_keys import (
    Partner,
    generate_partner_key,
    hash_partner_key,
    sunset_header,
)
from app.models.galaxy import GalaxyJobResponse, GalaxyJobStatus
from app.services.galaxy_service import (
    GalaxyJobAggregating,
    GalaxyJobNotFound,
    GalaxySubmitNotStarted,
)
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

KEY = generate_partner_key()
HEADERS = {"X-API-Key": KEY}
BASE = "/api/v1/partner/logan"
JOB_ID = "0123456789abcdef"
PAYLOAD = {"indexes": ["GENOMIC_BCT"], "sequence": ">q\nACGTACGTAC\n"}
SUNSET = (datetime.now(timezone.utc) + timedelta(days=90)).replace(microsecond=0)


class FakeCache:
    """Enough of CacheService for the router: JSON values, SET NX."""

    def __init__(self):
        self.store: dict[str, str] = {}
        self.redis = MagicMock()
        self.redis.set = AsyncMock(side_effect=self._set_nx)

    async def _set_nx(self, key, value, ex=None, nx=False):
        if nx and key in self.store:
            return None
        self.store[key] = value
        return True

    async def get(self, key):
        value = self.store.get(key)
        return json.loads(value) if value else None

    async def set(self, key, value, ttl=3600):
        self.store[key] = json.dumps(value)
        return True

    async def set_if_absent(self, key, value, ttl):
        return bool(await self.redis.set(key, json.dumps(value), ex=ttl, nx=True))

    async def delete(self, key):
        return self.store.pop(key, None) is not None


def _galaxy():
    galaxy = MagicMock()
    galaxy.is_available.return_value = True
    galaxy.credential = MagicMock(kind="service")
    galaxy.submit_kmindex_query = AsyncMock(
        return_value=GalaxyJobResponse(job_id=JOB_ID, upload_dataset_id="ds1")
    )
    return galaxy


def _status(state, complete, successful=False, stderr=None):
    return GalaxyJobStatus(
        created_time="t0",
        is_complete=complete,
        is_successful=successful,
        job_id=JOB_ID,
        state=state,
        stderr=stderr,
        updated_time="t1",
    )


@pytest.fixture()
def partner_env(tmp_path, monkeypatch):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("PARTNER_API_ENABLED", "true")
    # Partner jobs need the service account; config refuses to start without it.
    monkeypatch.setenv("GALAXY_API_KEY", "service-key")
    monkeypatch.setenv(
        "PARTNER_API_KEYS", f"example-partner:k1:{hash_partner_key(KEY)}"
    )
    monkeypatch.setenv("PARTNER_API_SUNSET", SUNSET.isoformat())
    monkeypatch.delenv("PARTNER_SUBMIT_PAUSED", raising=False)
    get_settings.cache_clear()
    dependencies.reset_all_services()

    fake_cache = FakeCache()
    fake_cache.clear_caches = AsyncMock(return_value=0)
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()
    monkeypatch.setattr(
        dependencies, "get_cache_service", MagicMock(return_value=fake_cache)
    )
    monkeypatch.setattr(
        dependencies, "get_auth_service", MagicMock(return_value=fake_auth)
    )
    limiter = MagicMock()
    limiter.check = AsyncMock(return_value={})
    monkeypatch.setattr(
        dependencies, "get_partner_rate_limiter", MagicMock(return_value=limiter)
    )
    monkeypatch.setattr(
        dependencies,
        "get_partner_submit_rate_limiter",
        MagicMock(return_value=limiter),
    )
    record = AsyncMock()
    monkeypatch.setattr(partner_module, "record_submission", record)

    from app.main import create_app

    app = create_app()
    galaxy = _galaxy()
    app.dependency_overrides[partner_module.get_partner_galaxy_service] = lambda: galaxy
    # Keyed on the function the router imported, not the patched attribute.
    app.dependency_overrides[partner_module.get_cache_service] = lambda: fake_cache

    yield TestClient(app), galaxy, record
    get_settings.cache_clear()


def test_the_api_does_not_exist_unless_enabled(partner_env, monkeypatch):
    monkeypatch.setenv("PARTNER_API_ENABLED", "false")
    get_settings.cache_clear()
    from app.main import create_app

    client = TestClient(create_app())

    assert client.get(f"{BASE}/indexes", headers=HEADERS).status_code == 404


def test_every_call_needs_the_key(partner_env):
    client, _, _ = partner_env

    for method, path in [
        ("get", f"{BASE}/indexes"),
        ("post", f"{BASE}/jobs"),
        ("get", f"{BASE}/jobs/{JOB_ID}"),
        ("get", f"{BASE}/jobs/{JOB_ID}/results"),
        ("get", f"{BASE}/jobs/{JOB_ID}/export"),
    ]:
        body = PAYLOAD if method == "post" else None
        response = client.request(method.upper(), path, json=body)
        assert response.status_code == 401, path


def test_responses_carry_the_sunset_even_when_refused(partner_env):
    client, galaxy, _ = partner_env
    galaxy.list_kmindex_indexes = AsyncMock(return_value=["GENOMIC_BCT"])

    ok = client.get(f"{BASE}/indexes", headers=HEADERS)
    refused = client.get(f"{BASE}/indexes")

    assert ok.json() == {"count": 1, "indexes": ["GENOMIC_BCT"]}
    assert ok.headers["Sunset"] == sunset_header(SUNSET)
    assert refused.headers["Sunset"] == sunset_header(SUNSET)


def test_the_native_routes_carry_no_sunset(partner_env):
    client, _, _ = partner_env

    assert "Sunset" not in client.get("/api/v1/health").headers


def test_a_path_that_only_shares_the_prefix_carries_no_sunset(partner_env):
    client, _, _ = partner_env

    assert "Sunset" not in client.get("/api/v1/partner/loganx/indexes").headers


def test_a_submit_starts_a_job_and_records_it_as_partner_traffic(partner_env):
    client, galaxy, record = partner_env

    response = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=HEADERS)

    assert response.status_code == 202
    body = response.json()
    assert body["job_id"] == JOB_ID
    assert body["status_url"] == f"{BASE}/jobs/{JOB_ID}"
    assert body["results_url"].endswith(f"{BASE}/jobs/{JOB_ID}/results")
    assert body["export_url"].endswith(f"{BASE}/jobs/{JOB_ID}/export")
    galaxy.submit_kmindex_query.assert_awaited_once()
    kwargs = record.await_args.kwargs
    assert (kwargs["source"], kwargs["partner_id"]) == ("partner", "example-partner")


def test_a_paused_api_takes_no_new_searches(partner_env, monkeypatch):
    client, galaxy, _ = partner_env
    monkeypatch.setenv("PARTNER_SUBMIT_PAUSED", "true")
    get_settings.cache_clear()

    response = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=HEADERS)

    assert response.status_code == 503
    galaxy.submit_kmindex_query.assert_not_awaited()


class TestIdempotency:
    def test_a_retried_submit_gets_the_first_job_back(self, partner_env):
        client, galaxy, _ = partner_env
        headers = {**HEADERS, "Idempotency-Key": "abc"}

        first = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)
        second = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)

        assert first.json()["job_id"] == second.json()["job_id"] == JOB_ID
        galaxy.submit_kmindex_query.assert_awaited_once()

    def test_a_key_reused_for_a_different_search_is_refused(self, partner_env):
        client, galaxy, _ = partner_env
        headers = {**HEADERS, "Idempotency-Key": "abc"}

        client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)
        other = {**PAYLOAD, "threshold": 0.9}
        response = client.post(f"{BASE}/jobs", json=other, headers=headers)

        assert response.status_code == 409
        galaxy.submit_kmindex_query.assert_awaited_once()

    def test_a_submit_that_never_reached_galaxy_frees_the_key(self, partner_env):
        client, galaxy, _ = partner_env
        headers = {**HEADERS, "Idempotency-Key": "abc"}
        galaxy.submit_kmindex_query.side_effect = [
            GalaxySubmitNotStarted("history lookup failed"),
            GalaxyJobResponse(job_id=JOB_ID, upload_dataset_id="ds1"),
        ]

        failed = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)
        retried = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)

        assert failed.status_code == 502
        assert retried.json()["job_id"] == JOB_ID

    def test_an_ambiguous_failure_keeps_the_key_so_a_retry_cannot_duplicate(
        self, partner_env
    ):
        # run_tool can queue the job and then time out on the reply; a blind
        # retry under the same key must not start a second search.
        client, galaxy, _ = partner_env
        headers = {**HEADERS, "Idempotency-Key": "abc"}
        galaxy.submit_kmindex_query.side_effect = RuntimeError("read timed out")

        failed = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)
        retried = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)

        assert failed.status_code == 502
        assert retried.status_code == 409
        assert "new Idempotency-Key" in retried.json()["detail"]
        galaxy.submit_kmindex_query.assert_awaited_once()

    def test_no_claim_means_no_keyed_submit(self, partner_env):
        import redis.asyncio as redis

        client, galaxy, _ = partner_env
        cache = dependencies.get_cache_service()
        cache.redis.set = AsyncMock(side_effect=redis.ConnectionError("down"))

        response = client.post(
            f"{BASE}/jobs", json=PAYLOAD, headers={**HEADERS, "Idempotency-Key": "a"}
        )

        assert response.status_code == 503
        galaxy.submit_kmindex_query.assert_not_awaited()

    @pytest.mark.parametrize("blank", ["", "   "])
    def test_a_blank_key_is_refused_rather_than_ignored(self, partner_env, blank):
        client, galaxy, _ = partner_env

        response = client.post(
            f"{BASE}/jobs", json=PAYLOAD, headers={**HEADERS, "Idempotency-Key": blank}
        )

        assert response.status_code == 400
        galaxy.submit_kmindex_query.assert_not_awaited()

    def test_an_unkeyed_submit_does_not_need_redis(self, partner_env):
        import redis.asyncio as redis

        client, galaxy, _ = partner_env
        cache = dependencies.get_cache_service()
        cache.redis.set = AsyncMock(side_effect=redis.ConnectionError("down"))

        response = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=HEADERS)

        assert response.status_code == 202

    def test_the_claim_is_held_for_the_whole_idempotency_window(self, partner_env):
        # A claim that lapsed early would let a retry after a crash mid-submit
        # start a second search across every index.
        client, _, _ = partner_env
        cache = dependencies.get_cache_service()

        client.post(
            f"{BASE}/jobs", json=PAYLOAD, headers={**HEADERS, "Idempotency-Key": "a"}
        )

        assert cache.redis.set.await_args.kwargs["ex"] == 86400
        assert cache.redis.set.await_args.kwargs["nx"] is True

    def test_a_submit_still_in_flight_says_so(self, partner_env):
        client, galaxy, _ = partner_env
        headers = {**HEADERS, "Idempotency-Key": "abc"}
        cache = dependencies.get_cache_service()  # the patched FakeCache

        async def _second_arrives_mid_submit(_submission):
            response = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)
            assert response.status_code == 409
            assert "in progress" in response.json()["detail"]
            return GalaxyJobResponse(job_id=JOB_ID, upload_dataset_id="ds1")

        galaxy.submit_kmindex_query.side_effect = _second_arrives_mid_submit

        response = client.post(f"{BASE}/jobs", json=PAYLOAD, headers=headers)

        assert response.status_code == 202
        assert cache.store


class TestStatus:
    def test_a_running_job_says_when_to_ask_again(self, partner_env):
        client, galaxy, _ = partner_env
        galaxy.get_job_status = AsyncMock(return_value=_status("running", False))

        response = client.get(f"{BASE}/jobs/{JOB_ID}", headers=HEADERS)

        assert response.status_code == 202
        assert response.json()["state"] == "running"
        assert response.headers["Retry-After"] == partner_module.STATUS_RETRY_AFTER

    def test_a_failed_job_explains_itself(self, partner_env):
        client, galaxy, _ = partner_env
        galaxy.get_job_status = AsyncMock(
            return_value=_status("error", True, stderr="x" * 5000 + "the reason")
        )

        body = client.get(f"{BASE}/jobs/{JOB_ID}", headers=HEADERS).json()

        assert body["error"].endswith("the reason")
        assert len(body["error"]) == partner_module.STDERR_TAIL

    def test_a_finished_job_has_no_retry_after(self, partner_env):
        client, galaxy, _ = partner_env
        galaxy.get_job_status = AsyncMock(return_value=_status("ok", True, True))

        response = client.get(f"{BASE}/jobs/{JOB_ID}", headers=HEADERS)

        assert response.status_code == 200
        assert response.json()["error"] is None
        assert "Retry-After" not in response.headers

    def test_an_unknown_job_is_404(self, partner_env):
        client, galaxy, _ = partner_env
        galaxy.get_job_status = AsyncMock(side_effect=GalaxyJobNotFound("nope"))

        response = client.get(f"{BASE}/jobs/{JOB_ID}", headers=HEADERS)

        assert response.status_code == 404

    def test_something_that_is_not_a_job_id_is_422(self, partner_env):
        client, _, _ = partner_env

        response = client.get(f"{BASE}/jobs/../../etc", headers=HEADERS)

        assert response.status_code in (404, 422)
        assert client.get(f"{BASE}/jobs/XYZ", headers=HEADERS).status_code == 422


class TestResults:
    def test_results_merge_in_the_partner_lane(self, partner_env):
        client, galaxy, _ = partner_env
        galaxy.get_kmindex_results = AsyncMock(
            side_effect=GalaxyJobAggregating("queued behind another merge")
        )

        response = client.get(f"{BASE}/jobs/{JOB_ID}/results", headers=HEADERS)

        assert response.status_code == 202
        assert response.headers["Retry-After"] == partner_module.RESULTS_RETRY_AFTER
        assert galaxy.get_kmindex_results.await_args.kwargs["lane"] == "partner"


def test_the_galaxy_service_ignores_any_session_and_uses_its_own_history(
    monkeypatch,
):
    monkeypatch.setenv("GALAXY_API_KEY", "service-key")
    get_settings.cache_clear()

    import asyncio

    galaxy = asyncio.run(
        partner_module.get_partner_galaxy_service(
            cache=MagicMock(),
            partner=Partner(key_id="k1", partner_id="example-partner"),
            sra_mirror=None,
        )
    )

    assert galaxy.credential.kind == "service"
    assert galaxy.credential.secret == "service-key"
    assert galaxy.history_name == "BRC Logan Partner - example-partner"
    get_settings.cache_clear()


def test_a_request_is_charged_to_the_budget_once(partner_env):
    client, galaxy, _ = partner_env
    galaxy.get_job_status = AsyncMock(return_value=_status("ok", True, True))
    limiter = dependencies.get_partner_rate_limiter()

    client.get(f"{BASE}/jobs/{JOB_ID}", headers=HEADERS)

    assert limiter.check.await_count == 1


@pytest.mark.parametrize("fmt", ["tsv", "parquet"])
def test_an_export_streams_with_its_sunset(partner_env, tmp_path, monkeypatch, fmt):
    import duckdb

    from app.api.v1 import galaxy as galaxy_module

    client, _, _ = partner_env
    path = tmp_path / "export.parquet"
    duckdb.sql(
        "COPY (SELECT * FROM (VALUES ('SRR1', 0.9), ('SRR2', 0.8)) "
        f"t(accession, score)) TO '{path}' (FORMAT parquet)"
    )
    monkeypatch.setattr(galaxy_module, "export_file_path", lambda _d, _j: path)
    monkeypatch.setattr(galaxy_module, "export_is_current", lambda _p: True)

    response = client.get(f"{BASE}/jobs/{JOB_ID}/export?format={fmt}", headers=HEADERS)

    assert response.status_code == 200
    assert response.headers["Sunset"] == sunset_header(SUNSET)
    if fmt == "tsv":
        assert response.text.splitlines()[1].startswith("SRR1")
    else:
        assert response.content == path.read_bytes()
