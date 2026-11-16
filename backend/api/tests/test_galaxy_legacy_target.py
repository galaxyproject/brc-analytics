"""Reading jobs from the Galaxy we used to submit to.

Prod moved from Galaxy Test to usegalaxy.org, and partners still hold Test job
ids. Test's ids are 16 hex characters and usegalaxy.org's 32, so with a legacy
Galaxy configured a 16-character job is read there, on its own service key,
and everything else stays on the primary Galaxy.
"""

from unittest.mock import MagicMock

import pytest

from app.api.v1 import galaxy as galaxy_router
from app.api.v1 import partner as partner_router
from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.core.galaxy_target import galaxy_target_for_job
from app.models.galaxy import (
    GalaxyJobState,
    GalaxyJobStatus,
    KmindexQuerySubmission,
)
from app.services.assistant_agent import AssistantAgent, LoganJobNotReadyError
from app.services.galaxy_service import (
    GalaxyJobNotFound,
    GalaxyReadOnlyError,
    GalaxyService,
)
from app.services.tools import logan_mcp
from app.services.tools.catalog_tools import AssistantDeps
from app.services.tools.logan_tools import logan_cohort, logan_job_status
from tests.test_galaxy_credential import FakeCache
from tests.test_galaxy_submit_ownership import app_client  # noqa: F401
from tests.test_partner_api import BASE, HEADERS, partner_env  # noqa: F401

PRIMARY_API = "https://usegalaxy.org/api"
LEGACY_API = "https://test.galaxyproject.org/api"
TEST_JOB = "0123456789abcdef"
MAIN_JOB = "bbd44e69cb8906b58abb1bc0bf72e0ce"
USER = GalaxyCredential(kind="user", secret="bearer", user_sub="u1")


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


class TestConfig:
    def test_a_legacy_url_without_its_key_refuses_to_start(
        self, primary_only, monkeypatch
    ):
        monkeypatch.setenv("GALAXY_LEGACY_API_URL", LEGACY_API)
        get_settings.cache_clear()
        with pytest.raises(ValueError, match="GALAXY_LEGACY_API_KEY"):
            get_settings()


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

    def test_for_job_reroutes_only_short_ids(self, with_legacy):
        primary = GalaxyService(FakeCache(), credential=USER, sra_mirror=object())
        assert primary.for_job(MAIN_JOB) is primary
        legacy = primary.for_job(TEST_JOB)
        assert legacy.target.legacy
        assert legacy.cache is primary.cache
        # Legacy results are joined to SRA metadata like any others.
        assert legacy.sra_mirror is primary.sra_mirror
        # The user's bearer stays behind on the primary Galaxy.
        assert legacy.credential == GalaxyCredential(kind="service", secret="test-key")

    def test_for_job_is_a_no_op_without_legacy(self, primary_only):
        primary = GalaxyService(FakeCache())
        assert primary.for_job(TEST_JOB) is primary

    @pytest.mark.asyncio
    async def test_a_legacy_service_refuses_to_submit(self, with_legacy):
        legacy = GalaxyService(FakeCache()).for_job(TEST_JOB)
        submission = KmindexQuerySubmission(sequence="ACGT" * 10, indexes=["idx"])
        with pytest.raises(GalaxyReadOnlyError):
            await legacy.submit_kmindex_query(submission)
        with pytest.raises(GalaxyReadOnlyError):
            await legacy._get_or_create_shared_history()


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
        agent = AssistantAgent.__new__(AssistantAgent)
        agent.galaxy = GalaxyService(FakeCache())
        with pytest.raises(LoganJobNotReadyError):
            await agent.fetch_logan_snapshot(TEST_JOB)
        assert seen == [(TEST_JOB, LEGACY_API, "test-key")]

    @pytest.mark.asyncio
    async def test_an_mcp_rebuild_reads_legacy_status(
        self, with_legacy, seen, monkeypatch
    ):
        monkeypatch.setattr(logan_mcp, "current_request", lambda: None)
        out = await logan_mcp.with_rebuild(
            GalaxyService(FakeCache()), TEST_JOB, {"status": "expired"}
        )
        assert out["status"] == "not_ready"
        assert seen == [(TEST_JOB, LEGACY_API, "test-key")]


@pytest.fixture()
def reads(monkeypatch, tmp_path):
    """Which Galaxy the first read of each job route went to.

    Every job route starts with one of these four reads. The export routes
    reach get_job_status through source_job_id, and only once there is an
    export directory to look in.
    """
    monkeypatch.setenv("KMINDEX_EXPORT_DIR", str(tmp_path))
    get_settings.cache_clear()
    calls = []

    async def read(self, job_id, *args, **kwargs):
        calls.append((job_id, self.target.api_url, self.credential.secret))
        raise GalaxyJobNotFound(job_id)

    for name in (
        "get_filtered_kmindex_summary",
        "get_job_results",
        "get_job_status",
        "get_kmindex_results",
    ):
        monkeypatch.setattr(GalaxyService, name, read)
    return calls


class TestOverHttp:
    """Through the real routes: each one opts in to for_job on its own."""

    @pytest.mark.parametrize(
        "path",
        [
            "jobs/{job_id}",
            "jobs/{job_id}/results",
            "jobs/{job_id}/status",
            "kmindex/jobs/{job_id}/export",
            "kmindex/jobs/{job_id}/results",
            "kmindex/jobs/{job_id}/summary",
        ],
    )
    @pytest.mark.parametrize(
        "job_id, api, key",
        [(TEST_JOB, LEGACY_API, "test-key"), (MAIN_JOB, PRIMARY_API, "main-key")],
    )
    def test_job_reads_follow_the_id(
        self,
        with_legacy,
        app_client,  # noqa: F811
        reads,
        path,
        job_id,
        api,
        key,
    ):
        app, client = app_client
        app.dependency_overrides[galaxy_router.get_cache_service] = FakeCache
        app.dependency_overrides[galaxy_router.get_sra_mirror_service] = lambda: None
        app.dependency_overrides[galaxy_router.get_galaxy_credential] = lambda: USER

        response = client.get(f"/api/v1/galaxy/{path.format(job_id=job_id)}")

        assert response.status_code == 404, response.text
        # The 32-character read keeps the signed-in user's bearer.
        assert reads == [(job_id, api, key if api == LEGACY_API else "bearer")]


class TestPartnerOverHttp:
    """The partner job routes, with the real get_partner_galaxy_service."""

    @pytest.mark.parametrize("path", ["", "/export", "/results"])
    @pytest.mark.parametrize(
        "job_id, api, key",
        [(TEST_JOB, LEGACY_API, "test-key"), (MAIN_JOB, PRIMARY_API, "main-key")],
    )
    def test_job_reads_follow_the_id(
        self,
        partner_env,  # noqa: F811
        with_legacy,
        reads,
        path,
        job_id,
        api,
        key,
    ):
        client, _, _ = partner_env
        overrides = client.app.dependency_overrides
        overrides.pop(partner_router.get_partner_galaxy_service)
        # The export looks a job-cache copy up by a key partner_env's cache
        # cannot make.
        overrides[partner_router.get_cache_service] = FakeCache

        response = client.get(f"{BASE}/jobs/{job_id}{path}", headers=HEADERS)

        assert response.status_code == 404, response.text
        assert reads == [(job_id, api, key)]
