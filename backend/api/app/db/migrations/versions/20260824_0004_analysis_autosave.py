"""Add agent message history and one-row-per-conversation uniqueness."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260824_0004"
down_revision = "20260803_0003"
branch_labels = None
depends_on = None


def _json_type():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB(astext_type=sa.Text())
    return sa.JSON()


def upgrade() -> None:
    op.add_column(
        "saved_analyses",
        sa.Column(
            "agent_message_history",
            _json_type(),
            nullable=False,
            server_default="[]",
        ),
    )
    # Existing rows are pre-auto-save snapshots and can collide on
    # (user_id, source_session) if a user clicked Save twice on one session.
    # Free the duplicates by nulling the pointer on all but the newest --
    # they stay readable, they just are not the live session for anything.
    #
    # Written as a correlated subquery rather than Postgres' DISTINCT ON so
    # the chain still runs on SQLite, which is what local dev and CI point
    # DATABASE_URL at. The id tiebreak keeps "newest wins" deterministic when
    # two rows share an updated_at.
    op.execute(
        """
        UPDATE saved_analyses SET source_session = NULL
        WHERE source_session IS NOT NULL
          AND id <> (
            SELECT s2.id FROM saved_analyses s2
            WHERE s2.user_id = saved_analyses.user_id
              AND s2.source_session = saved_analyses.source_session
            ORDER BY s2.updated_at DESC, s2.id DESC
            LIMIT 1
          )
        """
    )
    op.create_index(
        "uq_saved_analyses_user_session",
        "saved_analyses",
        ["user_id", "source_session"],
        unique=True,
    )


def downgrade() -> None:
    # One-way: the DDL reverses, but the source_session values the upgrade
    # nulled to break duplicates are gone and are not recoverable here.
    op.drop_index("uq_saved_analyses_user_session", table_name="saved_analyses")
    op.drop_column("saved_analyses", "agent_message_history")
