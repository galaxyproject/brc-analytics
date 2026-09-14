"""Route-level coverage for the ownership hook in submit_kmindex_query.

Nothing previously exercised POST /api/v1/galaxy/kmindex/submit. These pin
the two guarantees the hook rests on: the anonymous/service-credential path
never touches the DB, and a failure while recording ownership never fails
the submit -- the Galaxy job already exists by that point.
"""

import json
import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.v1 import galaxy as galaxy_module
from app.api.v1.galaxy import get_galaxy_service
from app.core.config import get_settings
from app.core.dependencies import check_rate_limit, check_submit_rate_limit
from app.core.galaxy_credential import GalaxyCredential
from app.models.galaxy import GalaxyJobResponse
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

SUBMISSION_PAYLOAD = {"sequence": "ACGT", "indexes": ["GENOMIC_BCT"]}


async def _no_rate_limit():
    return {"limit": 100, "remaining": 100, "reset": 60}


def _stub_service(credential):
    service = MagicMock()
    service.credential = credential
    service.settings = get_settings()
    service.is_available.return_value = True
    service.submit_kmindex_query = AsyncMock(
        return_value=GalaxyJobResponse(job_id="job1", upload_dataset_id="ds1")
    )
    return service


@pytest.fixture()
def app_client(tmp_path, monkeypatch):
    """A real app with the galaxy router wired up, minus Redis/DB.

    Only get_galaxy_service and the two rate limiters are overridden; the
    route itself, including the ownership hook, runs unmodified.
    """
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))

    from app.core import dependencies

    get_settings.cache_clear()
    dependencies.reset_all_services()

    fake_cache = MagicMock()
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

    from app.main import create_app

    app = create_app()
    app.dependency_overrides[check_rate_limit] = _no_rate_limit
    app.dependency_overrides[check_submit_rate_limit] = _no_rate_limit

    return app, TestClient(app)


def test_service_credential_submit_does_not_touch_db(app_client, monkeypatch):
    app, client = app_client
    credential = GalaxyCredential(kind="service", secret="k")
    app.dependency_overrides[get_galaxy_service] = lambda: _stub_service(credential)

    mock_db_session = MagicMock()
    monkeypatch.setattr(galaxy_module, "db_session", mock_db_session)

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["job_id"] == "job1"
    mock_db_session.assert_not_called()


def test_user_credential_records_ownership(app_client, monkeypatch):
    app, client = app_client
    credential = GalaxyCredential(kind="user", secret="t", user_sub="sub-1")
    app.dependency_overrides[get_galaxy_service] = lambda: _stub_service(credential)

    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()

    mock_session = MagicMock()
    mock_session.commit = AsyncMock()

    @asynccontextmanager
    async def fake_db_session():
        yield mock_session

    monkeypatch.setattr(galaxy_module, "db_session", fake_db_session)

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()
    monkeypatch.setattr(
        galaxy_module, "get_user_by_keycloak_sub", AsyncMock(return_value=fake_user)
    )
    create_job_mock = AsyncMock()
    monkeypatch.setattr(galaxy_module, "create_galaxy_job", create_job_mock)

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["job_id"] == "job1"
    create_job_mock.assert_awaited_once()
    kwargs = create_job_mock.await_args.kwargs
    assert kwargs["galaxy_job_id"] == "job1"
    assert kwargs["tool"] == "kmindex"
    mock_session.commit.assert_awaited_once()

    get_settings.cache_clear()


def test_ownership_failure_does_not_fail_submit(app_client, monkeypatch):
    app, client = app_client
    credential = GalaxyCredential(kind="user", secret="t", user_sub="sub-1")
    app.dependency_overrides[get_galaxy_service] = lambda: _stub_service(credential)

    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()

    mock_session = MagicMock()
    mock_session.commit = AsyncMock()

    @asynccontextmanager
    async def fake_db_session():
        yield mock_session

    monkeypatch.setattr(galaxy_module, "db_session", fake_db_session)

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()
    monkeypatch.setattr(
        galaxy_module, "get_user_by_keycloak_sub", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        galaxy_module,
        "create_galaxy_job",
        AsyncMock(side_effect=RuntimeError("db down")),
    )

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["job_id"] == "job1"
    # The failure happens before commit, so the ownership row never lands.
    mock_session.commit.assert_not_awaited()

    get_settings.cache_clear()


def test_user_credential_without_database_url_skips_db(app_client, monkeypatch):
    app, client = app_client
    monkeypatch.delenv("DATABASE_URL", raising=False)
    get_settings.cache_clear()

    credential = GalaxyCredential(kind="user", secret="t", user_sub="sub-1")
    app.dependency_overrides[get_galaxy_service] = lambda: _stub_service(credential)

    mock_db_session = MagicMock()
    monkeypatch.setattr(galaxy_module, "db_session", mock_db_session)

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["job_id"] == "job1"
    mock_db_session.assert_not_called()

    get_settings.cache_clear()
