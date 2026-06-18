"""create persistent app tables"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260419_0001"
down_revision = None
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
        "users",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column("keycloak_sub", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column(
            "preferences",
            _json_type(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )
    op.create_index("ix_users_keycloak_sub", "users", ["keycloak_sub"], unique=True)

    op.create_table(
        "favorites",
        sa.Column("user_id", _uuid_type(), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "entity_type", "entity_id"),
    )

    op.create_table(
        "saved_analyses",
        sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
        sa.Column("user_id", _uuid_type(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("schema", _json_type(), nullable=False),
        sa.Column("messages", _json_type(), nullable=False),
        sa.Column("source_session", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_saved_analyses_user_updated_at",
        "saved_analyses",
        ["user_id", "updated_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_saved_analyses_user_updated_at", table_name="saved_analyses")
    op.drop_table("saved_analyses")
    op.drop_table("favorites")
    op.drop_index("ix_users_keycloak_sub", table_name="users")
    op.drop_table("users")
