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
from app.models.assistant import TokenUsage, TurnOutcome, TurnTelemetry
from app.services import turn_log

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


def _turn_row(age_days: int, **overrides) -> AssistantTurnLog:
    """An AssistantTurnLog aged into the past, for retention tests."""
    return AssistantTurnLog(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc) - timedelta(days=age_days),
        **_turn_kwargs(**overrides),
    )


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
        session.add_all(
            [
                _turn_row(120, session_id="sess-old"),
                _turn_row(5, session_id="sess-recent"),
            ]
        )
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
        """Capture what the endpoint hands to turn_log.

        The real write is detached, so asserting on its completion from a sync
        TestClient would race. Scheduling is the endpoint's responsibility;
        persistence is covered by TestScheduleAndWrite below.
        """
        from app.services import turn_log

        captured = []
        monkeypatch.setattr(turn_log, "schedule", captured.append)
        return captured

    def _tags(self, monkeypatch):
        from app.api.v1 import assistant as assistant_module

        tags = {}
        monkeypatch.setattr(
            assistant_module.sentry_sdk, "set_tag", lambda k, v: tags.__setitem__(k, v)
        )
        return tags

    def _agent(self, app):
        from app.core.dependencies import get_assistant_agent

        return app.dependency_overrides[get_assistant_agent]()

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

    def test_turn_id_tags_sentry_and_reaches_the_agent(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The id has to be minted before the run and handed to the agent, or a
        # Sentry event raised inside it can't be joined back to the row.
        self._capture(monkeypatch)
        tags = self._tags(monkeypatch)
        agent = self._agent(app_with_stubbed_agent)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        passed = agent.chat_with_telemetry.await_args.kwargs["turn_id"]
        assert tags["assistant.turn_id"] == str(passed)

    def test_chat_succeeds_when_no_database_is_configured(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The default docker-compose stack runs without DATABASE_URL. Wiring
        # the write as a FastAPI dependency would 500 every chat there, since
        # get_db_session() raises before the handler body runs.
        from app.core.config import get_settings

        monkeypatch.delenv("DATABASE_URL", raising=False)
        # The fixture already built a Settings, so without this the delenv
        # above changes nothing and the test passes on a machine that has a
        # DATABASE_URL exported -- i.e. it proves the opposite of its name.
        get_settings.cache_clear()
        assert not get_settings().DATABASE_URL

        scheduled = []
        monkeypatch.setattr(turn_log, "_write_with_timeout", scheduled.append)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert scheduled == []
        assert resp.json()["reply"] == "hi"


class TestScheduleAndWrite:
    """turn_log.schedule() gating, and the write's fail-open contract."""

    def _telemetry(self):
        return TurnTelemetry(session_id="s1", user_message="hi")

    def _no_task_scheduled(self, monkeypatch):
        created = []
        monkeypatch.setattr(turn_log.asyncio, "create_task", created.append)
        turn_log.schedule(self._telemetry())
        return created

    def test_no_task_is_scheduled_without_a_database(self, monkeypatch):
        monkeypatch.delenv("DATABASE_URL", raising=False)
        assert self._no_task_scheduled(monkeypatch) == []

    def test_no_task_is_scheduled_when_logging_is_disabled(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOGGING_ENABLED", "false")
        assert self._no_task_scheduled(monkeypatch) == []

    @pytest.mark.asyncio
    async def test_a_broken_write_is_swallowed(self, monkeypatch):
        async def boom(telemetry):
            raise RuntimeError("database is on fire")

        monkeypatch.setattr(turn_log, "_write", boom)

        # Must not raise -- it runs detached, so an escape would be unhandled.
        await turn_log._write_with_timeout(self._telemetry())

    @pytest.mark.asyncio
    async def test_a_stalled_write_gives_up(self, monkeypatch):
        import asyncio as aio

        async def never_finishes(telemetry):
            await aio.sleep(60)

        monkeypatch.setattr(turn_log, "_write", never_finishes)
        monkeypatch.setenv("ASSISTANT_TURN_LOG_TIMEOUT_SECONDS", "0.05")

        start = time.monotonic()
        await turn_log._write_with_timeout(self._telemetry())

        assert time.monotonic() - start < 5


def _stub_agent():
    """Minimal AssistantAgent, no Redis/LLM -- mirrors tests/test_assistant_agent.py."""
    from app.core.config import get_settings
    from app.services.assistant_agent import AssistantAgent

    instance = object.__new__(AssistantAgent)
    instance.catalog = MagicMock()
    instance.catalog.workflows_by_category = []
    instance.sra_mirror = None
    instance.query_con = None
    instance.agent = object()
    instance.settings = get_settings()
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
        all_messages=lambda: new_messages,
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


class TestTranscriptCap:
    """Tool returns are unbounded; one broad catalog query must not bloat a row."""

    def _result(self, messages):
        return SimpleNamespace(new_messages=lambda: messages)

    def test_small_transcript_is_kept_whole(self, monkeypatch):
        agent = _stub_agent()
        messages = [{"kind": "request", "parts": ["hi"]}]

        transcript, truncated = agent._build_transcript(
            self._result(messages), messages
        )

        assert transcript == messages
        assert truncated is False

    def test_oversized_transcript_is_capped_and_flagged(self, monkeypatch):
        monkeypatch.setenv("ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES", "500")
        agent = _stub_agent()
        # One small leading message, then a huge tool return.
        messages = [
            {"kind": "request", "parts": ["hi"]},
            {"kind": "tool-return", "content": "x" * 5000},
        ]

        transcript, truncated = agent._build_transcript(
            self._result(messages), messages
        )

        assert truncated is True
        # The front survives, so you can still see what the turn was doing.
        assert transcript == [messages[0]]

    def test_unserializable_transcript_degrades_to_empty(self):
        agent = _stub_agent()

        class Exploding:
            def new_messages(self):
                raise RuntimeError("nope")

        transcript, truncated = agent._build_transcript(Exploding(), [])

        assert transcript == []
        assert truncated is False


class TestRetentionSweep:
    """The 90-day promise in the UI has to be enforced by something running."""

    def test_sweep_does_not_start_without_a_database(self, monkeypatch):
        from app.services import turn_log

        monkeypatch.delenv("DATABASE_URL", raising=False)

        assert turn_log.start_purge_task() is None

    def test_sweep_does_not_start_when_explicitly_disabled(self, monkeypatch):
        from app.services import turn_log

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOG_PURGE_ENABLED", "false")

        assert turn_log.start_purge_task() is None

    @pytest.mark.asyncio
    async def test_sweep_deletes_past_the_configured_window(self, monkeypatch):
        from app.services import turn_log

        monkeypatch.setenv("ASSISTANT_TURN_LOG_RETENTION_DAYS", "90")

        session_factory = await _create_session_factory()
        async with session_factory() as session:
            session.add_all(
                [_turn_row(200, session_id="old"), _turn_row(2, session_id="new")]
            )
            await session.commit()

            from contextlib import asynccontextmanager

            @asynccontextmanager
            async def _fake_session():
                yield session

            monkeypatch.setattr(turn_log, "db_session", _fake_session)
            deleted = await turn_log.purge_expired()

            assert deleted == 1
            remaining = await session.execute(select(AssistantTurnLog.session_id))
            assert list(remaining.scalars().all()) == ["new"]


@pytest.mark.asyncio
async def test_shutdown_waits_for_in_flight_turn_log_writes():
    """A deploy must not drop the turns logged just before it.

    The write is detached, and shutdown disposes the DB engine -- without a
    drain, whatever was in flight dies with it.
    """
    import asyncio as aio

    from app.services import turn_log as turn_log_mod

    finished = []

    async def slow_write():
        await aio.sleep(0.05)
        finished.append(True)

    task = aio.create_task(slow_write())
    turn_log_mod._pending_writes.add(task)
    task.add_done_callback(turn_log_mod._pending_writes.discard)

    await turn_log_mod.drain(timeout=2.0)

    assert finished == [True]


@pytest.mark.asyncio
async def test_drain_gives_up_rather_than_hanging_shutdown():
    import asyncio as aio

    from app.services import turn_log as turn_log_mod

    task = aio.create_task(aio.sleep(30))
    turn_log_mod._pending_writes.add(task)
    task.add_done_callback(turn_log_mod._pending_writes.discard)
    try:
        start = time.monotonic()
        await turn_log_mod.drain(timeout=0.05)
        assert time.monotonic() - start < 5
    finally:
        task.cancel()


class TestAgentRecordsFailures:
    """Recording lives in the agent: it is the only layer that knows the
    session it created before the turn blew up."""

    def _agent_with_session(self):
        from app.models.assistant import AnalysisSchema, SessionState

        agent = _stub_agent()
        state = SessionState(
            session_id="sess-created", schema_state=AnalysisSchema(), messages=[]
        )
        agent.session_service = SimpleNamespace(
            create_session=AsyncMock(return_value=state),
            require_session=AsyncMock(return_value=state),
            save_session=AsyncMock(),
        )
        agent._extract_state = AsyncMock(return_value=({}, None))
        return agent

    @pytest.mark.asyncio
    async def test_a_failed_first_turn_still_names_its_session(self):
        # The endpoint only knows request.session_id, which is None on a first
        # turn -- so the agent has to supply the session it just created, or
        # the failures worth reading lose their grouping.
        recorded = []
        agent = self._agent_with_session()
        agent._run_agent_with_retry = AsyncMock(side_effect=RuntimeError("upstream"))

        with pytest.raises(RuntimeError):
            await agent.chat_with_telemetry(
                "hello", session_id=None, on_turn=recorded.append
            )

        assert len(recorded) == 1
        assert recorded[0].outcome == TurnOutcome.ERROR
        assert recorded[0].error_kind == "RuntimeError"
        assert recorded[0].session_id == "sess-created"
        assert recorded[0].turn_index == 0
        assert recorded[0].user_message == "hello"
        assert recorded[0].assistant_reply is None

    @pytest.mark.asyncio
    async def test_a_failure_before_any_session_exists_is_still_recorded(self):
        agent = _stub_agent()
        agent.agent = None  # is_available() -> False, fails before session setup
        recorded = []

        with pytest.raises(Exception):
            await agent.chat_with_telemetry("hello", on_turn=recorded.append)

        assert len(recorded) == 1
        assert recorded[0].session_id is None
        assert recorded[0].user_message == "hello"

    @pytest.mark.asyncio
    async def test_the_success_record_reaches_the_sink_once(self):
        recorded = []
        agent = self._agent_with_session()
        agent._run_agent_with_retry = AsyncMock(return_value=_fake_run_result([]))

        await agent.chat_with_telemetry("hello", on_turn=recorded.append)

        assert len(recorded) == 1
        assert recorded[0].outcome == TurnOutcome.SUCCESS


@pytest.mark.asyncio
async def test_write_maps_every_telemetry_field_onto_a_column(monkeypatch):
    """Exercise the real TurnTelemetry -> column mapping.

    crud takes **fields, so a renamed column or a typo'd key is a TypeError
    raised inside a fail-open handler: chats keep returning 200 while the
    table stays empty. Every other test either builds its own kwargs dict or
    monkeypatches _write out, so nothing else runs this mapping.
    """
    from contextlib import asynccontextmanager

    session_factory = await _create_session_factory()

    async with session_factory() as session:

        @asynccontextmanager
        async def _fake_session():
            yield session

        monkeypatch.setattr(turn_log, "db_session", _fake_session)

        telemetry = TurnTelemetry(
            turn_id=uuid.uuid4(),
            session_id="sess-map",
            turn_index=4,
            user_message="what assemblies exist?",
            assistant_reply="these ones",
            transcript=[{"kind": "response"}],
            transcript_truncated=True,
            schema_state={"organism": {"value": "yeast"}},
            token_usage=TokenUsage(
                input_tokens=1,
                output_tokens=2,
                total_tokens=3,
                requests=1,
                tool_calls=2,
            ),
            latency_ms=99,
            model="m",
            provider="p",
        )

        await turn_log._write(telemetry)

        row = (
            await session.execute(
                select(AssistantTurnLog).where(
                    AssistantTurnLog.session_id == "sess-map"
                )
            )
        ).scalar_one()

        assert row.turn_id == telemetry.turn_id
        assert row.turn_index == 4
        assert row.user_message == "what assemblies exist?"
        assert row.assistant_reply == "these ones"
        assert row.outcome == "success"
        assert row.transcript == [{"kind": "response"}]
        assert row.transcript_truncated is True
        assert row.schema_state == {"organism": {"value": "yeast"}}
        assert (row.input_tokens, row.output_tokens, row.total_tokens) == (1, 2, 3)
        assert (row.requests, row.tool_calls) == (1, 2)
        assert row.latency_ms == 99
        assert (row.model, row.provider) == ("m", "p")


@pytest.mark.asyncio
async def test_nul_bytes_are_scrubbed_so_postgres_accepts_the_row(monkeypatch):
    """A NUL is legal in a str and in JSON but Postgres rejects it.

    The writer is fail-open, so without scrubbing a user could keep their whole
    conversation out of the corpus by pasting one character.
    """
    from contextlib import asynccontextmanager

    session_factory = await _create_session_factory()

    async with session_factory() as session:

        @asynccontextmanager
        async def _fake_session():
            yield session

        monkeypatch.setattr(turn_log, "db_session", _fake_session)

        await turn_log._write(
            TurnTelemetry(
                session_id="sess-nul",
                user_message="before\x00after",
                assistant_reply="reply\x00here",
                transcript=[{"content": "tool\x00return"}],
                schema_state={"organism": {"value": "yeast\x00"}},
            )
        )

        row = (
            await session.execute(
                select(AssistantTurnLog).where(
                    AssistantTurnLog.session_id == "sess-nul"
                )
            )
        ).scalar_one()

        assert "\x00" not in row.user_message
        assert "\x00" not in row.assistant_reply
        assert row.user_message == "beforeafter"
        assert row.transcript == [{"content": "toolreturn"}]
        assert row.schema_state == {"organism": {"value": "yeast"}}


@pytest.mark.asyncio
async def test_a_rejected_session_is_never_recorded():
    """A 403 must not file the caller's text under the owner's session.

    Session ids travel in URLs, and the review queries don't filter on
    outcome -- so a recorded PermissionError would put a stranger's message
    inside someone else's conversation.
    """
    from app.models.assistant import AnalysisSchema, SessionState

    agent = _stub_agent()
    state = SessionState(session_id="victim", schema_state=AnalysisSchema())
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(return_value=state),
        require_session=AsyncMock(side_effect=PermissionError("victim")),
        save_session=AsyncMock(),
    )
    recorded = []

    with pytest.raises(PermissionError):
        await agent.chat_with_telemetry(
            "let me see someone else's chat",
            session_id="victim",
            on_turn=recorded.append,
        )

    assert recorded == []


@pytest.mark.asyncio
async def test_a_nonpositive_retention_window_refuses_to_purge(monkeypatch):
    """0 reads like "no expiry" but computes a cutoff of now."""
    from contextlib import asynccontextmanager

    session_factory = await _create_session_factory()
    async with session_factory() as session:
        session.add_all([_turn_row(1, session_id="fresh")])
        await session.commit()

        @asynccontextmanager
        async def _fake_session():
            yield session

        monkeypatch.setattr(turn_log, "db_session", _fake_session)
        monkeypatch.setenv("ASSISTANT_TURN_LOG_RETENTION_DAYS", "0")
        from app.core.config import get_settings

        get_settings.cache_clear()

        assert await turn_log.purge_expired() == 0
        remaining = await session.execute(select(AssistantTurnLog.session_id))
        assert list(remaining.scalars().all()) == ["fresh"]


@pytest.mark.asyncio
async def test_drain_cancels_stragglers_so_none_outlive_close_db():
    """A leftover write would rebuild the engine that close_db just disposed."""
    import asyncio as aio

    task = aio.create_task(aio.sleep(30))
    turn_log._pending_writes.add(task)
    task.add_done_callback(turn_log._pending_writes.discard)

    await turn_log.drain(timeout=0.05)

    assert task.cancelled() or task.done()
