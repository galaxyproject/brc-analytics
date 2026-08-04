"""Durable per-turn assistant logging (#1294).

The load-bearing property is that logging never costs a user their reply: a
missing DB, a broken write, or a stalled write all have to fall through to a
normal 200.
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.crud import (
    create_assistant_turn_log,
    purge_assistant_turn_logs_before,
    upsert_user_from_claims,
)
from app.db.models import AssistantTurnLog, Base
from app.models.assistant import TurnOutcome

# app_with_stubbed_agent / client come from tests/conftest.py.


async def _create_session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def _turn_kwargs(**overrides):
    kwargs = dict(
        turn_id=uuid.uuid4(),
        session_id="sess-abc",
        turn_index=0,
        user_id=None,
        user_message="what assemblies exist for P. falciparum?",
        assistant_reply="Here are the assemblies...",
        outcome="success",
        error_kind=None,
        transcript=[{"kind": "request", "parts": []}],
        transcript_truncated=False,
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


@pytest.mark.asyncio
async def test_failed_turn_stores_the_prompt_without_a_reply():
    """Error rows are the point of logging errors -- keep the prompt."""
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        row = await create_assistant_turn_log(
            session,
            **_turn_kwargs(
                session_id=None,
                turn_index=None,
                assistant_reply=None,
                outcome="error",
                error_kind="AssistantTimeoutError",
                transcript=[],
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                requests=0,
                tool_calls=0,
            ),
        )

        assert row.outcome == "error"
        assert row.error_kind == "AssistantTimeoutError"
        assert row.assistant_reply is None
        # A turn that died before a session existed still records what was asked.
        assert row.session_id is None
        assert row.user_message.startswith("what assemblies")


@pytest.mark.asyncio
async def test_turn_id_is_unique():
    session_factory = await _create_session_factory()
    shared = uuid.uuid4()
    async with session_factory() as session:
        await create_assistant_turn_log(session, **_turn_kwargs(turn_id=shared))
        with pytest.raises(IntegrityError):
            await create_assistant_turn_log(session, **_turn_kwargs(turn_id=shared))


@pytest.mark.asyncio
async def test_concurrent_turns_sharing_an_index_both_persist():
    """turn_index is an ordering hint, not a unique key -- collisions must not
    cost us a row. Two concurrent requests on one session read the same
    counter from Redis before either saves."""
    session_factory = await _create_session_factory()
    async with session_factory() as session:
        await create_assistant_turn_log(session, **_turn_kwargs(turn_index=3))
        await create_assistant_turn_log(session, **_turn_kwargs(turn_index=3))

        result = await session.execute(
            select(AssistantTurnLog).where(AssistantTurnLog.turn_index == 3)
        )
        assert len(list(result.scalars().all())) == 2


class TestChatEndpointLogging:
    """Endpoint-side guarantees: schedule a log, never break the turn."""

    def _capture(self, monkeypatch):
        """Capture what the endpoint hands to the scheduler.

        The real write is detached, so asserting on its completion from a sync
        TestClient would race. Scheduling is what the endpoint is responsible
        for; persistence is covered by the _log_turn tests below.
        """
        from app.api.v1 import assistant as assistant_module

        captured = []
        monkeypatch.setattr(
            assistant_module,
            "_schedule_turn_log",
            lambda agent, telemetry: captured.append(telemetry),
        )
        return captured

    def test_successful_turn_is_scheduled_for_logging(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        captured = self._capture(monkeypatch)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert len(captured) == 1
        assert captured[0].session_id == "sess-abc"
        assert captured[0].assistant_reply == "hi"
        assert captured[0].outcome == TurnOutcome.SUCCESS

    def test_failed_turn_is_logged_with_the_prompt_and_error_kind(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The whole point of #1294 during a beta is seeing what breaks, so a
        # turn that raises must still leave a row carrying the prompt.
        from pydantic_ai.exceptions import ModelHTTPError

        captured = self._capture(monkeypatch)
        agent = self._agent(app_with_stubbed_agent)
        agent.chat_with_telemetry = AsyncMock(
            side_effect=ModelHTTPError(status_code=429, model_name="m", body=None)
        )

        resp = client.post("/api/v1/assistant/chat", json={"message": "boom"})

        assert resp.status_code == 429
        assert len(captured) == 1
        assert captured[0].outcome == TurnOutcome.ERROR
        assert captured[0].error_kind == "ModelHTTPError"
        assert captured[0].user_message == "boom"
        assert captured[0].assistant_reply is None

    def test_turn_id_tags_sentry_and_reaches_the_agent(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The id has to be minted before the run and handed to the agent, or a
        # Sentry event raised inside it can't be joined back to the row.
        from app.api.v1 import assistant as assistant_module

        self._capture(monkeypatch)
        tags = {}
        monkeypatch.setattr(
            assistant_module.sentry_sdk,
            "set_tag",
            lambda k, v: tags.__setitem__(k, v),
        )
        agent = self._agent(app_with_stubbed_agent)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        passed = agent.chat_with_telemetry.await_args.kwargs["turn_id"]
        assert tags["assistant.turn_id"] == str(passed)

    def test_failed_turn_reuses_the_sentry_turn_id(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        from app.api.v1 import assistant as assistant_module

        captured = self._capture(monkeypatch)
        tags = {}
        monkeypatch.setattr(
            assistant_module.sentry_sdk,
            "set_tag",
            lambda k, v: tags.__setitem__(k, v),
        )
        agent = self._agent(app_with_stubbed_agent)
        agent.chat_with_telemetry = AsyncMock(side_effect=RuntimeError("boom"))

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 500
        assert tags["assistant.turn_id"] == str(captured[0].turn_id)

    def _agent(self, app):
        from app.core.dependencies import get_assistant_agent

        return app.dependency_overrides[get_assistant_agent]()

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


class TestScheduleAndWrite:
    """_schedule_turn_log gating, and _log_turn's fail-open contract."""

    def _telemetry(self):
        from app.models.assistant import TurnTelemetry

        return TurnTelemetry(session_id="s1", user_message="hi")

    def test_no_task_is_scheduled_without_a_database(self, monkeypatch):
        from app.api.v1 import assistant as assistant_module
        from app.core.config import get_settings

        monkeypatch.delenv("DATABASE_URL", raising=False)
        get_settings.cache_clear()
        created = []
        monkeypatch.setattr(
            assistant_module.asyncio, "create_task", lambda c: created.append(c)
        )

        assistant_module._schedule_turn_log(MagicMock(), self._telemetry())

        assert created == []

    def test_no_task_is_scheduled_when_logging_is_disabled(self, monkeypatch):
        from app.api.v1 import assistant as assistant_module
        from app.core.config import get_settings

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOGGING_ENABLED", "false")
        get_settings.cache_clear()
        created = []
        monkeypatch.setattr(
            assistant_module.asyncio, "create_task", lambda c: created.append(c)
        )

        assistant_module._schedule_turn_log(MagicMock(), self._telemetry())

        assert created == []

    @pytest.mark.asyncio
    async def test_log_turn_swallows_a_broken_write(self, monkeypatch):
        from app.api.v1 import assistant as assistant_module
        from app.core.config import get_settings

        async def boom(agent, telemetry, settings):
            raise RuntimeError("database is on fire")

        monkeypatch.setattr(assistant_module, "_write_turn_log", boom)
        get_settings.cache_clear()

        # Must not raise -- it runs detached, so an exception here is unhandled.
        await assistant_module._log_turn(MagicMock(), self._telemetry(), get_settings())

    @pytest.mark.asyncio
    async def test_log_turn_gives_up_on_a_stalled_write(self, monkeypatch):
        import asyncio as aio

        from app.api.v1 import assistant as assistant_module
        from app.core.config import get_settings

        async def never_finishes(agent, telemetry, settings):
            await aio.sleep(60)

        monkeypatch.setattr(assistant_module, "_write_turn_log", never_finishes)
        monkeypatch.setenv("ASSISTANT_TURN_LOG_TIMEOUT_SECONDS", "0.05")
        get_settings.cache_clear()

        start = time.monotonic()
        await assistant_module._log_turn(MagicMock(), self._telemetry(), get_settings())

        assert time.monotonic() - start < 5


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


