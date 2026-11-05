"""logan_submit over MCP: anonymous and partner-keyed searches."""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.routing import Mount

from app.core import dependencies
from app.core.config import get_settings
from app.core.partner_keys import generate_partner_key, hash_partner_key
from app.models.galaxy import GalaxyJobResponse, KmindexQueueStatus
from app.services import logan_jobs
from app.services.galaxy_service import (
    GalaxyJobAggregating,
    GalaxySubmitNotStarted,
    KmindexUnknownIndex,
)
from app.services.mcp_server import create_mcp_server
from app.services.tools import logan_mcp
from tests.test_mcp import _call_tool, _catalog_data, _parse_sse, _tool_names

KEY = generate_partner_key()
JOB_ID = "0123456789abcdef"
SEQ = ">q\nACGTACGTACGTACGTACGTACGTACGTACGTACGT\n"
SUNSET = (datetime.now(timezone.utc) + timedelta(days=90)).replace(microsecond=0)


class FakeCache:
    def __init__(self):
        self.store: dict[str, str] = {}

    async def get(self, key):
        value = self.store.get(key)
        return json.loads(value) if value else None

    async def set(self, key, value, ttl=3600):
        self.store[key] = json.dumps(value)
        return True

    async def set_if_absent(self, key, value, ttl):
        if key in self.store:
            return False
        self.store[key] = json.dumps(value)
        return True

    async def delete(self, key):
        return self.store.pop(key, None) is not None


def _request(headers: dict | None = None, ip: str = "203.0.113.7") -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/",
            "headers": [
                (k.lower().encode(), v.encode()) for k, v in (headers or {}).items()
            ],
            "client": (ip, 1234),
        }
    )


@pytest.fixture()
def env(monkeypatch):
    monkeypatch.setenv("PARTNER_API_ENABLED", "true")
    monkeypatch.setenv("PARTNER_API_KEYS", f"acme:k1:{hash_partner_key(KEY)}")
    monkeypatch.setenv("PARTNER_API_SUNSET", SUNSET.isoformat())
    monkeypatch.setenv("GALAXY_API_KEY", "service-key")
    monkeypatch.delenv("PARTNER_SUBMIT_PAUSED", raising=False)
    get_settings.cache_clear()
    dependencies.reset_all_services()

    cache = FakeCache()
    monkeypatch.setattr(dependencies, "get_cache_service", lambda: cache)
    monkeypatch.setattr(dependencies, "get_sra_mirror_service", lambda: None)
    submit_limiter = MagicMock()
    submit_limiter.check = AsyncMock(return_value={})
    partner_submit = MagicMock()
    partner_submit.check = AsyncMock(return_value={})
    monkeypatch.setattr(
        dependencies, "get_submit_rate_limiter", MagicMock(return_value=submit_limiter)
    )
    monkeypatch.setattr(
        dependencies,
        "get_partner_submit_rate_limiter",
        MagicMock(return_value=partner_submit),
    )

    galaxy = MagicMock()
    galaxy.is_available.return_value = True
    galaxy.credential = MagicMock(kind="service")
    galaxy.submit_kmindex_query = AsyncMock(
        return_value=GalaxyJobResponse(job_id=JOB_ID, upload_dataset_id="ds1")
    )
    galaxy.get_job_status = AsyncMock(
        return_value=MagicMock(is_complete=False, is_successful=False)
    )
    built: list[tuple[str, object]] = []

    def anonymous(cache_, sra):
        built.append(("anonymous", None))
        return galaxy

    def partnered(partner, cache_, sra):
        built.append(("partner", partner.partner_id))
        return galaxy

    monkeypatch.setattr(logan_jobs, "anonymous_galaxy_service", anonymous)
    monkeypatch.setattr(logan_jobs, "partner_galaxy_service", partnered)
    record = AsyncMock()
    monkeypatch.setattr(logan_jobs, "record_submission", record)

    state = MagicMock(
        cache=cache,
        galaxy=galaxy,
        built=built,
        record=record,
        submit_limiter=submit_limiter,
        partner_submit=partner_submit,
    )
    yield state
    get_settings.cache_clear()


