"""add workflow runs table"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260421_0002"
down_revision = "20260419_0001"
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
        "workflow_runs",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column("user_id", _uuid_type(), nullable=True),
        sa.Column("workflow_trs_id", sa.String(length=255), nullable=False),
        sa.Column("workflow_id", sa.String(length=255), nullable=True),
        sa.Column("galaxy_instance_url", sa.Text(), nullable=True),
        sa.Column("handoff_url", sa.Text(), nullable=False),
        sa.Column("assembly_accession", sa.String(length=255), nullable=True),
        sa.Column("launch_source", sa.String(length=64), nullable=False),
        sa.Column("assistant_session_id", sa.String(length=255), nullable=True),
        sa.Column("galaxy_invocation_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column(
            "parameters",
            _json_type(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_workflow_runs_user_created_at",
        "workflow_runs",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_workflow_runs_user_created_at", table_name="workflow_runs")
    op.drop_table("workflow_runs")
