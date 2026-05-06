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
    monkeypatch.setattr(
        dependencies, "get_llm_service", MagicMock(return_value=MagicMock())
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
