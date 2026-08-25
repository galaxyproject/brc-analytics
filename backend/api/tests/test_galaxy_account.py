"""Route-level coverage for GET /galaxy/user and the 409 not-linked mapping.

GET /galaxy/user must never touch Galaxy for an absent or service credential --
those are answered from the credential alone. A user credential is the only
case that calls Galaxy, and a 401 there becomes a login prompt rather than an
error. The submit route's 409 mapping is exercised separately, by stubbing the
service to raise GalaxyAccountNotLinkedError directly.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import requests
from bioblend import ConnectionError as BioblendConnectionError
from fastapi.testclient import TestClient

from app.api.v1.galaxy import get_galaxy_service
from app.core.config import get_settings
from app.core.dependencies import check_rate_limit, check_submit_rate_limit
from app.core.galaxy_credential import GalaxyCredential
from app.services.galaxy_service import GalaxyAccountNotLinkedError, GalaxyService
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

SUBMISSION_PAYLOAD = {"sequence": "ACGT", "indexes": ["GENOMIC_BCT"]}


async def _no_rate_limit():
    return {"limit": 100, "remaining": 100, "reset": 60}


def _stub_service(credential):
    service = MagicMock()
    service.credential = credential
    service.settings = get_settings()
    service.is_available.return_value = True
    service.submit_kmindex_query = AsyncMock()
    return service


@pytest.fixture()
def app_client(tmp_path, monkeypatch):
    """A real app with the galaxy router wired up, minus Redis/DB.

    Only get_galaxy_service and the two rate limiters are overridden; the
    routes themselves run unmodified.
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

    yield app, TestClient(app)
    get_settings.cache_clear()


def test_no_credential_is_not_linked_and_does_not_call_galaxy(app_client):
    app, client = app_client
    service = _stub_service(None)
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")

    assert response.status_code == 200
    assert response.json() == {
        "galaxy_login_url": None,
        "galaxy_user_id": None,
        "galaxy_username": None,
        "identity": "none",
        "linked": False,
    }
    service.gi.users.get_current_user.assert_not_called()


def test_service_credential_is_not_linked_and_does_not_call_galaxy(app_client):
    app, client = app_client
    service = _stub_service(GalaxyCredential(kind="service", secret="k"))
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")

    assert response.status_code == 200
    assert response.json() == {
        "galaxy_login_url": None,
        "galaxy_user_id": None,
        "galaxy_username": None,
        "identity": "service",
        "linked": False,
    }
    service.gi.users.get_current_user.assert_not_called()


def test_user_credential_linked_reports_galaxy_identity(app_client):
    app, client = app_client
    service = _stub_service(GalaxyCredential(kind="user", secret="t", user_sub="u1"))
    service.gi.users.get_current_user.return_value = {"id": "u1", "username": "dan"}
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")

    assert response.status_code == 200
    assert response.json() == {
        "galaxy_login_url": None,
        "galaxy_user_id": "u1",
        "galaxy_username": "dan",
        "identity": "user",
        "linked": True,
    }


def test_user_credential_unlinked_401_offers_login_url(app_client, monkeypatch):
    app, client = app_client
    monkeypatch.setenv("GALAXY_API_URL", "https://test.galaxyproject.org/api")
    get_settings.cache_clear()

    with patch("app.services.galaxy_service.GalaxyInstance"):
        service = GalaxyService(
            MagicMock(),
            credential=GalaxyCredential(kind="user", secret="t", user_sub="u1"),
        )
    service.gi = MagicMock()
    service.gi.users.get_current_user.side_effect = BioblendConnectionError(
        "401", body="", status_code=401
    )
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")
    get_settings.cache_clear()

    assert response.status_code == 200
    body = response.json()
    assert body["linked"] is False
    assert body["galaxy_login_url"] == (
        "https://test.galaxyproject.org/authnz/keycloak/login?redirect=true"
    )


def test_user_credential_transport_error_returns_502(app_client):
    app, client = app_client
    with patch("app.services.galaxy_service.GalaxyInstance"):
        service = GalaxyService(
            MagicMock(),
            credential=GalaxyCredential(kind="user", secret="t", user_sub="u1"),
        )
    service.gi = MagicMock()
    service.gi.users.get_current_user.side_effect = requests.exceptions.ConnectionError(
        "boom"
    )
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")

    assert response.status_code == 502
    assert response.json()["detail"] == "Galaxy account check failed"


def test_user_credential_non_401_bioblend_error_returns_502(app_client):
    app, client = app_client
    with patch("app.services.galaxy_service.GalaxyInstance"):
        service = GalaxyService(
            MagicMock(),
            credential=GalaxyCredential(kind="user", secret="t", user_sub="u1"),
        )
    service.gi = MagicMock()
    service.gi.users.get_current_user.side_effect = BioblendConnectionError(
        "500", body="", status_code=500
    )
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/user")

    assert response.status_code == 502
    assert response.json()["detail"] == "Galaxy account check failed"


def test_submit_maps_account_not_linked_error_to_409(app_client):
    app, client = app_client
    service = _stub_service(GalaxyCredential(kind="user", secret="t", user_sub="u1"))
    login_url = "https://x/authnz/keycloak/login?redirect=true"
    service.submit_kmindex_query.side_effect = GalaxyAccountNotLinkedError(login_url)
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "galaxy_account_not_linked"
    assert detail["galaxy_login_url"] == login_url
