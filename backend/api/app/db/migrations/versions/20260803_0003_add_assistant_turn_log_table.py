"""add assistant turn log table"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260803_0003"
down_revision = "20260421_0002"
branch_labels = None
depends_on = None


def _uuid_type():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.UUID(as_uuid=True)
    return sa.String(length=36)


def _json_type():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB(astext_type=sa.Text())
    return sa.JSON()


def upgrade() -> None:
    op.create_table(
        "assistant_turn_log",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column("turn_id", _uuid_type(), nullable=False),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("turn_index", sa.Integer(), nullable=True),
        sa.Column("user_id", _uuid_type(), nullable=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("assistant_reply", sa.Text(), nullable=True),
        sa.Column(
            "outcome",
            sa.String(length=32),
            nullable=False,
            server_default="success",
        ),
        sa.Column("error_kind", sa.String(length=128), nullable=True),
        sa.Column(
            "transcript",
            _json_type(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
        sa.Column(
            "transcript_truncated",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "schema_state",
            _json_type(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("requests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tool_calls", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model", sa.String(length=255), nullable=True),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("turn_id", name="uq_assistant_turn_log_turn_id"),
    )
    # Reading a whole conversation back in order is the main review query.
    # Deliberately non-unique: turn_index comes from Redis session metadata and
    # concurrent requests on one session can collide. created_at orders rows.
    op.create_index(
        "ix_assistant_turn_log_session_turn",
        "assistant_turn_log",
        ["session_id", "turn_index"],
        unique=False,
    )
    # Retention purges delete by age, and review browses newest-first.
    op.create_index(
        "ix_assistant_turn_log_created_at",
        "assistant_turn_log",
        ["created_at"],
        unique=False,
    )
    # "show me the failures" is the query that justifies logging errors at all.
    op.create_index(
        "ix_assistant_turn_log_outcome",
        "assistant_turn_log",
        ["outcome"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_assistant_turn_log_outcome", table_name="assistant_turn_log")
    op.drop_index("ix_assistant_turn_log_created_at", table_name="assistant_turn_log")
    op.drop_index("ix_assistant_turn_log_session_turn", table_name="assistant_turn_log")
    op.drop_table("assistant_turn_log")
