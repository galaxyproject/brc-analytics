"""add logan_job_id to the assistant turn log"""

import sqlalchemy as sa
from alembic import op

revision = "20261107_0008"
down_revision = "20261005_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 32 wide: Galaxy Test's job ids are 16 hex characters, usegalaxy.org's 32.
    # Nullable: only turns in a session opened from a Logan search have one,
    # and every row written before this has none. Indexed because the reason
    # it exists is finding those turns without scanning transcripts.
    op.add_column(
        "assistant_turn_log",
        sa.Column("logan_job_id", sa.String(length=32), nullable=True),
    )
    op.create_index(
        "ix_assistant_turn_log_logan_job_id",
        "assistant_turn_log",
        ["logan_job_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_assistant_turn_log_logan_job_id", table_name="assistant_turn_log")
    # Batch mode so SQLite, which cannot drop a column in place, rebuilds the
    # table; PostgreSQL drops it directly.
    with op.batch_alter_table("assistant_turn_log") as batch:
        batch.drop_column("logan_job_id")
