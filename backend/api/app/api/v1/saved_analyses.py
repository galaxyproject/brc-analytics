from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_assistant_agent, get_current_user_db
from app.core.session_signing import set_session_cookie
from app.db.crud import (
    delete_saved_analysis,
    get_saved_analysis,
    list_saved_analyses_for_user,
    repoint_saved_analysis_session,
)
from app.db.models import User
from app.db.session import get_db_session
from app.models.assistant import AnalysisSchema, ChatMessage
from app.models.user_data import (
    SavedAnalysisDetail,
    SavedAnalysisRestoreResponse,
    SavedAnalysisSummary,
)

router = APIRouter()


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


@router.post("/{saved_analysis_id}/open", response_model=SavedAnalysisRestoreResponse)
async def open_saved_analysis(
    saved_analysis_id: str,
    response: Response,
    current_user_db: User = Depends(get_current_user_db),
    agent=Depends(get_assistant_agent),
    session: AsyncSession = Depends(get_db_session),
) -> SavedAnalysisRestoreResponse:
    """Resume a saved conversation, continuing the same analysis.

    The Redis session behind an analysis expires after two hours, so opening
    one mints a fresh session and repoints the row at it. The analysis keeps
    its id -- resuming is not a new analysis.
    """
    saved_analysis = await get_saved_analysis(
        session, current_user_db, saved_analysis_id
    )
    if saved_analysis is None:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    restored_state = await agent.restore_saved_session(
        agent_message_history=saved_analysis.agent_message_history,
        messages=[
            ChatMessage.model_validate(message) for message in saved_analysis.messages
        ],
        owner_keycloak_sub=current_user_db.keycloak_sub,
        schema_state=AnalysisSchema.model_validate(saved_analysis.schema),
    )
    await repoint_saved_analysis_session(
        session, current_user_db, saved_analysis_id, restored_state.session_id
    )
    # Bind the session to this browser so the frontend can hydrate computed
    # handoff state from GET /assistant/session/{id}.
    set_session_cookie(response, restored_state.session_id)
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
