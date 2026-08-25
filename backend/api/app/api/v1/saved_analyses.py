from typing import Any

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
from app.db.models import SavedAnalysis, User
from app.db.session import get_db_session
from app.models.assistant import AnalysisSchema, ChatMessage, SessionState
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
    an expired one mints a fresh session and repoints the row at it. A session
    that is still alive is handed back as-is: minting a second one would strand
    whichever device still holds the first, and its next turn -- finding no row
    for that session -- would start a second copy of the same analysis.

    Either way the analysis keeps its id, and the session carries that id from
    here on, so auto-saves land back on this row however often it is reopened.
    """
    saved_analysis = await get_saved_analysis(
        session, current_user_db, saved_analysis_id
    )
    if saved_analysis is None:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    durable_id = str(saved_analysis.id)
    restored_state = await _live_session(agent, saved_analysis, current_user_db)
    if restored_state is None:
        restored_state = await agent.restore_saved_session(
            agent_message_history=saved_analysis.agent_message_history,
            messages=[
                ChatMessage.model_validate(message)
                for message in saved_analysis.messages
            ],
            owner_keycloak_sub=current_user_db.keycloak_sub,
            saved_analysis_id=durable_id,
            schema_state=AnalysisSchema.model_validate(saved_analysis.schema),
        )
        await repoint_saved_analysis_session(
            session, current_user_db, saved_analysis_id, restored_state.session_id
        )
    elif restored_state.saved_analysis_id != durable_id:
        # An analysis saved from a conversation that was never reopened has a
        # live session that predates its row. Teach it its own id now, so a
        # later reopen elsewhere cannot orphan it.
        restored_state.saved_analysis_id = durable_id
        await agent.session_service.save_session(restored_state)
    # Bind the session to this browser so the frontend can hydrate computed
    # handoff state from GET /assistant/session/{id}.
    set_session_cookie(response, restored_state.session_id)
    return SavedAnalysisRestoreResponse(session_id=restored_state.session_id)


async def _live_session(
    agent: Any, saved_analysis: SavedAnalysis, user: User
) -> SessionState | None:
    """The analysis's current Redis session, if it is still there and ours.

    A Redis failure is left to propagate: treating it as "no live session"
    would repoint the row and hand back a duplicate conversation, which is
    the failure this reuse exists to prevent.
    """
    if not saved_analysis.source_session:
        return None
    state = await agent.session_service.get_session(saved_analysis.source_session)
    if state is None:
        return None
    if state.owner_keycloak_sub != user.keycloak_sub:
        # Not reachable through the row (it is user-scoped), but reusing a
        # session is handing someone a live conversation -- check anyway.
        return None
    return state


@router.delete("/{saved_analysis_id}", status_code=204)
async def remove_saved_analysis(
    saved_analysis_id: str,
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    deleted = await delete_saved_analysis(session, current_user_db, saved_analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved analysis not found")
