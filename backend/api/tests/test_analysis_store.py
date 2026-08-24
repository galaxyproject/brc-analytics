import asyncio
import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.models.assistant import AnalysisSchema, ChatMessage, MessageRole, SessionState
from app.services import analysis_store


def _state(**overrides) -> SessionState:
    defaults = {
        "messages": [
            ChatMessage(content="Find me a Plasmodium assembly", role=MessageRole.USER),
            ChatMessage(content="Sure.", role=MessageRole.ASSISTANT),
        ],
        "owner_keycloak_sub": "sub-1",
        "schema_state": AnalysisSchema(),
        "session_id": "sess-1",
    }
    defaults.update(overrides)
    return SessionState(**defaults)


@pytest.mark.asyncio
async def test_skips_anonymous_sessions():
    with patch.object(analysis_store, "db_session") as db:
        await analysis_store.record(_state(owner_keycloak_sub=None))
    db.assert_not_called()


@pytest.mark.asyncio
async def test_skips_sessions_with_no_user_turn():
    with patch.object(analysis_store, "db_session") as db:
        await analysis_store.record(_state(messages=[]))
    db.assert_not_called()


@pytest.mark.asyncio
async def test_titles_from_the_first_user_message():
    captured = {}

    async def fake_upsert(session, user, **kwargs):
        captured.update(kwargs)

    with (
        patch.object(analysis_store, "upsert_saved_analysis", fake_upsert),
        patch.object(analysis_store, "get_user_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
    ):
        await analysis_store.record(_state())

    assert captured["title"] == "Find me a Plasmodium assembly"
    assert captured["source_session"] == "sess-1"


@pytest.mark.asyncio
async def test_truncates_a_long_title():
    long_message = "x" * 200
    captured = {}

    async def fake_upsert(session, user, **kwargs):
        captured.update(kwargs)

    state = _state(messages=[ChatMessage(content=long_message, role=MessageRole.USER)])

    with (
        patch.object(analysis_store, "upsert_saved_analysis", fake_upsert),
        patch.object(analysis_store, "get_user_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
    ):
        await analysis_store.record(state)

    assert len(captured["title"]) == 80


@pytest.mark.asyncio
async def test_a_write_failure_never_propagates(caplog):
    """Losing an auto-save must not cost the user their reply -- but must be
    reported, or a broken writer looks exactly like a quiet feature."""

    async def boom(*args, **kwargs):
        raise RuntimeError("db down")

    with (
        patch.object(analysis_store, "upsert_saved_analysis", boom),
        patch.object(analysis_store, "get_user_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
        patch.object(analysis_store, "sentry_sdk") as sentry,
        caplog.at_level(logging.ERROR, logger=analysis_store.__name__),
    ):
        await analysis_store.record(_state())

    sentry.capture_exception.assert_called_once()
    assert any(record.levelno >= logging.ERROR for record in caplog.records)


@pytest.mark.asyncio
async def test_a_malformed_state_never_propagates(caplog):
    """record() dereferences its argument only inside the protected region."""

    class BrokenState:
        owner_keycloak_sub = "sub-1"
        session_id = "sess-broken"

        @property
        def messages(self):
            raise RuntimeError("session state is malformed")

    with (
        patch.object(analysis_store, "db_session") as db,
        patch.object(analysis_store, "sentry_sdk") as sentry,
        caplog.at_level(logging.ERROR, logger=analysis_store.__name__),
    ):
        await analysis_store.record(BrokenState())

    db.assert_not_called()
    sentry.capture_exception.assert_called_once()


@pytest.mark.asyncio
async def test_a_slow_write_is_abandoned_not_awaited():
    """An unbounded hang would delay a reply the user has already earned."""

    async def never_finishes(*args, **kwargs):
        await asyncio.sleep(10)

    settings = SimpleNamespace(ASSISTANT_AUTOSAVE_TIMEOUT_SECONDS=0.01)

    with (
        patch.object(analysis_store, "upsert_saved_analysis", never_finishes),
        patch.object(analysis_store, "get_user_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
        patch.object(analysis_store, "get_settings", return_value=settings),
        patch.object(analysis_store, "sentry_sdk") as sentry,
    ):
        await analysis_store.record(_state())

    sentry.capture_message.assert_called_once()
