import logging
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from app.core.config import SESSION_COOKIE_NAME
from app.core.dependencies import (
    check_rate_limit,
    get_assistant_agent,
    get_optional_current_user,
)
from app.core.session_signing import require_session_cookie, set_session_cookie
from app.models.assistant import (
    AssistantInfoResponse,
    ChatRequest,
    ChatResponse,
    SessionRestoreResponse,
)
from app.models.user_data import UserMeResponse
from app.services.assistant_agent import AssistantTimeoutError

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
    response: Response,
    agent=Depends(get_assistant_agent),
    _rate_limit=Depends(check_rate_limit),
    current_user: UserMeResponse | None = Depends(get_optional_current_user),
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
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

    # Continuing an existing session requires proof the same browser holds
    # it -- possession of the signed session cookie. Session IDs travel in
    # URLs (e.g. the assistantSessionId handoff param), so knowing the id
    # alone must not let a caller continue or mutate a session, anonymous or
    # owned. No-ops in local/dev where SESSION_COOKIE_SECRET is unset.
    if request.session_id:
        require_session_cookie(request.session_id, session_cookie)

    # If an authenticated user is continuing a session that started
    # anonymously, claim it on their behalf.
    if current_user and request.session_id:
        try:
            await agent.session_service.claim_session(
                request.session_id, current_user.sub
            )
        except KeyError:
            # Session expired between cookie issuance and now -- agent.chat()
            # will create a fresh one for this user below.
            pass
        except PermissionError as e:
            raise HTTPException(
                status_code=403,
                detail="Assistant session belongs to another user",
            ) from e

    try:
        chat_response = await agent.chat(
            request.message,
            request.session_id,
            current_user.sub if current_user else None,
        )
    except AssistantTimeoutError as e:
        logger.exception("Assistant chat timed out")
        raise HTTPException(status_code=504, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail="Assistant session belongs to another user",
        ) from e
    except RuntimeError as e:
        logger.exception("Assistant chat unavailable (RuntimeError)")
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("Assistant chat error")
        raise HTTPException(status_code=500, detail="Internal assistant error") from e

    set_session_cookie(response, chat_response.session_id)
    return chat_response


@router.get("/session/{session_id}", response_model=SessionRestoreResponse)
async def restore_session(
    session_id: str,
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    agent=Depends(get_assistant_agent),
):
    """Restore a previous assistant session (messages, schema, suggestions)."""
    require_session_cookie(session_id, session_cookie)
    try:
        state = await agent.session_service.get_session(session_id)
    except Exception as e:
        logger.exception("Failed to restore session %s", session_id)
        raise HTTPException(status_code=500, detail="Failed to restore session") from e
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    is_complete, handoff_url = agent.compute_handoff(
        state.schema_state, session_id=state.session_id
    )
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
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    agent=Depends(get_assistant_agent),
):
    """Delete an assistant session."""
    require_session_cookie(session_id, session_cookie)
    try:
        await agent.session_service.delete_session(session_id)
    except Exception:
        logger.exception("Failed to delete session %s", session_id)
    return Response(status_code=204)
