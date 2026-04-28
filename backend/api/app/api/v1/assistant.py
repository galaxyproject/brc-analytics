import logging

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.dependencies import check_rate_limit, get_assistant_agent
from app.models.assistant import (
    AssistantInfoResponse,
    ChatRequest,
    ChatResponse,
    SessionRestoreResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/info", response_model=AssistantInfoResponse)
async def assistant_info(
    agent=Depends(get_assistant_agent),
):
    """Surface assistant configuration for UI attribution (model + provider)."""
    available = agent.is_available()
    return AssistantInfoResponse(
        available=available,
        model=agent.settings.AI_PRIMARY_MODEL if available else None,
        provider=agent.get_provider() if available else None,
    )


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(
    request: ChatRequest,
    agent=Depends(get_assistant_agent),
    _rate_limit=Depends(check_rate_limit),
):
    """Send a message to the analysis assistant and get a reply.

    Provide a session_id to continue an existing conversation, or omit it
    to start a new session.
    """
    if not agent.is_available():
        raise HTTPException(
            status_code=503,
            detail="Analysis assistant is unavailable (LLM not configured)",
        )

    try:
        response = await agent.chat(request.message, request.session_id)
        return response
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Assistant chat error")
        raise HTTPException(status_code=500, detail="Internal assistant error")


@router.get("/session/{session_id}", response_model=SessionRestoreResponse)
async def restore_session(
    session_id: str,
    agent=Depends(get_assistant_agent),
):
    """Restore a previous assistant session (messages, schema, suggestions)."""
    try:
        state = await agent.session_service.get_session(session_id)
    except Exception:
        logger.exception("Failed to restore session %s", session_id)
        raise HTTPException(status_code=500, detail="Failed to restore session")
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    is_complete, handoff_url = agent.compute_handoff(state.schema_state)
    return SessionRestoreResponse(
        session_id=state.session_id,
        messages=state.messages,
        schema_state=state.schema_state,
        suggestions=state.suggestions,
        is_complete=is_complete,
        handoff_url=handoff_url,
    )


@router.delete("/session/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    agent=Depends(get_assistant_agent),
):
    """Delete an assistant session."""
    try:
        await agent.session_service.delete_session(session_id)
    except Exception:
        logger.exception("Failed to delete session %s", session_id)
    return Response(status_code=204)
