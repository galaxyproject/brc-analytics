import logging
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from app.core.config import get_settings
from app.core.dependencies import check_rate_limit, get_assistant_agent
from app.core.session_signing import sign_session_id, verify_session_id
from app.models.assistant import (
    AssistantInfoResponse,
    ChatRequest,
    ChatResponse,
    SessionRestoreResponse,
)
from app.services.assistant_agent import AssistantTimeoutError

logger = logging.getLogger(__name__)

# Read once at import time so the Cookie(alias=...) below stays in lockstep
# with what _set_session_cookie writes -- avoids the set/read mismatch if
# SESSION_COOKIE_NAME ever becomes env-driven.
SESSION_COOKIE_NAME = get_settings().SESSION_COOKIE_NAME

router = APIRouter()


def _verify_session_cookie(session_id: str, cookie_value: Optional[str]) -> None:
    """Raise 403 unless the cookie's HMAC matches session_id.

    If no SESSION_COOKIE_SECRET is configured (legacy/local-dev mode), all
    requests are allowed -- the binding is opt-in via env var.
    """
    settings = get_settings()
    if not settings.SESSION_COOKIE_SECRET:
        return
    if not verify_session_id(
        session_id, cookie_value or "", settings.SESSION_COOKIE_SECRET
    ):
        raise HTTPException(status_code=403, detail="Invalid session cookie")


def _set_session_cookie(response: Response, session_id: str) -> None:
    """Issue an httpOnly Same-Site=Strict cookie binding the session to this client."""
    settings = get_settings()
    if not settings.SESSION_COOKIE_SECRET:
        return
    # Only allow plain-HTTP cookies in local/dev. Anywhere else (staging,
    # prod, anything that could ever see a non-TLS hop) must mark the
    # cookie Secure so the browser refuses to send it over HTTP.
    insecure_ok = settings.ENVIRONMENT.lower() in ("local", "dev", "development")
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=sign_session_id(session_id, settings.SESSION_COOKIE_SECRET),
        max_age=settings.SESSION_COOKIE_TTL,
        httponly=True,
        samesite="strict",
        secure=not insecure_ok,
    )


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
        chat_response = await agent.chat(request.message, request.session_id)
    except AssistantTimeoutError as e:
        logger.exception("Assistant chat timed out")
        raise HTTPException(status_code=504, detail=str(e)) from e
    except RuntimeError as e:
        logger.exception("Assistant chat unavailable (RuntimeError)")
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("Assistant chat error")
        raise HTTPException(status_code=500, detail="Internal assistant error") from e

    _set_session_cookie(response, chat_response.session_id)
    return chat_response


@router.get("/session/{session_id}", response_model=SessionRestoreResponse)
async def restore_session(
    session_id: str,
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    agent=Depends(get_assistant_agent),
):
    """Restore a previous assistant session (messages, schema, suggestions)."""
    _verify_session_cookie(session_id, session_cookie)
    try:
        state = await agent.session_service.get_session(session_id)
    except Exception as e:
        logger.exception("Failed to restore session %s", session_id)
        raise HTTPException(status_code=500, detail="Failed to restore session") from e
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
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    agent=Depends(get_assistant_agent),
):
    """Delete an assistant session."""
    _verify_session_cookie(session_id, session_cookie)
    try:
        await agent.session_service.delete_session(session_id)
    except Exception:
        logger.exception("Failed to delete session %s", session_id)
    return Response(status_code=204)
