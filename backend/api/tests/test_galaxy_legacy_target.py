"""Reading jobs from the Galaxy we used to submit to.

Prod moved from Galaxy Test to usegalaxy.org, and partners still hold Test job
ids. Test's ids are 16 hex characters and usegalaxy.org's 32, so with a legacy
Galaxy configured a 16-character job is read there, on its own service key,
and everything else stays on the primary Galaxy.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.api.v1 import galaxy as galaxy_router
from app.api.v1 import partner as partner_router
from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.core.galaxy_target import galaxy_target_for_job, primary_galaxy_target
from app.core.partner_keys import Partner
from app.models.galaxy import GalaxyJobState, GalaxyJobStatus
from app.services import logan_jobs
from app.services.galaxy_service import GalaxyService, galaxy_for_job
from app.services.tools.catalog_tools import AssistantDeps
from app.services.tools.logan_tools import logan_cohort, logan_job_status

PRIMARY_API = "https://usegalaxy.org/api"
LEGACY_API = "https://test.galaxyproject.org/api"
TEST_JOB = "0123456789abcdef"
MAIN_JOB = "bbd44e69cb8906b58abb1bc0bf72e0ce"
PARTNER = Partner(key_id="k1", partner_id="example-partner")
USER = GalaxyCredential(kind="user", secret="bearer", user_sub="u1")


class FakeCache:
    def make_key(self, prefix, params):
        import json

        return f"{prefix}:{json.dumps(params, sort_keys=True)}"

    async def get(self, key):
        return None

    async def set(self, key, value, ttl=3600):
        return True


@pytest.fixture()
def primary_only(monkeypatch):
    monkeypatch.setenv("GALAXY_API_URL", PRIMARY_API)
    monkeypatch.setenv("GALAXY_API_KEY", "main-key")
    monkeypatch.delenv("GALAXY_LEGACY_API_URL", raising=False)
    monkeypatch.delenv("GALAXY_LEGACY_API_KEY", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def with_legacy(primary_only, monkeypatch):
    monkeypatch.setenv("GALAXY_LEGACY_API_URL", LEGACY_API)
    monkeypatch.setenv("GALAXY_LEGACY_API_KEY", "test-key")
    get_settings.cache_clear()


def _request(**path_params):
    return SimpleNamespace(path_params=path_params)


class TestConfig:
    def test_legacy_is_off_by_default(self, primary_only):
        settings = get_settings()
        assert settings.GALAXY_LEGACY_API_URL == ""
        assert settings.GALAXY_LEGACY_BASE_URL == ""

    def test_legacy_base_url_is_derived_like_the_primary(self, with_legacy):
        assert get_settings().GALAXY_LEGACY_BASE_URL == (
            "https://test.galaxyproject.org"
        )

    def test_a_legacy_url_without_its_key_refuses_to_start(
        self, primary_only, monkeypatch
    ):
        monkeypatch.setenv("GALAXY_LEGACY_API_URL", LEGACY_API)
        get_settings.cache_clear()
        with pytest.raises(ValueError, match="GALAXY_LEGACY_API_KEY"):
            get_settings()


class TestRouting:
    def test_without_legacy_every_job_is_primary(self, primary_only):
        for job in (TEST_JOB, MAIN_JOB, None):
            assert galaxy_target_for_job(job) == primary_galaxy_target()

    def test_a_short_id_goes_to_legacy(self, with_legacy):
        target = galaxy_target_for_job(TEST_JOB)
        assert target.legacy
        assert target.api_url == LEGACY_API
        assert target.base_url == "https://test.galaxyproject.org"
        assert target.api_key == "test-key"

    def test_a_long_id_goes_to_primary(self, with_legacy):
        target = galaxy_target_for_job(MAIN_JOB)
        assert not target.legacy
        assert target.api_url == PRIMARY_API
        assert target.api_key == "main-key"

    def test_no_job_is_primary(self, with_legacy):
        assert galaxy_target_for_job(None) == primary_galaxy_target()


class TestService:
    def test_a_legacy_service_talks_to_legacy_on_its_key(self, with_legacy):
        g = GalaxyService(
            FakeCache(), credential=USER, target=galaxy_target_for_job(TEST_JOB)
        )
        # A user's bearer is only good on the primary Galaxy.
        assert g.credential == GalaxyCredential(kind="service", secret="test-key")
        assert g.gi.url == "https://test.galaxyproject.org/api"
        assert g.target.api_url == LEGACY_API

    def test_a_default_service_is_primary(self, with_legacy):
        g = GalaxyService(FakeCache())
        assert g.gi.url == "https://usegalaxy.org/api"
        assert g.credential.secret == "main-key"

    def test_cache_keys_keep_the_two_galaxies_apart(self, with_legacy):
        primary = GalaxyService(FakeCache())
        legacy = GalaxyService(FakeCache(), target=galaxy_target_for_job(TEST_JOB))
        assert primary._index_cache_key("idx") != legacy._index_cache_key("idx")
        assert primary._history_cache_key("acct", "h") != legacy._history_cache_key(
            "acct", "h"
        )

    def test_galaxy_for_job_reroutes_only_short_ids(self, with_legacy):
        primary = GalaxyService(FakeCache(), history_name="H")
        assert galaxy_for_job(primary, MAIN_JOB) is primary
        legacy = galaxy_for_job(primary, TEST_JOB)
        assert legacy.target.legacy
        assert legacy.cache is primary.cache
        assert legacy.history_name == "H"

    def test_galaxy_for_job_is_a_no_op_without_legacy(self, primary_only):
        primary = GalaxyService(FakeCache())
        assert galaxy_for_job(primary, TEST_JOB) is primary


class TestNativeRoutes:
    @pytest.mark.asyncio
    async def test_a_short_job_route_reads_legacy(self, with_legacy):
        g = await galaxy_router.get_galaxy_service(
            request=_request(job_id=TEST_JOB),
            cache=FakeCache(),
            sra_mirror=None,
            credential=USER,
        )
        assert g.target.api_url == LEGACY_API
        assert g.credential.secret == "test-key"

    @pytest.mark.asyncio
    async def test_a_long_job_route_reads_primary_as_the_user(self, with_legacy):
        g = await galaxy_router.get_galaxy_service(
            request=_request(job_id=MAIN_JOB),
            cache=FakeCache(),
            sra_mirror=None,
            credential=USER,
        )
        assert g.target.api_url == PRIMARY_API
        assert g.credential == USER

    @pytest.mark.asyncio
    async def test_a_submit_route_is_primary(self, with_legacy):
        g = await galaxy_router.get_galaxy_service(
            request=_request(), cache=FakeCache(), sra_mirror=None, credential=USER
        )
        assert g.target.api_url == PRIMARY_API
        assert g.credential == USER


class TestPartner:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "job_id, api, key",
        [(TEST_JOB, LEGACY_API, "test-key"), (MAIN_JOB, PRIMARY_API, "main-key")],
    )
    async def test_job_reads_follow_the_id(self, with_legacy, job_id, api, key):
        g = await partner_router.get_partner_galaxy_service(
            request=_request(job_id=job_id),
            partner=PARTNER,
            cache=FakeCache(),
            sra_mirror=None,
        )
        assert g.target.api_url == api
        assert g.credential.secret == key
        assert g.history_name == "BRC Logan Partner - example-partner"

    @pytest.mark.asyncio
    async def test_a_submit_is_primary(self, with_legacy):
        g = await partner_router.get_partner_galaxy_service(
            request=_request(), partner=PARTNER, cache=FakeCache(), sra_mirror=None
        )
        assert g.target.api_url == PRIMARY_API
        assert g.credential.secret == "main-key"

    def test_mcp_submit_services_are_primary(self, with_legacy):
        for g in (
            logan_jobs.partner_galaxy_service(PARTNER, FakeCache(), None),
            logan_jobs.anonymous_galaxy_service(FakeCache(), None),
        ):
            assert g.target.api_url == PRIMARY_API


def _status(job_id):
    return GalaxyJobStatus(
        job_id=job_id,
        state=GalaxyJobState.RUNNING,
        created_time="t",
        updated_time="t",
        is_complete=False,
        is_successful=False,
    )


@pytest.fixture()
def seen(monkeypatch):
    """Which Galaxy each job-scoped read went to."""
    calls = []

    async def get_job_status(self, job_id):
        calls.append((job_id, self.target.api_url, self.credential.secret))
        return _status(job_id)

    async def get_cached_kmindex_results(self, job_id, limit, offset):
        return None

    monkeypatch.setattr(GalaxyService, "get_job_status", get_job_status)
    monkeypatch.setattr(
        GalaxyService, "get_cached_kmindex_results", get_cached_kmindex_results
    )
    return calls


class TestTools:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "job_id, api", [(TEST_JOB, LEGACY_API), (MAIN_JOB, PRIMARY_API)]
    )
    async def test_status_follows_the_id(self, with_legacy, seen, job_id, api):
        deps = AssistantDeps(catalog=MagicMock(), galaxy=GalaxyService(FakeCache()))
        await logan_job_status(deps, job_id)
        assert seen == [(job_id, api, "test-key" if api == LEGACY_API else "main-key")]

    @pytest.mark.asyncio
    async def test_a_cohort_miss_asks_legacy_for_a_short_id(self, with_legacy, seen):
        deps = AssistantDeps(catalog=MagicMock(), galaxy=GalaxyService(FakeCache()))
        await logan_cohort(deps, TEST_JOB)
        assert seen == [(TEST_JOB, LEGACY_API, "test-key")]

    @pytest.mark.asyncio
    async def test_without_legacy_a_short_id_stays_primary(self, primary_only, seen):
        deps = AssistantDeps(catalog=MagicMock(), galaxy=GalaxyService(FakeCache()))
        await logan_job_status(deps, TEST_JOB)
        assert seen == [(TEST_JOB, PRIMARY_API, "main-key")]

    @pytest.mark.asyncio
    async def test_the_assistant_snapshot_miss_asks_legacy(self, with_legacy, seen):
        from app.services.assistant_agent import AssistantAgent, LoganJobNotReadyError

        agent = AssistantAgent.__new__(AssistantAgent)
        agent.galaxy = GalaxyService(FakeCache())
        with pytest.raises(LoganJobNotReadyError):
            await agent.fetch_logan_snapshot(TEST_JOB)
        assert seen == [(TEST_JOB, LEGACY_API, "test-key")]

    @pytest.mark.asyncio
    async def test_an_mcp_rebuild_reads_legacy_status(
        self, with_legacy, seen, monkeypatch
    ):
        from app.services.tools import logan_mcp

        monkeypatch.setattr(logan_mcp, "current_request", lambda: None)
        out = await logan_mcp.with_rebuild(
            GalaxyService(FakeCache()), TEST_JOB, {"status": "expired"}
        )
        assert out["status"] == "not_ready"
        assert seen == [(TEST_JOB, LEGACY_API, "test-key")]
