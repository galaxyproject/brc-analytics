"""End-to-end coverage of the cookie -> session -> bearer seam.

Every other test either stubs the credential or stubs the service, so the one
join that actually carries the feature -- a brc_session cookie becoming an
Authorization: Bearer header on the Galaxy call -- was never exercised. This
runs the real app with the real get_galaxy_credential and get_galaxy_service,
faking only the session store and bioblend's transport.
"""

import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from fastapi.testclient import TestClient

from app.api.v1 import galaxy as galaxy_module
from app.core.config import get_settings
from app.core.dependencies import check_rate_limit, check_submit_rate_limit
from app.models.galaxy import GalaxyJobResponse
from app.services.auth_service import COOKIE_NAME
from app.services.galaxy_service import GalaxyService
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

SUBMISSION_PAYLOAD = {"sequence": "ACGT", "indexes": ["GENOMIC_BCT"]}
USER_TOKEN = jwt.encode(
    {"exp": int(time.time()) + 300, "sub": "u1", "preferred_username": "dan"},
    "k" * 32,
)


async def _no_rate_limit():
    return {"limit": 100, "remaining": 100, "reset": 60}


@pytest.fixture()
def seam(tmp_path, monkeypatch):
    """The real app, with only the session store and bioblend faked.

    Yields (client, fake_auth, created_services, galaxy_instance_mock).
    """
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    # The ownership hook is exercised elsewhere; keep it out of this seam.
    monkeypatch.setenv("DATABASE_URL", "")

    from app.core import dependencies

    get_settings.cache_clear()
    dependencies.reset_all_services()

    fake_cache = MagicMock()
    fake_cache.clear_caches = AsyncMock(return_value=0)
    fake_cache.close = AsyncMock()

    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()
    fake_auth.get_valid_access_token = AsyncMock(return_value=USER_TOKEN)
    fake_auth.decode_token_claims = MagicMock(
        return_value={"preferred_username": "dan", "sub": "u1"}
    )

    created: list[GalaxyService] = []

    def record(*args, **kwargs) -> GalaxyService:
        service = GalaxyService(*args, **kwargs)
        created.append(service)
        return service

    from app.main import create_app

    app = create_app()
    app.dependency_overrides[check_rate_limit] = _no_rate_limit
    app.dependency_overrides[check_submit_rate_limit] = _no_rate_limit
    app.dependency_overrides[dependencies.get_auth_service] = lambda: fake_auth
    app.dependency_overrides[dependencies.get_cache_service] = lambda: fake_cache

    monkeypatch.setattr(galaxy_module, "GalaxyService", record)

    with (
        patch("app.services.galaxy_service.GalaxyInstance") as gi,
        patch.object(
            GalaxyService,
            "submit_kmindex_query",
            AsyncMock(
                return_value=GalaxyJobResponse(job_id="job1", upload_dataset_id="ds1")
            ),
        ),
    ):
        yield TestClient(app), fake_auth, created, gi

    get_settings.cache_clear()


def test_session_cookie_becomes_a_bearer_token_on_the_galaxy_call(seam):
    client, fake_auth, created, gi = seam
    client.cookies.set(COOKIE_NAME, "s1")

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    assert fake_auth.get_valid_access_token.await_count == 1
    assert fake_auth.get_valid_access_token.await_args.args[0] == "s1"

    credential = created[0].credential
    assert credential.kind == "user"
    assert credential.user_sub == "u1"
    assert gi.call_args.kwargs["token"] == USER_TOKEN
    assert "key" not in gi.call_args.kwargs


def test_no_cookie_uses_the_service_key_and_never_reads_a_session(seam):
    client, fake_auth, created, gi = seam

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    fake_auth.get_valid_access_token.assert_not_awaited()

    credential = created[0].credential
    assert credential.kind == "service"
    assert gi.call_args.kwargs["key"] == "svc-key"
    assert "token" not in gi.call_args.kwargs
