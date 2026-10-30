import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_current_user_db
from app.db.crud import get_user_by_keycloak_sub, list_kmindex_submissions_for_user
from app.db.models import User
from app.db.session import db_session, get_db_session
from app.models.logan import LoganSearchPage, LoganSearchRecord
from app.models.user_data import UserMeResponse, UserPreferences

router = APIRouter()

MAX_PREFERENCES_BYTES = 16 * 1024


@router.get("/me", response_model=UserMeResponse)
async def user_me(
    current_user: UserMeResponse = Depends(get_current_user),
    current_user_db: User = Depends(get_current_user_db),
) -> UserMeResponse:
    return current_user.model_copy(
        update={
            "preferences": UserPreferences.model_validate(current_user_db.preferences)
        }
    )


@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(
    current_user_db: User = Depends(get_current_user_db),
) -> UserPreferences:
    return UserPreferences.model_validate(current_user_db.preferences)


@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    request: Request,
    preferences: UserPreferences,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> UserPreferences:
    # Best-effort early rejection from the Content-Length header. FastAPI has
    # already parsed the body by the time we get here, so this is just a fast
    # 413 in the common case; the serialized-size check below is authoritative
    # (Content-Length can be missing or lie).
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_PREFERENCES_BYTES:
                raise HTTPException(
                    status_code=413, detail="Preferences payload too large"
                )
        except ValueError:
            pass

    payload = preferences.model_dump(mode="json")
    serialized_payload = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    if len(serialized_payload) > MAX_PREFERENCES_BYTES:
        raise HTTPException(status_code=413, detail="Preferences payload too large")

    current_user_db.preferences = payload
    session.add(current_user_db)
    await session.commit()
    await session.refresh(current_user_db)
    return UserPreferences.model_validate(current_user_db.preferences)


@router.get("/logan_searches", response_model=LoganSearchPage)
async def list_logan_searches(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UserMeResponse = Depends(get_current_user),
) -> LoganSearchPage:
    """
    The signed-in user's Logan searches, newest first.

    Opens its own session instead of taking get_db_session, so a server with
    no database answers a plain 503 rather than a 500 from the dependency.
    """
    if not get_settings().DATABASE_URL:
        raise HTTPException(
            status_code=503, detail="Search history is not available on this server"
        )
    async with db_session() as db:
        user = await get_user_by_keycloak_sub(db, current_user.sub)
        # Signed in but never provisioned means nothing was ever recorded
        # against them, which is an empty history, not an error.
        if user is None:
            return LoganSearchPage(searches=[], total=0, limit=limit, offset=offset)
        rows, total = await list_kmindex_submissions_for_user(
            db, user.id, limit=limit, offset=offset
        )
    return LoganSearchPage(
        searches=[
            LoganSearchRecord(
                job_id=row.galaxy_job_id,
                indexes=list(row.indexes or []),
                query_bases=row.query_bases,
                threshold=row.threshold,
                created_at=row.created_at,
            )
            for row in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )
