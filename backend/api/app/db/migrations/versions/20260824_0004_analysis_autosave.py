"""Add agent message history and one-row-per-conversation uniqueness."""

import sqlalchemy as sa
from alembic import op

revision = "20260824_0004"
down_revision = "20260803_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "saved_analyses",
        sa.Column(
            "agent_message_history",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
    )
    # Existing rows are pre-auto-save snapshots and can collide on
    # (user_id, source_session) if a user clicked Save twice on one session.
    # Free the duplicates by nulling the pointer on all but the newest --
    # they stay readable, they just are not the live session for anything.
    op.execute(
        """
        UPDATE saved_analyses SET source_session = NULL
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, source_session) id
            FROM saved_analyses
            WHERE source_session IS NOT NULL
            ORDER BY user_id, source_session, updated_at DESC
        )
        AND source_session IS NOT NULL
        """
    )
    op.create_index(
        "uq_saved_analyses_user_session",
        "saved_analyses",
        ["user_id", "source_session"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_saved_analyses_user_session", table_name="saved_analyses")
    op.drop_column("saved_analyses", "agent_message_history")
