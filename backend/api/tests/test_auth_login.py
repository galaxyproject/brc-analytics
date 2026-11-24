import base64
import hashlib
import json
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlsplit

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.auth import router
from app.core.config import get_settings
from app.core.dependencies import get_auth_service
from app.services.auth_service import AuthService


@pytest.fixture
def login_client(monkeypatch):
    monkeypatch.setenv(
        "KEYCLOAK_REDIRECT_URI", "https://brc.example/api/v1/auth/callback"
    )
    auth = AuthService.__new__(AuthService)
    auth._settings = get_settings()
    auth._oidc_config = {"authorization_endpoint": "https://auth.example/authorize"}
    auth._redis = AsyncMock()

    app = FastAPI()
    app.include_router(router, prefix="/api/v1/auth")
    app.dependency_overrides[get_auth_service] = lambda: auth
    with TestClient(app, follow_redirects=False) as client:
        yield client, auth._redis


@pytest.mark.parametrize(
    ("query", "hint"), [("", []), ("?provider=google", ["google"])]
)
def test_login_starts_a_fresh_oidc_flow(login_client, query, hint):
    client, redis = login_client
    response = client.get("/api/v1/auth/login" + query)

    assert response.status_code == 302
    location = urlsplit(response.headers["location"])
    assert (location.scheme, location.netloc, location.path) == (
        "https",
        "auth.example",
        "/authorize",
    )
    params = parse_qs(location.query)
    assert params.get("kc_idp_hint", []) == hint
    assert params["redirect_uri"] == ["https://brc.example/api/v1/auth/callback"]
    assert params["code_challenge_method"] == ["S256"]
    redis.setex.assert_awaited_once()
    key, ttl, stored = redis.setex.await_args.args
    assert key == f"auth:pkce:{params['state'][0]}"
    assert ttl > 0
    verifier = json.loads(stored)["code_verifier"]
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    expected_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    assert params["code_challenge"] == [expected_challenge]


def test_login_rejects_an_unsupported_provider(login_client):
    client, redis = login_client
    assert client.get("/api/v1/auth/login?provider=other").status_code == 422
    redis.setex.assert_not_awaited()
