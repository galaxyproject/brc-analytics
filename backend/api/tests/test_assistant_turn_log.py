"""Durable per-turn assistant logging (#1294).

The load-bearing property is that logging never costs a user their reply: a
missing DB, a broken write, or a stalled write all have to fall through to a
normal 200.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.crud import (
    create_assistant_turn_log,
    purge_assistant_turn_logs_before,
    upsert_user_from_claims,
)
from app.db.models import AssistantTurnLog, Base

# app_with_stubbed_agent / client come from tests/conftest.py.


async def _create_session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def _turn_kwargs(**overrides):
    kwargs = dict(
        session_id="sess-abc",
        turn_index=0,
        user_id=None,
        user_message="what assemblies exist for P. falciparum?",
        assistant_reply="Here are the assemblies...",
        transcript=[{"kind": "request", "parts": []}],
        schema_state={"organism": {"value": "P. falciparum"}},
        input_tokens=120,
        output_tokens=45,
        total_tokens=165,
        requests=2,
        tool_calls=1,
        latency_ms=3400,
        model="claude-sonnet-4-6",
        provider="anthropic",
    )
    kwargs.update(overrides)
    return kwargs


@pytest.mark.asyncio
async def test_turn_log_round_trip_records_transcript_and_usage():
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        row = await create_assistant_turn_log(session, **_turn_kwargs())

        assert row.session_id == "sess-abc"
        assert row.user_id is None
        assert row.transcript == [{"kind": "request", "parts": []}]
        assert row.schema_state == {"organism": {"value": "P. falciparum"}}
        assert row.total_tokens == 165
        assert row.tool_calls == 1
        assert row.latency_ms == 3400
        assert row.provider == "anthropic"


@pytest.mark.asyncio
async def test_anonymous_turn_stores_null_user_but_keeps_session_grouping():
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        for index in range(3):
            await create_assistant_turn_log(session, **_turn_kwargs(turn_index=index))

        result = await session.execute(
            select(AssistantTurnLog)
            .where(AssistantTurnLog.session_id == "sess-abc")
            .order_by(AssistantTurnLog.turn_index)
        )
        rows = list(result.scalars().all())

        assert [r.turn_index for r in rows] == [0, 1, 2]
        assert all(r.user_id is None for r in rows)


@pytest.mark.asyncio
async def test_authenticated_turn_is_attributed_to_the_user():
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        user = await upsert_user_from_claims(session, {"sub": "kc-777"})

        row = await create_assistant_turn_log(session, **_turn_kwargs(user_id=user.id))

        assert row.user_id == user.id


@pytest.mark.asyncio
async def test_purge_deletes_only_rows_past_the_cutoff():
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        old = AssistantTurnLog(
            id=uuid.uuid4(),
            created_at=datetime.now(timezone.utc) - timedelta(days=120),
            **{
                k: v
                for k, v in _turn_kwargs(session_id="sess-old").items()
                if k != "user_id"
            },
        )
        recent = AssistantTurnLog(
            id=uuid.uuid4(),
            created_at=datetime.now(timezone.utc) - timedelta(days=5),
            **{
                k: v
                for k, v in _turn_kwargs(session_id="sess-recent").items()
                if k != "user_id"
            },
        )
        session.add_all([old, recent])
        await session.commit()

        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        deleted = await purge_assistant_turn_logs_before(session, cutoff)

        assert deleted == 1
        remaining = await session.execute(select(AssistantTurnLog.session_id))
        assert list(remaining.scalars().all()) == ["sess-recent"]


class TestChatEndpointLogging:
    """The endpoint-side guarantees: log when we can, never break the turn."""

    def _agent(self, app):
        from app.core.dependencies import get_assistant_agent

        return app.dependency_overrides[get_assistant_agent]()

    def test_turn_is_logged_when_the_database_is_configured(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        from app.api.v1 import assistant as assistant_module

        recorded = {}

        async def fake_write(agent, telemetry, settings):
            recorded["session_id"] = telemetry.session_id
            recorded["user_message"] = telemetry.user_message
            recorded["assistant_reply"] = telemetry.assistant_reply

        monkeypatch.setattr(assistant_module, "_write_turn_log", fake_write)
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        from app.core.config import get_settings

        get_settings.cache_clear()

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert recorded["session_id"] == "sess-abc"
        assert recorded["assistant_reply"] == "hi"

    def test_chat_succeeds_when_no_database_is_configured(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The default docker-compose stack runs without DATABASE_URL. Wiring
        # the write as a FastAPI dependency would 500 every chat there, since
        # get_db_session() raises before the handler body runs.
        monkeypatch.delenv("DATABASE_URL", raising=False)
        from app.core.config import get_settings

        get_settings.cache_clear()

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert resp.json()["reply"] == "hi"

    def test_chat_still_returns_the_reply_when_the_log_write_raises(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        from app.api.v1 import assistant as assistant_module

        async def boom(agent, telemetry, settings):
            raise RuntimeError("database is on fire")

        monkeypatch.setattr(assistant_module, "_write_turn_log", boom)
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        from app.core.config import get_settings

        get_settings.cache_clear()

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert resp.json()["reply"] == "hi"

    def test_a_stalled_log_write_does_not_hang_the_reply(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        import asyncio

        from app.api.v1 import assistant as assistant_module

        async def never_finishes(agent, telemetry, settings):
            await asyncio.sleep(60)

        monkeypatch.setattr(assistant_module, "_write_turn_log", never_finishes)
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOG_TIMEOUT_SECONDS", "0.05")
        from app.core.config import get_settings

        get_settings.cache_clear()

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert resp.json()["reply"] == "hi"

    def test_logging_can_be_switched_off_without_touching_the_database(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        from app.api.v1 import assistant as assistant_module

        called = False

        async def fake_write(agent, telemetry, settings):
            nonlocal called
            called = True

        monkeypatch.setattr(assistant_module, "_write_turn_log", fake_write)
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOGGING_ENABLED", "false")
        from app.core.config import get_settings

        get_settings.cache_clear()

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert called is False


def _stub_agent():
    """Minimal AssistantAgent, no Redis/LLM -- mirrors tests/test_assistant_agent.py."""
    from app.services.assistant_agent import AssistantAgent

    instance = object.__new__(AssistantAgent)
    instance.catalog = MagicMock()
    instance.catalog.workflows_by_category = []
    instance.sra_mirror = None
    instance.query_con = None
    instance.agent = object()
    return instance


def _fake_run_result(new_messages):
    return SimpleNamespace(
        output="Ready to go.",
        usage=lambda: SimpleNamespace(
            input_tokens=10,
            output_tokens=5,
            requests=1,
            tool_calls=2,
            total_tokens=15,
        ),
        all_messages=lambda: [],
        new_messages=lambda: new_messages,
    )


@pytest.mark.asyncio
async def test_chat_with_telemetry_reports_usage_latency_and_this_turns_messages():
    from app.models.assistant import AnalysisSchema, SessionState

    agent = _stub_agent()
    state = SessionState(session_id="s1", schema_state=AnalysisSchema(), messages=[])
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(return_value=state),
        require_session=AsyncMock(return_value=state),
        save_session=AsyncMock(),
    )
    agent._run_agent_with_retry = AsyncMock(
        return_value=_fake_run_result([{"kind": "response", "parts": ["tool call"]}])
    )
    agent._extract_state = AsyncMock(return_value=({}, None))

    response, telemetry = await agent.chat_with_telemetry("hello")

    assert response.reply == "Ready to go."
    # The transcript is observability-only and must not ride the response.
    assert "transcript" not in response.model_dump()
    assert telemetry.session_id == "s1"
    assert telemetry.user_message == "hello"
    assert telemetry.assistant_reply == "Ready to go."
    assert telemetry.transcript == [{"kind": "response", "parts": ["tool call"]}]
    assert telemetry.token_usage.total_tokens == 15
    assert telemetry.token_usage.tool_calls == 2
    assert telemetry.latency_ms >= 0


@pytest.mark.asyncio
async def test_turn_index_increments_across_turns_in_a_session():
    from app.models.assistant import AnalysisSchema, SessionState

    agent = _stub_agent()
    state = SessionState(session_id="s1", schema_state=AnalysisSchema(), messages=[])
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(return_value=state),
        require_session=AsyncMock(return_value=state),
        save_session=AsyncMock(),
    )
    agent._run_agent_with_retry = AsyncMock(return_value=_fake_run_result([]))
    agent._extract_state = AsyncMock(return_value=({}, None))

    _, first = await agent.chat_with_telemetry("one")
    _, second = await agent.chat_with_telemetry("two", session_id="s1")
    _, third = await agent.chat_with_telemetry("three", session_id="s1")

    assert [first.turn_index, second.turn_index, third.turn_index] == [0, 1, 2]


@pytest.mark.asyncio
async def test_chat_still_returns_a_reply_when_the_transcript_cannot_serialize():
    """A telemetry problem must not cost the user their answer."""
    from app.models.assistant import AnalysisSchema, SessionState

    class Unserializable:
        pass

    agent = _stub_agent()
    state = SessionState(session_id="s1", schema_state=AnalysisSchema(), messages=[])
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(return_value=state),
        require_session=AsyncMock(return_value=state),
        save_session=AsyncMock(),
    )
    agent._run_agent_with_retry = AsyncMock(
        return_value=_fake_run_result(Unserializable())
    )
    agent._extract_state = AsyncMock(return_value=({}, None))

    response, telemetry = await agent.chat_with_telemetry("hello")

    assert response.reply == "Ready to go."
    assert telemetry.transcript == []