class TestTranscriptCap:
    """Tool returns are unbounded; one broad catalog query must not bloat a row."""

    def _result(self, messages):
        return SimpleNamespace(new_messages=lambda: messages)

    def test_small_transcript_is_kept_whole(self, monkeypatch):
        from app.core.config import get_settings

        get_settings.cache_clear()
        agent = _stub_agent()
        messages = [{"kind": "request", "parts": ["hi"]}]

        transcript, truncated = agent._build_transcript(self._result(messages))

        assert transcript == messages
        assert truncated is False

    def test_oversized_transcript_is_capped_and_flagged(self, monkeypatch):
        from app.core.config import get_settings

        monkeypatch.setenv("ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES", "500")
        get_settings.cache_clear()
        agent = _stub_agent()
        # One small leading message, then a huge tool return.
        messages = [
            {"kind": "request", "parts": ["hi"]},
            {"kind": "tool-return", "content": "x" * 5000},
        ]

        transcript, truncated = agent._build_transcript(self._result(messages))

        assert truncated is True
        # The front survives, so you can still see what the turn was doing.
        assert transcript == [messages[0]]

    def test_unserializable_transcript_degrades_to_empty(self):
        from app.core.config import get_settings

        get_settings.cache_clear()
        agent = _stub_agent()

        class Exploding:
            def new_messages(self):
                raise RuntimeError("nope")

        transcript, truncated = agent._build_transcript(Exploding())

        assert transcript == []
        assert truncated is False


