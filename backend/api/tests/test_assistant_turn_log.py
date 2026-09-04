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

    def _sink_passed_to(self, agent):
        """The endpoint's job is to hand the agent the right sink.

        The agent does the recording (it is the only layer that knows the
        session it created before a failure), so what the endpoint owns is the
        wiring; TestAgentRecordsFailures covers the recording itself.
        """
        return agent.chat_with_telemetry.await_args.kwargs["on_turn"]

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

    def test_the_endpoint_hands_the_agent_the_turn_log_sink(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        agent = self._agent(app_with_stubbed_agent)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert self._sink_passed_to(agent) is turn_log.record

    def test_turn_id_tags_sentry_and_reaches_the_agent(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # The id has to be minted before the run and handed to the agent, or a
        # Sentry event raised inside it can't be joined back to the row.
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

        async def _spy(t):
            scheduled.append(t)

        monkeypatch.setattr(turn_log, "_write", _spy)

        resp = client.post("/api/v1/assistant/chat", json={"message": "hello"})

        assert resp.status_code == 200
        assert scheduled == []
        assert resp.json()["reply"] == "hi"


def _stub_agent():
    """Minimal AssistantAgent, no Redis/LLM -- mirrors tests/test_assistant_agent.py."""
    from app.core.config import get_settings
    from app.services.assistant_agent import AssistantAgent

    instance = object.__new__(AssistantAgent)
    instance.catalog = MagicMock()
    instance.catalog.workflows_by_category = []
    instance.sra_mirror = None
    instance.galaxy = None
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


class TestWriteIsFailOpen:
    """A log failure must never surface to the user, even inline."""

    def _telemetry(self):
        return TurnTelemetry(session_id="s1", user_message="hi")

    @pytest.mark.asyncio
    async def test_a_broken_write_is_swallowed(self, monkeypatch):
        async def boom(telemetry):
            raise RuntimeError("database is on fire")

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        from app.core.config import get_settings

        get_settings.cache_clear()
        monkeypatch.setattr(turn_log, "_write", boom)

        # Must not raise -- the caller is mid-turn with a reply in hand.
        await turn_log.record(self._telemetry())

    @pytest.mark.asyncio
    async def test_a_stalled_write_gives_up_on_the_timeout(self, monkeypatch):
        import asyncio as aio

        async def never_finishes(telemetry):
            await aio.sleep(60)

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("ASSISTANT_TURN_LOG_TIMEOUT_SECONDS", "0.05")
        from app.core.config import get_settings

        get_settings.cache_clear()
        monkeypatch.setattr(turn_log, "_write", never_finishes)

        start = time.monotonic()
        await turn_log.record(self._telemetry())
        assert time.monotonic() - start < 5


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


class TestInfoRetentionWindow:
    """/info must only advertise a window the deployment will actually enforce."""

    def _days(self, client, app, monkeypatch, **env):
        """Set env, then repoint the stub agent at the fresh Settings.

        /info reads agent.settings, which conftest captured at fixture time,
        so clearing the lru_cache alone would leave the endpoint on the stale
        object and these assertions would pass for the wrong reason.
        """
        from app.core.config import get_settings
        from app.core.dependencies import get_assistant_agent

        for key, value in env.items():
            if value is None:
                monkeypatch.delenv(key, raising=False)
            else:
                monkeypatch.setenv(key, value)
        get_settings.cache_clear()
        app.dependency_overrides[get_assistant_agent]().settings = get_settings()
        return client.get("/api/v1/assistant/info").json()["turn_log_retention_days"]

    def test_window_is_advertised_when_the_sweep_will_run(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        days = self._days(
            client,
            app_with_stubbed_agent,
            monkeypatch,
            DATABASE_URL="sqlite+aiosqlite:///:memory:",
            ASSISTANT_TURN_LOG_RETENTION_DAYS="90",
        )
        assert days == 90

    def test_no_window_when_there_is_no_database(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        days = self._days(
            client, app_with_stubbed_agent, monkeypatch, DATABASE_URL=None
        )
        assert days is None

    def test_no_window_when_retention_is_nonpositive(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        # purge_expired refuses days < 1, so advertising it would promise a
        # deletion that never happens.
        days = self._days(
            client,
            app_with_stubbed_agent,
            monkeypatch,
            DATABASE_URL="sqlite+aiosqlite:///:memory:",
            ASSISTANT_TURN_LOG_RETENTION_DAYS="0",
        )
        assert days is None

    def test_no_window_when_the_sweep_is_disabled(
        self, app_with_stubbed_agent, client, monkeypatch
    ):
        days = self._days(
            client,
            app_with_stubbed_agent,
            monkeypatch,
            DATABASE_URL="sqlite+aiosqlite:///:memory:",
            ASSISTANT_TURN_LOG_PURGE_ENABLED="false",
        )
        assert days is None


class TestLoggingAndNoticeStayInSync:
    """The writer and the user-facing notice must agree, in both directions.

    Logging without a notice is a privacy problem; a notice without logging
    (or without an enforced window) is a promise nothing keeps. One predicate
    drives both, and these pin it.
    """

    CONFIGS = [
        ({"ASSISTANT_TURN_LOGGING_ENABLED": "false"}, "logging off"),
        ({"DATABASE_URL": None}, "no database"),
        ({"ASSISTANT_TURN_LOG_PURGE_ENABLED": "false"}, "sweep off"),
        ({"ASSISTANT_TURN_LOG_RETENTION_DAYS": "0"}, "zero-day window"),
        ({"ASSISTANT_TURN_LOG_RETENTION_DAYS": "-5"}, "negative window"),
    ]

    def _spy_on_write(self, monkeypatch):
        """Count actual inserts without touching a database."""
        written = []

        async def _spy(telemetry):
            written.append(telemetry)

        monkeypatch.setattr(turn_log, "_write", _spy)
        return written

    def _apply(self, monkeypatch, env):
        from app.core.config import get_settings

        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        for key, value in env.items():
            if value is None:
                monkeypatch.delenv(key, raising=False)
            else:
                monkeypatch.setenv(key, value)
        get_settings.cache_clear()
        return get_settings()

    @pytest.mark.parametrize("env,label", CONFIGS)
    @pytest.mark.asyncio
    async def test_nothing_is_written_when_nothing_is_advertised(
        self, monkeypatch, env, label
    ):
        settings = self._apply(monkeypatch, env)

        assert turn_log.active_retention_days(settings) is None, label

        written = self._spy_on_write(monkeypatch)
        await turn_log.record(TurnTelemetry(session_id="s", user_message="hi"))
        assert written == [], f"logged with no user notice ({label})"

    @pytest.mark.asyncio
    async def test_the_default_deployment_both_logs_and_discloses(self, monkeypatch):
        settings = self._apply(monkeypatch, {})

        assert turn_log.active_retention_days(settings) == 90

        written = self._spy_on_write(monkeypatch)
        await turn_log.record(TurnTelemetry(session_id="s", user_message="hi"))
        assert len(written) == 1


@pytest.mark.parametrize("days", ["0", "-3"])
def test_no_sweep_is_started_for_a_window_that_cannot_be_enforced(monkeypatch, days):
    """purge_expired refuses days < 1, so a loop here could only log errors."""
    from app.core.config import get_settings

    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    monkeypatch.setenv("ASSISTANT_TURN_LOG_RETENTION_DAYS", days)
    get_settings.cache_clear()

    assert turn_log.start_purge_task() is None


@pytest.mark.asyncio
async def test_a_broken_log_sink_does_not_cost_the_user_their_reply():
    """The sink is fire-and-forget; a reply we already computed outranks a row."""
    from app.models.assistant import AnalysisSchema, SessionState

    agent = _stub_agent()
    state = SessionState(session_id="s1", schema_state=AnalysisSchema())
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(return_value=state),
        require_session=AsyncMock(return_value=state),
        save_session=AsyncMock(),
    )
    agent._run_agent_with_retry = AsyncMock(return_value=_fake_run_result([]))
    agent._extract_state = AsyncMock(return_value=({}, None))

    def exploding_sink(_telemetry):
        raise RuntimeError("sink is down")

    response, _ = await agent.chat_with_telemetry("hi", on_turn=exploding_sink)

    assert response.reply == "Ready to go."


@pytest.mark.asyncio
async def test_an_unresolved_session_is_recorded_as_null_not_as_the_request_id():
    """We only name a session we actually resolved."""
    agent = _stub_agent()
    agent.session_service = SimpleNamespace(
        create_session=AsyncMock(side_effect=RuntimeError("session store down")),
        require_session=AsyncMock(side_effect=RuntimeError("session store down")),
        save_session=AsyncMock(),
    )
    recorded = []

    with pytest.raises(RuntimeError):
        await agent.chat_with_telemetry(
            "hi", session_id="unvalidated-id", on_turn=recorded.append
        )

    assert recorded[0].session_id is None
