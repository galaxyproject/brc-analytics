"""add galaxy jobs ownership table"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260824_0004"
down_revision = "20260803_0003"
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
        "galaxy_jobs",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            _uuid_type(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("galaxy_job_id", sa.Text(), nullable=False, unique=True),
        sa.Column("galaxy_instance_url", sa.Text(), nullable=False),
        sa.Column("tool", sa.String(length=64), nullable=False),
        sa.Column("params", _json_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_galaxy_jobs_user_id", "galaxy_jobs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_galaxy_jobs_user_id", table_name="galaxy_jobs")
    op.drop_table("galaxy_jobs")
