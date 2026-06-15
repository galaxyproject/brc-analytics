"""Integration tests for assistant session-cookie binding."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.session_signing import sign_session_id
from app.models.assistant import (
    AnalysisSchema,
    ChatResponse,
    SessionState,
)
from app.models.user_data import UserMeResponse
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaa"


@pytest.fixture()
def app_with_stubbed_agent(tmp_path, monkeypatch):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("SESSION_COOKIE_SECRET", SECRET)
    monkeypatch.setenv("AI_API_KEY", "stub")

    fake_cache = MagicMock()
    fake_cache.flush_all = AsyncMock()
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()

    from app.core import dependencies
    from app.core.config import get_settings

    get_settings.cache_clear()
    dependencies.reset_all_services()

    monkeypatch.setattr(
        dependencies, "get_cache_service", MagicMock(return_value=fake_cache)
    )
    monkeypatch.setattr(
        dependencies, "get_auth_service", MagicMock(return_value=fake_auth)
    )

    fake_agent = MagicMock()
    fake_agent.is_available.return_value = True
    fake_agent.settings = get_settings()
    fake_agent.get_provider.return_value = "anthropic"
    fake_agent.chat = AsyncMock(
        return_value=ChatResponse(
            session_id="sess-abc",
            reply="hi",
            schema_state=AnalysisSchema(),
        )
    )
    fake_agent.session_service = MagicMock()
    fake_agent.session_service.get_session = AsyncMock(
        return_value=SessionState(session_id="sess-abc")
    )
    fake_agent.session_service.delete_session = AsyncMock(return_value=True)
    fake_agent.compute_handoff = MagicMock(return_value=(False, None))

    from app.main import create_app

    app = create_app()

    # FastAPI binds Depends() to the original function reference at import
    # time, so we override via app.dependency_overrides rather than monkeypatching.
    from app.core.dependencies import check_rate_limit, get_assistant_agent

    async def _no_rate_limit():
        return {"limit": 100, "remaining": 100, "reset": 60}

    app.dependency_overrides[get_assistant_agent] = lambda: fake_agent
    app.dependency_overrides[check_rate_limit] = _no_rate_limit

    yield app


@pytest.fixture()
def client(app_with_stubbed_agent):
    return TestClient(app_with_stubbed_agent)


class TestSessionCookieBinding:
    def test_chat_sets_session_cookie(self, client):
        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})
        assert resp.status_code == 200, resp.text
        cookie = resp.cookies.get("brc_assistant_session")
        assert cookie, "expected brc_assistant_session cookie to be set"
        # Cookie should be the HMAC of the session_id, not the raw id.
        assert cookie == sign_session_id("sess-abc", SECRET)

    def test_get_session_without_cookie_is_forbidden(self, client):
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_get_session_with_valid_cookie_succeeds(self, client):
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 200, resp.text

    def test_get_session_with_wrong_signature_is_forbidden(self, client):
        # signature for a different session_id
        client.cookies.set(
            "brc_assistant_session", sign_session_id("other-session", SECRET)
        )
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_delete_session_without_cookie_is_forbidden(self, client):
        resp = client.delete("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_delete_session_with_valid_cookie_succeeds(self, client):
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))
        resp = client.delete("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 204

    def test_logout_clears_assistant_session_cookie(self, client):
        # A shared browser must not keep the prior user's assistant session
        # reachable after logout -- the restore/delete endpoints gate purely
        # on possession of this cookie.
        # Key the override on the reference the route actually captured at
        # import (monkeypatching app.core.dependencies doesn't rebind it).
        from app.api.v1 import auth as auth_module

        fake_auth = MagicMock()
        fake_auth.revoke_session_tokens = AsyncMock()
        client.app.dependency_overrides[auth_module.get_auth_service] = (
            lambda: fake_auth
        )

        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 200, resp.text
        cleared = [
            h
            for h in resp.headers.get_list("set-cookie")
            if h.startswith("brc_assistant_session=") and "Max-Age=0" in h
        ]
        assert cleared, resp.headers.get_list("set-cookie")


class TestAnonymousSessionClaim:
    """When an authenticated user continues a session started anonymously,
    /chat should claim it on their behalf (gated on cookie possession)."""

    def _override_user(self, app, sub):
        from app.core.dependencies import get_optional_current_user

        async def _current_user():
            return UserMeResponse(sub=sub)

        app.dependency_overrides[get_optional_current_user] = _current_user

    def test_authenticated_chat_claims_anonymous_session(
        self, app_with_stubbed_agent, client
    ):
        agent = app_with_stubbed_agent.dependency_overrides[
            __import__(
                "app.core.dependencies", fromlist=["get_assistant_agent"]
            ).get_assistant_agent
        ]()
        agent.session_service.claim_session = AsyncMock(
            return_value=SessionState(
                session_id="sess-abc", owner_keycloak_sub="user-a"
            )
        )
        self._override_user(app_with_stubbed_agent, "user-a")
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 200, resp.text
        agent.session_service.claim_session.assert_awaited_once_with(
            "sess-abc", "user-a"
        )

    def test_authenticated_chat_without_cookie_is_rejected(
        self, app_with_stubbed_agent, client
    ):
        self._override_user(app_with_stubbed_agent, "user-a")
        # No cookie set -- claim attempt should fail at the cookie check.
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )
        assert resp.status_code == 403

    def test_authenticated_chat_rejects_claim_when_owned_by_other_user(
        self, app_with_stubbed_agent, client
    ):
        agent = app_with_stubbed_agent.dependency_overrides[
            __import__(
                "app.core.dependencies", fromlist=["get_assistant_agent"]
            ).get_assistant_agent
        ]()
        agent.session_service.claim_session = AsyncMock(
            side_effect=PermissionError("sess-abc")
        )
        self._override_user(app_with_stubbed_agent, "user-b")
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 403
        assert "another user" in resp.json()["detail"]

    def test_chat_maps_permission_error_to_403(self, app_with_stubbed_agent, client):
        # An anonymous caller citing a session owned by someone else skips the
        # claim block and hits agent.chat(), which raises PermissionError from
        # require_session(). That must surface as 403, not the generic 503.
        agent = app_with_stubbed_agent.dependency_overrides[
            __import__(
                "app.core.dependencies", fromlist=["get_assistant_agent"]
            ).get_assistant_agent
        ]()
        agent.chat = AsyncMock(side_effect=PermissionError("sess-abc"))

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 403
        assert "another user" in resp.json()["detail"]

    def test_anonymous_chat_does_not_attempt_claim(
        self, app_with_stubbed_agent, client
    ):
        agent = app_with_stubbed_agent.dependency_overrides[
            __import__(
                "app.core.dependencies", fromlist=["get_assistant_agent"]
            ).get_assistant_agent
        ]()
        agent.session_service.claim_session = AsyncMock()
        # No authenticated-user override -- caller is anonymous.

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 200, resp.text
        agent.session_service.claim_session.assert_not_awaited()
