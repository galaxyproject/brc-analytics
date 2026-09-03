"""Shared fixtures for the assistant API tests.

The stubbed-app fixtures live here rather than in a test module so more than
one test file can build on them without importing fixtures across modules.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.models.assistant import (
    AnalysisSchema,
    ChatResponse,
    SessionState,
    TurnTelemetry,
)
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS

SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaa"


@pytest.fixture(autouse=True)
def _fresh_settings():
    """Settings are lru_cached, so monkeypatched env leaks between tests."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def app_with_stubbed_agent(tmp_path, monkeypatch):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("SESSION_COOKIE_SECRET", SECRET)
    monkeypatch.setenv("AI_API_KEY", "stub")

    fake_cache = MagicMock()
    fake_cache.clear_caches = AsyncMock(return_value=0)
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
    stub_turn = (
        ChatResponse(
            session_id="sess-abc",
            reply="hi",
            schema_state=AnalysisSchema(),
        ),
        TurnTelemetry(
            session_id="sess-abc",
            user_message="hello",
            assistant_reply="hi",
        ),
        # The state the turn left behind, which the agent hands back rather
        # than making the endpoint re-read it.
        SessionState(session_id="sess-abc"),
    )

    # Recording lives in the agent now, so the stub has to honour the sink.
    async def _chat_with_telemetry(*args, on_turn=None, **kwargs):
        if on_turn is not None:
            await on_turn(stub_turn[1])
        return stub_turn

    fake_agent.chat_with_telemetry = AsyncMock(side_effect=_chat_with_telemetry)
    fake_agent.session_service = MagicMock()
    fake_agent.session_service.get_session = AsyncMock(
        return_value=SessionState(session_id="sess-abc")
    )
    fake_agent.session_service.delete_session = AsyncMock(return_value=True)
    fake_agent.compute_handoff = MagicMock(return_value=(False, None))
    # restore_session reconciles persisted state before handoff and re-derives
    # suggestions from it; stub both so the endpoint returns the real schema and a
    # concrete suggestions list, not MagicMocks.
    fake_agent.reconcile_schema = MagicMock(side_effect=lambda schema: schema)
    fake_agent._derive_suggestions = MagicMock(return_value=[])

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
