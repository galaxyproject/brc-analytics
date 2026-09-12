import asyncio
import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.models.assistant import (
    AnalysisSchema,
    ChatMessage,
    MessageRole,
    SchemaField,
    SessionState,
)
from app.services import analysis_store


@pytest.fixture(autouse=True)
def _database_configured(monkeypatch):
    """Every test below exercises the write path, which needs DATABASE_URL
    set -- except test_returns_early_when_database_is_not_configured, which
    replaces get_settings entirely and so is unaffected by this env var."""
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")


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
async def test_returns_early_when_database_is_not_configured():
    """A deployment can run OIDC-authenticated chat with DATABASE_URL unset --
    get_optional_current_user only checks the JWT. record() must not attempt
    a write in that case, or every authenticated turn logs an exception and
    fires Sentry even though the write is fail-open."""
    settings = SimpleNamespace(DATABASE_URL="")

    with (
        patch.object(analysis_store, "get_settings", return_value=settings),
        patch.object(analysis_store, "db_session") as db,
        patch.object(analysis_store, "sentry_sdk") as sentry,
    ):
        await analysis_store.record(_state())

    db.assert_not_called()
    sentry.capture_exception.assert_not_called()


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
async def test_a_missing_user_row_is_reported_rather_than_shrugged_off(caplog):
    """A valid session whose users row is gone -- a DB restore, a manual
    cleanup -- used to return None from the same branch as an empty
    conversation: no log, no Sentry event, and nothing kept for that user on
    any turn, forever."""
    with (
        patch.object(
            analysis_store, "get_user_id_by_keycloak_sub", AsyncMock(return_value=None)
        ),
        patch.object(analysis_store, "upsert_saved_analysis", AsyncMock()) as upsert,
        patch.object(analysis_store, "db_session"),
        patch.object(analysis_store, "sentry_sdk") as sentry,
        caplog.at_level(logging.ERROR),
    ):
        saved_analysis_id = await analysis_store.record(_state())

    # Still fail-open: the turn's reply is never at risk.
    assert saved_analysis_id is None
    upsert.assert_not_called()
    sentry.capture_exception.assert_called_once()
    assert any(record.levelno >= logging.ERROR for record in caplog.records)


@pytest.mark.asyncio
async def test_persist_surfaces_a_missing_user_row_to_its_caller():
    """persist() reports what record() swallows, and the endpoint needs to
    tell this apart from an empty conversation -- the two answered alike."""
    with (
        patch.object(
            analysis_store, "get_user_id_by_keycloak_sub", AsyncMock(return_value=None)
        ),
        patch.object(analysis_store, "db_session"),
    ):
        with pytest.raises(analysis_store.UnprovisionedUserError):
            await analysis_store.persist(_state())


@pytest.mark.asyncio
async def test_titles_from_the_first_user_message():
    captured = {}

    async def fake_upsert(session, user, **kwargs):
        captured.update(kwargs)

    with (
        patch.object(analysis_store, "upsert_saved_analysis", fake_upsert),
        patch.object(analysis_store, "get_user_id_by_keycloak_sub", AsyncMock()),
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
        patch.object(analysis_store, "get_user_id_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
    ):
        await analysis_store.record(state)

    assert len(captured["title"]) == 80


@pytest.mark.asyncio
async def test_nul_bytes_are_scrubbed_on_every_persisted_field():
    """Postgres rejects NUL in text/jsonb, and a user can paste one into the
    chat box. state.messages is rewritten in full on every turn, so one
    unscrubbed NUL would poison every future auto-save for this conversation,
    not just the turn it arrived on. strip_nuls is exercised elsewhere only
    through turn_log -- pin that it applies here too, on all four fields."""
    captured = {}

    async def fake_upsert(session, user, **kwargs):
        captured.update(kwargs)

    state = _state(
        agent_message_history=[{"role": "assistant", "content": "tool\x00output"}],
        messages=[
            ChatMessage(
                content="Find me a Plasmodium\x00 assembly", role=MessageRole.USER
            ),
        ],
        schema_state=AnalysisSchema(
            organism=SchemaField(value="Plasmodium\x00 falciparum")
        ),
    )

    with (
        patch.object(analysis_store, "upsert_saved_analysis", fake_upsert),
        patch.object(analysis_store, "get_user_id_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
    ):
        await analysis_store.record(state)

    assert "\x00" not in captured["title"]
    assert captured["title"] == "Find me a Plasmodium assembly"
    assert all("\x00" not in message["content"] for message in captured["messages"])
    assert all(
        "\x00" not in entry["content"] for entry in captured["agent_message_history"]
    )
    assert "\x00" not in captured["schema"]["organism"]["value"]


@pytest.mark.asyncio
async def test_a_write_failure_never_propagates(caplog):
    """Losing an auto-save must not cost the user their reply -- but must be
    reported, or a broken writer looks exactly like a quiet feature."""

    async def boom(*args, **kwargs):
        raise RuntimeError("db down")

    with (
        patch.object(analysis_store, "upsert_saved_analysis", boom),
        patch.object(analysis_store, "get_user_id_by_keycloak_sub", AsyncMock()),
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

    settings = SimpleNamespace(
        ASSISTANT_AUTOSAVE_TIMEOUT_SECONDS=0.01, DATABASE_URL="postgresql://fake"
    )

    with (
        patch.object(analysis_store, "upsert_saved_analysis", never_finishes),
        patch.object(analysis_store, "get_user_id_by_keycloak_sub", AsyncMock()),
        patch.object(analysis_store, "db_session"),
        patch.object(analysis_store, "get_settings", return_value=settings),
        patch.object(analysis_store, "sentry_sdk") as sentry,
    ):
        await analysis_store.record(_state())

    sentry.capture_message.assert_called_once()
