from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    keycloak_sub: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    favorites: Mapped[list[Favorite]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    saved_analyses: Mapped[list[SavedAnalysis]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    workflow_runs: Mapped[list[WorkflowRun]] = relationship(
        back_populates="user",
    )
    assistant_turns: Mapped[list[AssistantTurnLog]] = relationship(
        back_populates="user",
    )


class Favorite(Base):
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    entity_type: Mapped[str] = mapped_column(String(64), primary_key=True)
    entity_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="favorites")


class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    schema: Mapped[dict] = mapped_column(JSON, nullable=False)
    messages: Mapped[list] = mapped_column(JSON, nullable=False)
    # pydantic-ai's own message history, including tool calls and returns.
    # Without it a resumed conversation has no memory of anything the agent
    # looked up -- restore_saved_session used to rebuild from display
    # messages alone.
    agent_message_history: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
    )
    source_session: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="saved_analyses")

    __table_args__ = (
        # One row per conversation. source_session points at the currently
        # live Redis session, so the per-turn write is an upsert rather than
        # the INSERT that used to duplicate a row on every save click.
        # NULLs compare distinct in both Postgres and SQLite, so analyses
        # whose session has expired do not collide.
        Index(
            "uq_saved_analyses_user_session",
            "user_id",
            "source_session",
            unique=True,
        ),
    )


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # Intentional: workflow_runs is mixed authenticated + anonymous tracking.
    # SET NULL on user deletion converts the row to an anonymous record (same
    # state it would have had if the user wasn't logged in at launch time).
    # The account history page filters on user_id and won't show the orphan,
    # but the analytics record is preserved.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    workflow_trs_id: Mapped[str] = mapped_column(String(255), nullable=False)
    workflow_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    galaxy_instance_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    handoff_url: Mapped[str] = mapped_column(Text, nullable=False)
    assembly_accession: Mapped[str | None] = mapped_column(String(255), nullable=True)
    launch_source: Mapped[str] = mapped_column(String(64), nullable=False)
    assistant_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    galaxy_invocation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped[User | None] = relationship(back_populates="workflow_runs")


class AssistantTurnLog(Base):
    """One row per assistant turn -- a user message and what came back.

    Beta observability (#1294). Session state lives in Redis with a 2h TTL, so
    without this there is no durable record of what users asked or how the
    assistant answered. Deliberately separate from `saved_analyses`: that table
    is user-facing and a filtering mistake there would surface one user's
    conversation in another's saved list.

    Failed turns are recorded too (`outcome='error'`), so the corpus isn't
    biased toward the requests that happened to work -- during a beta the ones
    that broke are usually the interesting ones. On an error the reply, tokens,
    and transcript are absent, and the session may not have been created yet,
    which is why several columns are nullable.
    """

    __tablename__ = "assistant_turn_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # Minted per turn before the agent runs and attached to the Sentry scope,
    # so an exception over there can be joined to the prompt that caused it.
    # Also the idempotency handle if a turn is ever retried.
    turn_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        unique=True,
    )
    # Null when the turn failed before a session could be created.
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Best-effort ordering hint, NOT a unique sequence: it is read from Redis
    # session metadata, so two concurrent requests on one session can observe
    # the same value. `created_at` is the authoritative ordering.
    turn_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Same rationale as WorkflowRun.user_id: mixed authenticated + anonymous
    # capture, and deleting a user should anonymize the analytics row rather
    # than punch holes in the beta record.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    # Null on a failed turn -- there was no reply.
    assistant_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False, default="success")
    # Exception class name for outcome='error' (e.g. AssistantTimeoutError).
    error_kind: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # This turn's new pydantic-ai messages only (not the rehydrated history),
    # so tool calls and their returns are recoverable without duplicating the
    # whole conversation on every row. Byte-capped -- see transcript_truncated.
    transcript: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    # True when the transcript hit the size cap and trailing messages were
    # dropped, so a short transcript is never mistaken for a short turn.
    transcript_truncated: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    schema_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    requests: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tool_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    user: Mapped[User | None] = relationship(back_populates="assistant_turns")

    __table_args__ = (
        # created_at, not turn_index: reading a conversation back orders by
        # time, so this serves it without a sort node.
        Index("ix_assistant_turn_log_session_created", "session_id", "created_at"),
        Index("ix_assistant_turn_log_created_at", "created_at"),
        # Partial: 'success' dominates and would never use an index, but it
        # would still cost an index insert on every turn.
        Index(
            "ix_assistant_turn_log_failures",
            "created_at",
            postgresql_where=text("outcome <> 'success'"),
        ),
    )
