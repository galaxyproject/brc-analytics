from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_user_db
from app.db.models import User
from app.db.session import get_db_session
from app.models.user_data import UserMeResponse, UserPreferences

router = APIRouter()


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
    preferences: UserPreferences,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> UserPreferences:
    current_user_db.preferences = preferences.model_dump(mode="json")
    session.add(current_user_db)
    await session.commit()
    await session.refresh(current_user_db)
    return UserPreferences.model_validate(current_user_db.preferences)
