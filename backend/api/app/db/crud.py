from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AssistantTurnLog,
    Favorite,
    SavedAnalysis,
    User,
    WorkflowRun,
)


async def get_user_by_keycloak_sub(
    session: AsyncSession, keycloak_sub: str
) -> User | None:
    result = await session.execute(
        select(User).where(User.keycloak_sub == keycloak_sub)
    )
    return result.scalar_one_or_none()


async def get_user_id_by_keycloak_sub(
    session: AsyncSession, keycloak_sub: str
) -> uuid.UUID | None:
    """Just the id -- avoids materializing a whole User for a foreign key."""
    result = await session.execute(
        select(User.id).where(User.keycloak_sub == keycloak_sub)
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
        try:
            await session.commit()
        except IntegrityError:
            # Concurrent first-login for the same sub: the other callback
            # won the INSERT. Recover by loading its row and applying our
            # claim values, mirroring upsert_favorite's race handling.
            await session.rollback()
            user = await get_user_by_keycloak_sub(session, keycloak_sub)
            if user is None:
                raise
            user.email = claims.get("email")
            user.name = claims.get("name")
            await session.commit()
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
    """One analysis of the user's, by id. Takes the User the routes already
    hold; the id-taking form below is the same query."""
    return await _get_saved_analysis_by_id(session, user.id, saved_analysis_id)


async def _get_saved_analysis_by_session(
    session: AsyncSession, user_id: uuid.UUID, source_session: str
) -> SavedAnalysis | None:
    """Takes an id, not a User: the retry path runs after a rollback, which
    expires the ORM object and would turn `user.id` into a lazy load."""
    return await session.scalar(
        select(SavedAnalysis).where(
            SavedAnalysis.user_id == user_id,
            SavedAnalysis.source_session == source_session,
        )
    )


async def _get_saved_analysis_by_id(
    session: AsyncSession, user_id: uuid.UUID, saved_analysis_id: str
) -> SavedAnalysis | None:
    """Same user-id-not-User contract as the by-session lookup above, and the
    single implementation behind get_saved_analysis."""
    try:
        saved_analysis_uuid = uuid.UUID(saved_analysis_id)
    except ValueError:
        return None

    return await session.scalar(
        select(SavedAnalysis).where(
            SavedAnalysis.user_id == user_id,
            SavedAnalysis.id == saved_analysis_uuid,
        )
    )


async def upsert_saved_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    agent_message_history: list[dict[str, Any]],
    messages: list[dict[str, Any]],
    saved_analysis_id: str | None = None,
    schema: dict[str, Any],
    source_session: str,
    title: str,
) -> SavedAnalysis:
    """Write this conversation's current state, creating the row once.

    `saved_analysis_id` is the durable identity and wins when the session
    knows it. `source_session` is only a pointer to the currently-live Redis
    session, and reopening an analysis moves it -- so a session that resumed
    an analysis must not fall back to the pointer, or opening the same
    analysis on a second device would make each device insert its own row.

    The title is only set on insert -- a user who renames an analysis must
    not have it overwritten by the next turn.
    """
    if not source_session:
        # NULLs compare distinct, so a missing key would match nothing on the
        # SELECT and slip past the unique index -- a fresh row every turn
        # rather than the loud failure you'd want.
        raise ValueError("upsert_saved_analysis requires a source_session")

    by_session = await _get_saved_analysis_by_session(session, user_id, source_session)
    by_id = (
        await _get_saved_analysis_by_id(session, user_id, saved_analysis_id)
        if saved_analysis_id
        else None
    )
    existing = by_id or by_session
    if existing is None:
        created = SavedAnalysis(
            agent_message_history=agent_message_history,
            messages=messages,
            schema=schema,
            source_session=source_session,
            title=title,
            user_id=user_id,
        )
        session.add(created)
        try:
            await session.commit()
        except IntegrityError:
            # Race window: two turns of the same conversation land together,
            # both SELECT nothing, and the unique index rejects the second.
            # The caller is fail-open, so raising here would silently drop an
            # auto-save. Recover onto the winner's row instead.
            await session.rollback()
            by_session = await _get_saved_analysis_by_session(
                session, user_id, source_session
            )
            existing = by_session
            if existing is None:
                raise
        else:
            # No refresh: the factory sets expire_on_commit=False and every
            # value here is Python-side (uuid4, utcnow), so a re-SELECT of
            # three JSON columns on every turn buys nothing.
            return created

    existing.agent_message_history = agent_message_history
    existing.messages = messages
    existing.schema = schema
    if existing.source_session != source_session and by_session in (None, existing):
        # This session resumed the analysis, so point the row back at it. Only
        # safe while no *other* row holds this session id -- the partial unique
        # index on (user_id, source_session) would reject that, and a losing
        # write here costs the user the turn's auto-save.
        existing.source_session = source_session
    await session.commit()
    return existing


async def repoint_saved_analysis_session(
    session: AsyncSession,
    user: User,
    saved_analysis_id: str,
    source_session: str | None,
) -> SavedAnalysis | None:
    """Point an analysis at a freshly rehydrated Redis session."""
    analysis = await get_saved_analysis(session, user, saved_analysis_id)
    if analysis is None:
        return None
    analysis.source_session = source_session
    await session.commit()
    await session.refresh(analysis)
    return analysis


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


async def create_assistant_turn_log(
    session: AsyncSession, **fields: Any
) -> AssistantTurnLog:
    """Insert one turn-log row. Fields mirror AssistantTurnLog's columns.

    Kept generic rather than spelling out ~19 keyword params, which were a
    transcription of the column list and had to be edited in lockstep with it.
    """
    turn_log = AssistantTurnLog(**fields)
    session.add(turn_log)
    await session.commit()
    # No refresh: unlike the user-facing writes above, nothing reads this row
    # back and the factory sets expire_on_commit=False, so a re-SELECT on every
    # turn buys nothing.
    return turn_log


async def purge_assistant_turn_logs_before(
    session: AsyncSession, cutoff: datetime
) -> int:
    """Delete turn logs older than `cutoff`. Returns the number of rows removed."""
    result = await session.execute(
        delete(AssistantTurnLog).where(AssistantTurnLog.created_at < cutoff)
    )
    await session.commit()
    return result.rowcount or 0
