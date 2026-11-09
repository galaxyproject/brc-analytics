"""Integration tests for binding assistant sessions to the browser."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from app.core.dependencies import get_assistant_agent
from app.core.session_signing import browser_cookie_name, sign_browser_id
from app.models.assistant import ChatMessage, MessageRole, SessionState
from app.models.user_data import UserMeResponse
from tests.conftest import TEST_BROWSER, bind_browser


def _agent(client):
    """The stubbed assistant agent the app was given."""
    return client.app.dependency_overrides[get_assistant_agent]()


def _cleared(resp, name: str) -> bool:
    """Whether the response expires the named cookie."""
    return any(
        h.startswith(f"{name}=") and "Max-Age=0" in h
        for h in resp.headers.get_list("set-cookie")
    )


class TestSessionBrowserBinding:
    def test_chat_issues_a_browser_cookie_and_binds_the_session(self, client):
        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})
        assert resp.status_code == 200, resp.text
        browser_id = resp.cookies.get(browser_cookie_name())
        assert browser_id, "expected a browser id cookie"
        # Redis holds an HMAC of the id, never the id itself.
        assert ("sess-abc", sign_browser_id(browser_id)) in _agent(
            client
        ).session_service.bindings

    def test_a_late_response_keeps_the_browser_id_it_was_sent(self, client):
        # The cookie is only ever refreshed: a response landing late, for a
        # conversation the user has left, carries the same id and so can't
        # unbind the conversation on screen.
        bind_browser(client)
        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})
        assert resp.cookies.get(browser_cookie_name()) == TEST_BROWSER
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 200, resp.text

    def test_get_session_without_cookie_is_forbidden(self, client):
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_get_session_from_the_bound_browser_succeeds(self, client):
        bind_browser(client)
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 200, resp.text

    def test_get_session_from_another_browser_is_forbidden(self, client):
        client.cookies.set(browser_cookie_name(), "another-browser")
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_an_unbound_caller_cannot_tell_a_live_session_from_a_gone_one(self, client):
        resp = client.get("/api/v1/assistant/session/no-such-session")
        assert resp.status_code == 403

    def test_get_expired_session_from_the_bound_browser_is_not_found(self, client):
        _agent(client).session_service.get_session.return_value = None
        bind_browser(client)
        resp = client.get("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 404

    def test_delete_session_without_cookie_is_forbidden(self, client):
        resp = client.delete("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 403

    def test_delete_session_from_the_bound_browser_succeeds(self, client):
        bind_browser(client)
        resp = client.delete("/api/v1/assistant/session/sess-abc")
        assert resp.status_code == 204

    def test_logout_clears_the_browser_cookie(self, client):
        # A shared browser must not keep the prior user's assistant sessions
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

        bind_browser(client)
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 200, resp.text
        assert _cleared(resp, browser_cookie_name()), resp.headers.get_list(
            "set-cookie"
        )

    def test_anonymous_chat_with_session_id_requires_cookie(self, client):
        # Continuing a session by id must require the bound browser even for
        # anonymous callers -- session ids leak via URLs (assistantSessionId).
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )
        assert resp.status_code == 403

    def test_anonymous_chat_with_session_id_from_the_bound_browser_succeeds(
        self, client
    ):
        bind_browser(client)
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
        bind_browser(client)

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
        bind_browser(client)

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
        agent.chat_with_telemetry = AsyncMock(
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
        agent.chat_with_telemetry = AsyncMock(
            side_effect=ModelHTTPError(status_code=429, model_name="m", body=None)
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 429

    def test_chat_maps_an_upstream_outage_to_503(self, app_with_stubbed_agent, client):
        from pydantic_ai.exceptions import ModelHTTPError

        agent = self._agent(app_with_stubbed_agent)
        agent.chat_with_telemetry = AsyncMock(
            side_effect=ModelHTTPError(status_code=529, model_name="m", body=None)
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 503

    def test_chat_maps_a_usage_cap_to_429(self, app_with_stubbed_agent, client):
        from pydantic_ai.exceptions import UsageLimitExceeded

        agent = self._agent(app_with_stubbed_agent)
        agent.chat_with_telemetry = AsyncMock(side_effect=UsageLimitExceeded("cap"))

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 429

    def test_chat_still_maps_an_unconfigured_agent_to_503(
        self, app_with_stubbed_agent, client
    ):
        # The one error we raise on purpose does mean unavailable.
        from app.services.assistant_agent import AssistantUnavailableError

        agent = self._agent(app_with_stubbed_agent)
        agent.chat_with_telemetry = AsyncMock(
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
        agent.chat_with_telemetry = AsyncMock(
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
        agent.chat_with_telemetry = AsyncMock(side_effect=PermissionError("sess-abc"))
        bind_browser(client)

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
        bind_browser(client)

        resp = client.post(
            "/api/v1/assistant/chat",
            json={"message": "hello", "session_id": "sess-abc"},
        )

        assert resp.status_code == 200, resp.text
        agent.session_service.claim_session.assert_not_awaited()


LOGAN_JOB = "fe6f66a714dcbec8"


def _logan_agent(app):
    from app.core.dependencies import get_assistant_agent

    return app.dependency_overrides[get_assistant_agent]()


class TestCreateLoganSession:
    def test_creates_and_sets_cookie(self, client, app_with_stubbed_agent):
        from app.models.assistant import ChatMessage, MessageRole, SuggestionChip

        agent = _logan_agent(app_with_stubbed_agent)
        state = SessionState(
            session_id="sess-logan",
            messages=[
                ChatMessage(role=MessageRole.ASSISTANT, content="This Logan search ...")
            ],
            suggestions=[
                SuggestionChip(
                    label="What is this cohort?", message="What is this cohort?"
                )
            ],
            metadata={"logan": {"job_id": LOGAN_JOB}},
        )
        agent.create_logan_session = AsyncMock(return_value=state)
        agent.reconcile_schema = lambda s: s
        agent._derive_suggestions = lambda s, logan=None: state.suggestions

        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})

        assert r.status_code == 200, r.text
        body = r.json()
        assert body["session_id"] == "sess-logan"
        assert body["messages"][0]["role"] == "assistant"
        assert body["suggestions"][0]["label"] == "What is this cohort?"
        browser_id = r.cookies.get(browser_cookie_name())
        assert browser_id, r.headers.get("set-cookie")
        # The new session is bound to this browser before it is handed back.
        assert ("sess-logan", sign_browser_id(browser_id)) in _agent(
            client
        ).session_service.bindings
        agent.create_logan_session.assert_awaited_once_with(LOGAN_JOB, None)

    def test_invalid_job_id_is_422(self, client):
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": "nope"})
        assert r.status_code == 422

    def test_not_found(self, client, app_with_stubbed_agent):
        from app.services.assistant_agent import LoganJobNotFoundError

        agent = _logan_agent(app_with_stubbed_agent)
        agent.create_logan_session = AsyncMock(
            side_effect=LoganJobNotFoundError(LOGAN_JOB, "gone")
        )
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})
        assert r.status_code == 404
        assert r.json()["detail"]["code"] == "logan_job_not_found"
        assert r.json()["detail"]["results_url"] == f"/logan-search?job={LOGAN_JOB}"

    def test_not_ready(self, client, app_with_stubbed_agent):
        from app.services.assistant_agent import LoganJobNotReadyError

        agent = _logan_agent(app_with_stubbed_agent)
        agent.create_logan_session = AsyncMock(
            side_effect=LoganJobNotReadyError(LOGAN_JOB, "running")
        )
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})
        assert r.status_code == 409
        assert r.json()["detail"]["code"] == "logan_job_not_ready"

    def test_failed_job(self, client, app_with_stubbed_agent):
        from app.services.assistant_agent import LoganJobFailedError

        agent = _logan_agent(app_with_stubbed_agent)
        agent.create_logan_session = AsyncMock(
            side_effect=LoganJobFailedError(LOGAN_JOB, "error")
        )
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})
        assert r.status_code == 422
        assert r.json()["detail"]["code"] == "logan_job_failed"

    def test_unconfigured(self, client, app_with_stubbed_agent):
        from app.services.assistant_agent import AssistantUnavailableError

        agent = _logan_agent(app_with_stubbed_agent)
        agent.create_logan_session = AsyncMock(
            side_effect=AssistantUnavailableError("no")
        )
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})
        assert r.status_code == 503

    def test_galaxy_outage_is_503_with_results_url(
        self, client, app_with_stubbed_agent
    ):
        agent = _logan_agent(app_with_stubbed_agent)
        agent.create_logan_session = AsyncMock(
            side_effect=RuntimeError("bioblend boom")
        )
        r = client.post("/api/v1/assistant/session", json={"logan_job_id": LOGAN_JOB})
        assert r.status_code == 503
        assert r.json()["detail"]["code"] == "logan_unavailable"


class TestSaveWithoutADatabase:
    """A deployment can have OIDC on and no DATABASE_URL: /chat authenticates
    on the JWT alone. The save endpoint has to answer that plainly rather than
    raising into a 503 the client will retry."""

    def test_save_is_not_implemented_without_a_database(
        self, app_with_stubbed_agent, client, caplog, monkeypatch
    ):
        from app.core.config import get_settings
        from app.core.dependencies import get_assistant_agent, get_current_user

        # Say so rather than inheriting it: CI runs this suite alongside a
        # Postgres container with DATABASE_URL exported, so a test that only
        # passes on a laptop without one is a test that passes by accident.
        monkeypatch.delenv("DATABASE_URL", raising=False)
        get_settings.cache_clear()

        agent = app_with_stubbed_agent.dependency_overrides[get_assistant_agent]()
        agent.session_service.claim_session = AsyncMock()

        async def _current_user():
            return UserMeResponse(sub="user-a")

        app_with_stubbed_agent.dependency_overrides[get_current_user] = _current_user
        bind_browser(client)

        resp = client.post("/api/v1/assistant/session/sess-abc/save")

        assert resp.status_code == 501
        # Nothing was claimed for a save that could never happen, and the
        # refusal is not an exception -- both of those were the spam.
        agent.session_service.claim_session.assert_not_awaited()
        assert not [record for record in caplog.records if record.exc_info]


class TestChatClearFields:
    """The setup panel's x clears a field on a /chat turn (#1796)."""

    def _agent(self, app):
        from app.core.dependencies import get_assistant_agent

        return app.dependency_overrides[get_assistant_agent]()

    def test_passes_clears_through(self, client, app_with_stubbed_agent):
        agent = self._agent(app_with_stubbed_agent)
        bind_browser(client)
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"clear_fields": ["organism"], "session_id": "sess-abc"},
        )
        assert resp.status_code == 200, resp.text
        args = agent.chat_with_telemetry.await_args
        assert args.args[0] is None
        assert args.kwargs["clear_fields"] == ["organism"]

    def test_message_alone_still_works(self, client, app_with_stubbed_agent):
        agent = self._agent(app_with_stubbed_agent)
        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})
        assert resp.status_code == 200, resp.text
        assert agent.chat_with_telemetry.await_args.kwargs["clear_fields"] == []

    def test_rejects_a_derived_field(self, client, app_with_stubbed_agent):
        agent = self._agent(app_with_stubbed_agent)
        resp = client.post(
            "/api/v1/assistant/chat",
            json={"clear_fields": ["gene_annotation"], "session_id": "sess-abc"},
        )
        assert resp.status_code == 422
        agent.chat_with_telemetry.assert_not_awaited()

    def test_rejects_an_empty_turn(self, client, app_with_stubbed_agent):
        agent = self._agent(app_with_stubbed_agent)
        resp = client.post("/api/v1/assistant/chat", json={})
        assert resp.status_code == 422
        agent.chat_with_telemetry.assert_not_awaited()

    def test_rejects_an_empty_message(self, client, app_with_stubbed_agent):
        resp = client.post("/api/v1/assistant/chat", json={"message": ""})
        assert resp.status_code == 422

    def test_rejects_a_clear_without_a_session(self, client, app_with_stubbed_agent):
        # A new session has nothing to clear; don't spend a turn finding out.
        agent = self._agent(app_with_stubbed_agent)
        resp = client.post(
            "/api/v1/assistant/chat", json={"clear_fields": ["organism"]}
        )
        assert resp.status_code == 422
        agent.chat_with_telemetry.assert_not_awaited()
