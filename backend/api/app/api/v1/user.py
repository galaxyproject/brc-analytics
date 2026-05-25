import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_user_db
from app.db.models import User
from app.db.session import get_db_session
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
    # Reject obviously-oversized payloads before they're parsed. The
    # serialized check below is still authoritative for cases where
    # Content-Length is missing or lies, but this saves Pydantic from
    # parsing a pathological 100MB blob in the common case.
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
