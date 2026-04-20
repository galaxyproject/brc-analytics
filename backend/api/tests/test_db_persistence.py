import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.crud import get_user_by_keycloak_sub, upsert_user_from_claims
from app.db.models import Base


async def _create_session() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return session_factory()


@pytest.mark.asyncio
async def test_upsert_user_from_claims_creates_and_updates_user():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-123",
                "email": "first@example.com",
                "name": "First User",
            },
        )

        assert user.keycloak_sub == "kc-123"
        assert user.email == "first@example.com"
        assert user.name == "First User"

        updated_user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-123",
                "email": "updated@example.com",
                "name": "Updated User",
            },
        )

        fetched = await get_user_by_keycloak_sub(session, "kc-123")

        assert fetched is not None
        assert updated_user.id == user.id
        assert fetched.email == "updated@example.com"
        assert fetched.name == "Updated User"
