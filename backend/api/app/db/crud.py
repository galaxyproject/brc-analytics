from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Favorite, SavedAnalysis, User, WorkflowRun


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


async def list_favorites_for_user(
    session: AsyncSession,
    user: User,
    entity_type: str | None = None,
) -> list[Favorite]:
    stmt = select(Favorite).where(Favorite.user_id == user.id)
    if entity_type is not None:
        stmt = stmt.where(Favorite.entity_type == entity_type)
    stmt = stmt.order_by(Favorite.created_at.desc())
    result = await session.execute(stmt)
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
    existing = await get_favorite(session, user, entity_type, entity_id)
    if existing is not None:
        return existing

    # Race window: two concurrent POSTs both pass the SELECT, both INSERT,
    # one trips the PK. Catching IntegrityError + re-fetching keeps the
    # endpoint clean (and portable across postgres + sqlite-in-tests).
    favorite = Favorite(
        user_id=user.id,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    session.add(favorite)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        existing = await get_favorite(session, user, entity_type, entity_id)
        if existing is not None:
            return existing
        raise
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


async def create_workflow_run(
    session: AsyncSession,
    user: User | None,
    *,
    workflow_trs_id: str,
    workflow_id: str | None,
    galaxy_instance_url: str | None,
    handoff_url: str,
    assembly_accession: str | None,
    launch_source: str,
    assistant_session_id: str | None,
    parameters: dict[str, Any],
    status: str = "handoff_created",
) -> WorkflowRun:
    workflow_run = WorkflowRun(
        user_id=user.id if user is not None else None,
        workflow_trs_id=workflow_trs_id,
        workflow_id=workflow_id,
        galaxy_instance_url=galaxy_instance_url,
        handoff_url=handoff_url,
        assembly_accession=assembly_accession,
        launch_source=launch_source,
        assistant_session_id=assistant_session_id,
        parameters=parameters,
        status=status,
    )
    session.add(workflow_run)
    await session.commit()
    await session.refresh(workflow_run)
    return workflow_run


async def list_workflow_runs_for_user(
    session: AsyncSession, user: User
) -> list[WorkflowRun]:
    result = await session.execute(
        select(WorkflowRun)
        .where(WorkflowRun.user_id == user.id)
        .order_by(WorkflowRun.created_at.desc())
    )
    return list(result.scalars().all())
