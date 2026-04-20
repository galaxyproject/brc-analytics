import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.crud import (
    delete_favorite,
    get_user_by_keycloak_sub,
    list_favorites_for_user,
    upsert_favorite,
    upsert_user_from_claims,
)
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


@pytest.mark.asyncio
async def test_favorite_crud_round_trip():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-456",
                "email": "fav@example.com",
                "name": "Favorite User",
            },
        )

        favorite = await upsert_favorite(session, user, "assembly", "GCF_000001405.40")
        favorites = await list_favorites_for_user(session, user)

        assert favorite.entity_id == "GCF_000001405.40"
        assert [item.entity_id for item in favorites] == ["GCF_000001405.40"]

        deleted = await delete_favorite(session, user, "assembly", "GCF_000001405.40")
        favorites_after_delete = await list_favorites_for_user(session, user)

        assert deleted is True
        assert favorites_after_delete == []
