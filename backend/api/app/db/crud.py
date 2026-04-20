from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Favorite, SavedAnalysis, User


async def get_user_by_keycloak_sub(
    session: AsyncSession, keycloak_sub: str
) -> User | None:
    result = await session.execute(
        select(User).where(User.keycloak_sub == keycloak_sub)
    )
    return result.scalar_one_or_none()


async def upsert_user_from_claims(
    session: AsyncSession, claims: dict[str, Any]
) -> User:
    keycloak_sub = claims.get("sub")
    if not keycloak_sub:
        raise ValueError("OIDC claims are missing sub")

    user = await get_user_by_keycloak_sub(session, keycloak_sub)
    if user is None:
        user = User(
            keycloak_sub=keycloak_sub,
            email=claims.get("email"),
            name=claims.get("name"),
        )
        session.add(user)
    else:
        user.email = claims.get("email")
        user.name = claims.get("name")

    await session.commit()
    await session.refresh(user)
    return user


async def list_favorites_for_user(session: AsyncSession, user: User) -> list[Favorite]:
    result = await session.execute(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
    )
    return list(result.scalars().all())


async def get_favorite(
    session: AsyncSession, user: User, entity_type: str, entity_id: str
) -> Favorite | None:
    result = await session.execute(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.entity_type == entity_type,
            Favorite.entity_id == entity_id,
        )
    )
    return result.scalar_one_or_none()


async def upsert_favorite(
    session: AsyncSession, user: User, entity_type: str, entity_id: str
) -> Favorite:
    favorite = await get_favorite(session, user, entity_type, entity_id)
    if favorite is None:
        favorite = Favorite(
            user_id=user.id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        session.add(favorite)
        await session.commit()
        await session.refresh(favorite)
    return favorite


async def delete_favorite(
    session: AsyncSession, user: User, entity_type: str, entity_id: str
) -> bool:
    favorite = await get_favorite(session, user, entity_type, entity_id)
    if favorite is None:
        return False

    await session.delete(favorite)
    await session.commit()
    return True


async def list_saved_analyses_for_user(
    session: AsyncSession, user: User
) -> list[SavedAnalysis]:
    result = await session.execute(
        select(SavedAnalysis)
        .where(SavedAnalysis.user_id == user.id)
        .order_by(SavedAnalysis.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_saved_analysis(
    session: AsyncSession, user: User, saved_analysis_id: str
) -> SavedAnalysis | None:
    try:
        saved_analysis_uuid = uuid.UUID(saved_analysis_id)
    except ValueError:
        return None

    result = await session.execute(
        select(SavedAnalysis).where(
            SavedAnalysis.user_id == user.id,
            SavedAnalysis.id == saved_analysis_uuid,
        )
    )
    return result.scalar_one_or_none()


async def create_saved_analysis(
    session: AsyncSession,
    user: User,
    *,
    title: str | None,
    schema: dict[str, Any],
    messages: list[dict[str, Any]],
    source_session: str | None,
) -> SavedAnalysis:
    saved_analysis = SavedAnalysis(
        user_id=user.id,
        title=title,
        schema=schema,
        messages=messages,
        source_session=source_session,
    )
    session.add(saved_analysis)
    await session.commit()
    await session.refresh(saved_analysis)
    return saved_analysis


async def delete_saved_analysis(
    session: AsyncSession, user: User, saved_analysis_id: str
) -> bool:
    saved_analysis = await get_saved_analysis(session, user, saved_analysis_id)
    if saved_analysis is None:
        return False

    await session.delete(saved_analysis)
    await session.commit()
    return True