class TestRetentionSweep:
    """The 90-day promise in the UI has to be enforced by something running."""

    def test_sweep_does_not_start_without_a_database(self, monkeypatch):
        from app.core.config import get_settings
        from app.services import turn_log_retention

        monkeypatch.delenv("DATABASE_URL", raising=False)
        get_settings.cache_clear()

        assert turn_log_retention.start_turn_log_purge_task() is None

    def test_sweep_does_not_start_when_explicitly_disabled(self, monkeypatch):
        from app.core.config import get_settings
        from app.services import turn_log_retention

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOG_PURGE_ENABLED", "false")
        get_settings.cache_clear()

        assert turn_log_retention.start_turn_log_purge_task() is None

    @pytest.mark.asyncio
    async def test_sweep_deletes_past_the_configured_window(self, monkeypatch):
        from app.core.config import get_settings
        from app.services import turn_log_retention

        monkeypatch.setenv("ASSISTANT_TURN_LOG_RETENTION_DAYS", "90")
        get_settings.cache_clear()

        session_factory = await _create_session_factory()
        async with session_factory() as session:
            session.add_all(
                [
                    AssistantTurnLog(
                        id=uuid.uuid4(),
                        created_at=datetime.now(timezone.utc) - timedelta(days=200),
                        **{
                            k: v
                            for k, v in _turn_kwargs(session_id="old").items()
                            if k != "user_id"
                        },
                    ),
                    AssistantTurnLog(
                        id=uuid.uuid4(),
                        created_at=datetime.now(timezone.utc) - timedelta(days=2),
                        **{
                            k: v
                            for k, v in _turn_kwargs(session_id="new").items()
                            if k != "user_id"
                        },
                    ),
                ]
            )
            await session.commit()

            monkeypatch.setattr(
                turn_log_retention, "get_session_factory", lambda: session_factory
            )
            deleted = await turn_log_retention.purge_expired_turn_logs()

            assert deleted == 1
            remaining = await session.execute(select(AssistantTurnLog.session_id))
            assert list(remaining.scalars().all()) == ["new"]
