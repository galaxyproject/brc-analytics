"""Integration tests for assistant session-cookie binding."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from app.core.session_signing import sign_session_id
from app.models.assistant import SessionState
from app.models.user_data import UserMeResponse
from tests.conftest import SECRET


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

    def test_anonymous_chat_with_session_id_requires_cookie(self, client):
        # Continuing a session by id must require the signed cookie even for
        # anonymous callers -- session ids leak via URLs (assistantSessionId).
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )
        assert resp.status_code == 403

    def test_anonymous_chat_with_session_id_and_valid_cookie_succeeds(self, client):
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )
        assert resp.status_code == 200, resp.text


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

    def _agent(self, app):
        from app.core.dependencies import get_assistant_agent

        return app.dependency_overrides[get_assistant_agent]()

    def test_chat_maps_a_failed_agent_run_to_500_not_503(
        self, app_with_stubbed_agent, client
    ):
        # pydantic-ai raises UnexpectedModelBehavior -- an AgentRunError, which
        # subclasses RuntimeError -- when a tool exhausts its retries. That is one
        # broken turn, not an outage, and 503 told every user the assistant was
        # down and to come back later. Seen in production on a malformed
        # query_catalog facet call.
        from pydantic_ai.exceptions import UnexpectedModelBehavior

        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(
            side_effect=UnexpectedModelBehavior(
                "Tool 'query_catalog' exceeded max retries count of 1"
            )
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 500
        assert "could not complete" in resp.json()["detail"]

    def test_chat_preserves_upstream_throttling_as_429(
        self, app_with_stubbed_agent, client
    ):
        # A provider 429 is transient and the client already words it properly.
        # Flattening it to 500 would lose that for users and for alerting.
        from pydantic_ai.exceptions import ModelHTTPError

        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(
            side_effect=ModelHTTPError(status_code=429, model_name="m", body=None)
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 429

    def test_chat_maps_an_upstream_outage_to_503(self, app_with_stubbed_agent, client):
        from pydantic_ai.exceptions import ModelHTTPError

        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(
            side_effect=ModelHTTPError(status_code=529, model_name="m", body=None)
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 503

    def test_chat_maps_a_usage_cap_to_429(self, app_with_stubbed_agent, client):
        from pydantic_ai.exceptions import UsageLimitExceeded

        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(side_effect=UsageLimitExceeded("cap"))

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 429

    def test_chat_still_maps_an_unconfigured_agent_to_503(
        self, app_with_stubbed_agent, client
    ):
        # The one error we raise on purpose does mean unavailable.
        from app.services.assistant_agent import AssistantUnavailableError

        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(
            side_effect=AssistantUnavailableError("no key")
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 503

    def test_chat_does_not_leak_an_unrelated_runtime_error(
        self, app_with_stubbed_agent, client
    ):
        # A bare RuntimeError is a bug, not an outage, and its message can name
        # internal config. It must not reach the client as a 503 with details.
        agent = self._agent(app_with_stubbed_agent)
        agent.chat = AsyncMock(
            side_effect=RuntimeError("REDIS_URL=redis://secret")
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 500
        assert "secret" not in resp.text

    def test_chat_maps_permission_error_to_403(self, app_with_stubbed_agent, client):
        # An anonymous caller holding the session cookie but citing a session
        # owned by someone else skips the claim block and hits agent.chat(),
        # which raises PermissionError from require_session(). That must
        # surface as 403, not the generic 503.
        agent = app_with_stubbed_agent.dependency_overrides[
            __import__(
                "app.core.dependencies", fromlist=["get_assistant_agent"]
            ).get_assistant_agent
        ]()
        agent.chat = AsyncMock(side_effect=PermissionError("sess-abc"))
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))

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
        # No authenticated-user override -- caller is anonymous. Continuing a
        # session still requires the cookie, but an anonymous caller never
        # triggers a claim.
        client.cookies.set("brc_assistant_session", sign_session_id("sess-abc", SECRET))

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 200, resp.text
        agent.session_service.claim_session.assert_not_awaited()
