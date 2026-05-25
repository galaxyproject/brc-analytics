from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_db
from app.db.crud import delete_favorite, list_favorites_for_user, upsert_favorite
from app.db.models import User
from app.db.session import get_db_session
from app.models.user_data import FavoritePayload, FavoriteResponse

router = APIRouter()


@router.get("", response_model=list[FavoriteResponse])
async def get_favorites(
    entity_type: str = Query(default="assembly"),
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> list[FavoriteResponse]:
    favorites = await list_favorites_for_user(
        session, current_user_db, entity_type=entity_type
    )
    return [
        FavoriteResponse.model_validate(favorite, from_attributes=True)
        for favorite in favorites
    ]


@router.post("", response_model=FavoriteResponse)
async def create_favorite(
    payload: FavoritePayload,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> FavoriteResponse:
    favorite = await upsert_favorite(
        session,
        current_user_db,
        payload.entity_type,
        payload.entity_id,
    )
    return FavoriteResponse.model_validate(favorite, from_attributes=True)


@router.delete("/{entity_type}/{entity_id}", status_code=204)
async def remove_favorite(
    entity_type: str,
    entity_id: str,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    deleted = await delete_favorite(session, current_user_db, entity_type, entity_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