def _as(monkeypatch, request):
    monkeypatch.setattr(logan_mcp, "current_request", lambda: request)


async def _submit(**kw):
    args = {"sequence": SEQ, "indexes": ["GENOMIC_VRL"], **kw}
    return await logan_mcp.logan_submit(**args)


class TestAnonymous:
    @pytest.mark.asyncio
    async def test_starts_a_search_on_the_anonymous_pool(self, env, monkeypatch):
        _as(monkeypatch, _request())
        out = await _submit()
        assert out["status"] == "submitted"
        assert out["job_id"] == JOB_ID
        assert out["as"] == "anonymous"
        assert out["results_url"] == f"/logan-search?job={JOB_ID}"
        assert env.built == [("anonymous", None)]
        env.submit_limiter.check.assert_awaited_once()
        env.partner_submit.check.assert_not_awaited()
        assert env.record.await_args.kwargs["source"] == "mcp"

    @pytest.mark.asyncio
    async def test_spent_pool_is_an_error_dict_with_retry(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.submit_limiter.check.side_effect = HTTPException(
            status_code=429, detail="over", headers={"Retry-After": "120"}
        )
        out = await _submit()
        assert out == {"error": "over", "status_code": 429, "retry_after_seconds": 120}
        env.galaxy.submit_kmindex_query.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_unknown_index_is_a_400(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.galaxy.submit_kmindex_query.side_effect = KmindexUnknownIndex("NOPE")
        out = await _submit(indexes=["NOPE"])
        assert out["status_code"] == 400

    @pytest.mark.asyncio
    async def test_galaxy_down_is_a_503(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.galaxy.is_available.return_value = False
        out = await _submit()
        assert out["status_code"] == 503

    @pytest.mark.asyncio
    async def test_not_started_is_a_502_and_not_remembered(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.galaxy.submit_kmindex_query.side_effect = GalaxySubmitNotStarted("x")
        out = await _submit()
        assert out["status_code"] == 502
        assert not env.cache.store

    @pytest.mark.asyncio
    async def test_bad_arguments_are_a_422_without_touching_galaxy(
        self, env, monkeypatch
    ):
        _as(monkeypatch, _request())
        out = await _submit(threshold=0.1)
        assert out["status_code"] == 422
        assert out["details"][0]["field"] == "threshold"
        env.galaxy.submit_kmindex_query.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_no_http_request_is_refused(self, env, monkeypatch):
        _as(monkeypatch, None)
        out = await _submit()
        assert "HTTP" in out["error"]


class TestDedupe:
    @pytest.mark.asyncio
    async def test_same_search_again_reuses_the_job(self, env, monkeypatch):
        _as(monkeypatch, _request())
        first = await _submit()
        again = await _submit()
        assert first["status"] == "submitted"
        assert again["status"] == "reused"
        assert again["job_id"] == JOB_ID
        assert env.galaxy.submit_kmindex_query.await_count == 1
        # A reuse starts nothing, so it spends nothing.
        assert env.submit_limiter.check.await_count == 1

    @pytest.mark.asyncio
    async def test_failed_job_is_not_handed_back(self, env, monkeypatch):
        # An agent that saw the job fail and sends the search again wants a
        # new run, not the dead one.
        _as(monkeypatch, _request())
        await _submit()
        env.galaxy.get_job_status.return_value = MagicMock(
            is_complete=True, is_successful=False
        )
        again = await _submit()
        assert again["status"] == "submitted"
        assert env.galaxy.submit_kmindex_query.await_count == 2

    @pytest.mark.asyncio
    async def test_caller_behind_a_trusted_proxy_is_one_caller(self, env, monkeypatch):
        monkeypatch.setenv("TRUST_PROXY_HEADERS", "true")
        get_settings.cache_clear()
        xff = {"X-Forwarded-For": "192.0.2.44"}
        _as(monkeypatch, _request(xff, ip="10.0.0.1"))
        await _submit()
        _as(monkeypatch, _request(xff, ip="10.0.0.2"))
        assert (await _submit())["status"] == "reused"

    @pytest.mark.asyncio
    async def test_different_search_is_not_reused(self, env, monkeypatch):
        _as(monkeypatch, _request())
        await _submit()
        await _submit(threshold=0.9)
        assert env.galaxy.submit_kmindex_query.await_count == 2

    @pytest.mark.asyncio
    async def test_different_caller_is_not_reused(self, env, monkeypatch):
        _as(monkeypatch, _request(ip="203.0.113.7"))
        await _submit()
        _as(monkeypatch, _request(ip="198.51.100.9"))
        await _submit()
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        await _submit()
        assert env.galaxy.submit_kmindex_query.await_count == 3

    @pytest.mark.asyncio
    async def test_retry_during_the_first_submit_starts_nothing(self, env, monkeypatch):
        # The timeout retry the dedupe exists for lands while the first call
        # is still uploading to Galaxy.
        _as(monkeypatch, _request())
        release = asyncio.Event()

        async def slow_submit(_submission):
            await release.wait()
            return GalaxyJobResponse(job_id=JOB_ID, upload_dataset_id="ds1")

        env.galaxy.submit_kmindex_query.side_effect = slow_submit
        first = asyncio.create_task(_submit())
        await asyncio.sleep(0)
        retry_task = asyncio.create_task(_submit())
        await asyncio.sleep(0)
        release.set()
        assert (await first)["status"] == "submitted"
        retry = await retry_task
        assert retry["status_code"] == 409
        assert retry["retry_after_seconds"]
        assert env.galaxy.submit_kmindex_query.await_count == 1
        assert (await _submit())["status"] == "reused"

    @pytest.mark.asyncio
    async def test_ambiguous_failure_is_not_blindly_retried(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.galaxy.submit_kmindex_query.side_effect = RuntimeError("reply lost")
        first = await _submit()
        again = await _submit()
        assert first["status_code"] == 502
        assert again["status_code"] == 409
        assert "may" in again["error"]
        assert env.galaxy.submit_kmindex_query.await_count == 1

    @pytest.mark.asyncio
    async def test_refused_submit_can_be_sent_again(self, env, monkeypatch):
        _as(monkeypatch, _request())
        env.submit_limiter.check.side_effect = [
            HTTPException(status_code=429, detail="over"),
            {},
        ]
        assert (await _submit())["status_code"] == 429
        assert (await _submit())["status"] == "submitted"


class TestPartner:
    @pytest.mark.asyncio
    async def test_key_runs_as_the_partner(self, env, monkeypatch):
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        out = await _submit()
        assert out["status"] == "submitted"
        assert out["as"] == "partner:acme"
        assert env.built == [("partner", "acme")]
        env.partner_submit.check.assert_awaited_once()
        env.submit_limiter.check.assert_not_awaited()
        kwargs = env.record.await_args.kwargs
        assert kwargs["source"] == "partner"
        assert kwargs["partner_id"] == "acme"

    @pytest.mark.asyncio
    async def test_bad_key_is_a_401_not_anonymous(self, env, monkeypatch):
        _as(monkeypatch, _request({"X-API-Key": "brc_wrong"}))
        out = await _submit()
        assert out["status_code"] == 401
        env.galaxy.submit_kmindex_query.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_empty_key_is_a_401_not_anonymous(self, env, monkeypatch):
        # A client whose key variable came up empty still meant to send one.
        _as(monkeypatch, _request({"X-API-Key": ""}))
        out = await _submit()
        assert out["status_code"] == 401
        env.galaxy.submit_kmindex_query.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_key_past_sunset_is_a_410(self, env, monkeypatch):
        past = datetime.now(timezone.utc) - timedelta(days=1)
        monkeypatch.setenv("PARTNER_API_SUNSET", past.isoformat())
        get_settings.cache_clear()
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        out = await _submit()
        assert out["status_code"] == 410

    @pytest.mark.asyncio
    async def test_key_when_partner_api_is_off_is_a_400(self, env, monkeypatch):
        monkeypatch.setenv("PARTNER_API_ENABLED", "false")
        get_settings.cache_clear()
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        out = await _submit()
        assert out["status_code"] == 400

    @pytest.mark.asyncio
    async def test_paused_partner_submits_are_a_503(self, env, monkeypatch):
        monkeypatch.setenv("PARTNER_SUBMIT_PAUSED", "true")
        get_settings.cache_clear()
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        out = await _submit()
        assert out["status_code"] == 503


def test_tool_reaches_the_real_http_request(env, tmp_path):
    """Through the mounted stateless HTTP app, the tool sees the caller's
    headers -- which is the whole basis for telling partners from anonymous."""
    galaxy_for_gating = MagicMock()
    galaxy_for_gating.is_available.return_value = True
    mcp = create_mcp_server(
        _catalog_data(tmp_path), MagicMock(), galaxy=galaxy_for_gating
    )
    mcp_app = mcp.http_app(path="/", stateless_http=True)

    @asynccontextmanager
    async def lifespan(app):
        async with mcp_app.lifespan(app):
            yield

    app = Starlette(routes=[Mount("/mcp", app=mcp_app)], lifespan=lifespan)
    body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "logan_submit",
            "arguments": {"sequence": SEQ, "indexes": ["GENOMIC_VRL"]},
        },
    }
    headers = {"Accept": "application/json, text/event-stream", "X-API-Key": KEY}
    with TestClient(app) as client:
        response = client.post("/mcp/", json=body, headers=headers)
    assert response.status_code == 200, response.text
    result = _parse_sse(response.text)["result"]
    out = result.get("structuredContent") or json.loads(result["content"][0]["text"])
    assert out["as"] == "partner:acme", out
    assert out["job_id"] == JOB_ID


class TestIndexesAndQueue:
    def _mcp(self, tmp_path, galaxy):
        return create_mcp_server(_catalog_data(tmp_path), MagicMock(), galaxy=galaxy)

    def _galaxy(self):
        galaxy = MagicMock()
        galaxy.is_available.return_value = True
        return galaxy

    def test_registered_alongside_the_other_logan_tools(self, tmp_path):
        names = _tool_names(self._mcp(tmp_path, self._galaxy()))
        assert {"logan_submit", "logan_list_indexes", "logan_queue"} <= names

    def test_lists_indexes(self, tmp_path):
        galaxy = self._galaxy()
        galaxy.list_kmindex_indexes = AsyncMock(return_value=["GENOMIC_VRL", "X"])
        out = _call_tool(self._mcp(tmp_path, galaxy), "logan_list_indexes", {})
        assert out == {"count": 2, "indexes": ["GENOMIC_VRL", "X"]}

    def test_index_failure_is_an_error_dict(self, tmp_path):
        galaxy = self._galaxy()
        galaxy.list_kmindex_indexes = AsyncMock(side_effect=RuntimeError("boom"))
        out = _call_tool(self._mcp(tmp_path, galaxy), "logan_list_indexes", {})
        assert out["status_code"] == 502

    def test_queue(self, tmp_path):
        galaxy = self._galaxy()
        galaxy.get_kmindex_queue = AsyncMock(
            return_value=KmindexQueueStatus(
                waiting=3,
                running=1,
                recent_searches=5,
                window_minutes=120,
                as_of="2026-11-05T12:00:00Z",
            )
        )
        out = _call_tool(self._mcp(tmp_path, galaxy), "logan_queue", {})
        assert out["waiting"] == 3
        assert out["running"] == 1


class TestRebuild:
    JOB = "fe6f66a714dcbec8"

    def _galaxy(self, is_successful=True, stderr=None):
        galaxy = MagicMock()
        galaxy.is_available.return_value = True
        galaxy.get_job_status = AsyncMock(
            return_value=MagicMock(
                is_complete=True, is_successful=is_successful, stderr=stderr
            )
        )
        galaxy.get_kmindex_results = AsyncMock()
        galaxy.cache = FakeCache()
        return galaxy

    async def _drain(self):
        await asyncio.gather(*list(logan_mcp._builds))

    @pytest.mark.asyncio
    async def test_anonymous_miss_merges_on_the_native_lane_without_waiting(
        self, env, monkeypatch
    ):
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        out = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        await self._drain()
        assert out["status"] == "building"
        assert out["retry_after_seconds"] == logan_mcp.BUILD_RETRY_AFTER
        kwargs = galaxy.get_kmindex_results.await_args.kwargs
        assert kwargs["lane"] == "native"
        assert kwargs["wait"] is False

    @pytest.mark.asyncio
    async def test_key_holder_miss_merges_on_the_partner_lane(self, env, monkeypatch):
        _as(monkeypatch, _request({"X-API-Key": KEY}))
        galaxy = self._galaxy()
        await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        await self._drain()
        assert galaxy.get_kmindex_results.await_args.kwargs["lane"] == "partner"

    @pytest.mark.asyncio
    async def test_failed_job_says_so_instead_of_building(self, env, monkeypatch):
        _as(monkeypatch, _request())
        galaxy = self._galaxy(is_successful=False, stderr="x" * 5000)
        out = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        assert out["status"] == "failed"
        assert len(out["error"]) == logan_mcp.STDERR_TAIL
        galaxy.get_kmindex_results.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_hits_and_not_ready_pass_through(self, env, monkeypatch):
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        for out in ({"status": "ok"}, {"status": "not_ready"}):
            assert await logan_mcp.with_rebuild(galaxy, self.JOB, out) == out
        galaxy.get_kmindex_results.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_bad_key_on_a_read_is_a_401(self, env, monkeypatch):
        _as(monkeypatch, _request({"X-API-Key": "brc_wrong"}))
        out = await logan_mcp.with_rebuild(
            self._galaxy(), self.JOB, {"status": "expired"}
        )
        assert out["status_code"] == 401

    @pytest.mark.asyncio
    async def test_busy_lane_is_quiet(self, env, monkeypatch):
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        galaxy.get_kmindex_results.side_effect = GalaxyJobAggregating("queued")
        out = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        await self._drain()
        assert out["status"] == "building"

    @pytest.mark.asyncio
    async def test_failed_merge_is_an_error_not_building_forever(
        self, env, monkeypatch
    ):
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        galaxy.get_kmindex_results.side_effect = RuntimeError("outputs gone")
        first = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        await self._drain()
        again = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        await self._drain()
        assert first["status"] == "building"
        assert again["status_code"] == 502
        assert again["retry_after_seconds"] == logan_mcp.BUILD_FAILURE_TTL
        # The next poll answers from the marker instead of merging again.
        assert galaxy.get_kmindex_results.await_count == 1

    @pytest.mark.asyncio
    async def test_job_still_running_is_not_ready_not_building(self, env, monkeypatch):
        # _miss reads "expired" when its own status lookup failed; a second
        # lookup that says the job is running must not promise a merge.
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        galaxy.get_job_status.return_value = MagicMock(
            is_complete=False, is_successful=False
        )
        out = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        assert out["status"] == "not_ready"
        assert out["retry_after_seconds"]
        galaxy.get_kmindex_results.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_status_lookup_failure_is_retryable(self, env, monkeypatch):
        _as(monkeypatch, _request())
        galaxy = self._galaxy()
        galaxy.get_job_status.side_effect = RuntimeError("galaxy down")
        out = await logan_mcp.with_rebuild(galaxy, self.JOB, {"status": "expired"})
        assert out["status_code"] == 502
        assert out["retry_after_seconds"]
        galaxy.get_kmindex_results.assert_not_awaited()
