"""add kmindex submissions analytics table"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260929_0006"
down_revision = "20260915_0005"
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
        "kmindex_submissions",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column("galaxy_job_id", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=True),
        sa.Column("identity", sa.String(length=16), nullable=False),
        sa.Column(
            "user_id",
            _uuid_type(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "indexes",
            _json_type(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
        sa.Column("query_bases", sa.Integer(), nullable=False),
        sa.Column("threshold", sa.Float(), nullable=False),
        sa.Column("zvalue", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "galaxy_job_id", name="uq_kmindex_submissions_galaxy_job_id"
        ),
    )
    op.create_index(
        "ix_kmindex_submissions_created_at", "kmindex_submissions", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_kmindex_submissions_created_at", table_name="kmindex_submissions")
    op.drop_table("kmindex_submissions")
