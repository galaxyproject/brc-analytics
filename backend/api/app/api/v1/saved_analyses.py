from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_assistant_agent, get_current_user_db
from app.db.crud import (
    create_saved_analysis,
    delete_saved_analysis,
    get_saved_analysis,
    list_saved_analyses_for_user,
)
from app.db.models import User
from app.db.session import get_db_session
from app.models.assistant import AnalysisSchema, ChatMessage
from app.models.user_data import (
    SaveAnalysisRequest,
    SavedAnalysisDetail,
    SavedAnalysisRestoreResponse,
    SavedAnalysisSummary,
)

router = APIRouter()


def _build_default_title(messages: list[ChatMessage]) -> str:
    first_user_message = next(
        (message for message in messages if message.role == "user"), None
    )
    if first_user_message is None:
        return "Saved analysis"
    return first_user_message.content[:80]


@router.get("", response_model=list[SavedAnalysisSummary])
async def get_saved_analysis_list(
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> list[SavedAnalysisSummary]:
    saved_analyses = await list_saved_analyses_for_user(session, current_user_db)
    return [
        SavedAnalysisSummary.model_validate(saved_analysis, from_attributes=True)
        for saved_analysis in saved_analyses
    ]


@router.post("", response_model=SavedAnalysisSummary)
async def save_analysis_snapshot(
    payload: SaveAnalysisRequest,
    current_user_db: User = Depends(get_current_user_db),
    agent=Depends(get_assistant_agent),
    session: AsyncSession = Depends(get_db_session),
) -> SavedAnalysisSummary:
    try:
        state = await agent.session_service.require_session(
            payload.session_id, current_user_db.keycloak_sub
        )
    except KeyError as err:
        raise HTTPException(
            status_code=404, detail="Assistant session not found"
        ) from err
    except PermissionError as err:
        raise HTTPException(
            status_code=403, detail="Assistant session does not belong to this user"
        ) from err

    saved_analysis = await create_saved_analysis(
        session,
        current_user_db,
        title=payload.title or _build_default_title(state.messages),
        schema=state.schema_state.model_dump(mode="json"),
        messages=[message.model_dump(mode="json") for message in state.messages],
        source_session=state.session_id,
    )
    return SavedAnalysisSummary.model_validate(saved_analysis, from_attributes=True)


@router.get("/{saved_analysis_id}", response_model=SavedAnalysisDetail)
async def get_saved_analysis_detail(
    saved_analysis_id: str,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> SavedAnalysisDetail:
    saved_analysis = await get_saved_analysis(
        session, current_user_db, saved_analysis_id
    )
    if saved_analysis is None:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    return SavedAnalysisDetail(
        created_at=saved_analysis.created_at,
        id=str(saved_analysis.id),
        messages=[
            ChatMessage.model_validate(message) for message in saved_analysis.messages
        ],
        schema=AnalysisSchema.model_validate(saved_analysis.schema),
        source_session=saved_analysis.source_session,
        title=saved_analysis.title,
        updated_at=saved_analysis.updated_at,
    )


@router.post(
    "/{saved_analysis_id}/restore", response_model=SavedAnalysisRestoreResponse
)
async def restore_saved_analysis(
    saved_analysis_id: str,
    current_user_db: User = Depends(get_current_user_db),
    agent=Depends(get_assistant_agent),
    session: AsyncSession = Depends(get_db_session),
) -> SavedAnalysisRestoreResponse:
    saved_analysis = await get_saved_analysis(
        session, current_user_db, saved_analysis_id
    )
    if saved_analysis is None:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    restored_state = await agent.restore_saved_session(
        owner_keycloak_sub=current_user_db.keycloak_sub,
        schema_state=AnalysisSchema.model_validate(saved_analysis.schema),
        messages=[
            ChatMessage.model_validate(message) for message in saved_analysis.messages
        ],
    )
    return SavedAnalysisRestoreResponse(session_id=restored_state.session_id)


@router.delete("/{saved_analysis_id}", status_code=204)
async def remove_saved_analysis(
    saved_analysis_id: str,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    deleted = await delete_saved_analysis(session, current_user_db, saved_analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved analysis not found")
