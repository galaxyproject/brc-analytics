"""index kmindex submissions by user for the /account history"""

from alembic import op

revision = "20261005_0007"
down_revision = "20260929_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The table logs every submission, anonymous and partner included, so the
    # per-user history query would otherwise scan it all.
    op.create_index(
        "ix_kmindex_submissions_user_id_created_at",
        "kmindex_submissions",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_kmindex_submissions_user_id_created_at",
        table_name="kmindex_submissions",
    )
