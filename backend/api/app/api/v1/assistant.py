import logging
from typing import Optional
from uuid import uuid4

import sentry_sdk
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic_ai.exceptions import (
    AgentRunError,
    ConcurrencyLimitExceeded,
    ModelHTTPError,
    UsageLimitExceeded,
)

from app.core.config import SESSION_COOKIE_NAME
from app.core.dependencies import (
    check_rate_limit,
    get_assistant_agent,
    get_current_user,
    get_optional_current_user,
)
from app.core.session_signing import require_session_cookie, set_session_cookie
from app.models.assistant import (
    AssistantInfoResponse,
    ChatRequest,
    ChatResponse,
    SessionRestoreResponse,
    SessionSaveResponse,
)
from app.models.user_data import UserMeResponse
from app.services import analysis_store, turn_log
from app.services.assistant_agent import (
    AssistantTimeoutError,
    AssistantUnavailableError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/info", response_model=AssistantInfoResponse)
async def assistant_info(
    agent=Depends(get_assistant_agent),
):
    """Surface assistant configuration for UI attribution (model + provider)."""
    available = agent.is_available()
    settings = agent.settings
    return AssistantInfoResponse(
        available=available,
        model=settings.AI_PRIMARY_MODEL if available else None,
        provider=agent.get_provider() if available else None,
        # Same predicate the writer uses, so the notice can never disagree
        # with whether we are actually keeping anything.
        turn_log_retention_days=turn_log.active_retention_days(settings),
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

    # Minted here so a Sentry event raised inside the run carries the same id
    # as the row we write for it, and the two can actually be joined.
    turn_id = uuid4()
    sentry_sdk.set_tag("assistant.turn_id", str(turn_id))

    try:
        chat_response, _telemetry = await agent.chat_with_telemetry(
            request.message,
            request.session_id,
            current_user.sub if current_user else None,
            turn_id=turn_id,
            # The agent records the turn itself, success or failure -- it is
            # the only layer that knows the session it created before a
            # failure. Awaited inline: the insert is milliseconds against a
            # turn that spends seconds in inference.
            on_turn=turn_log.record,
        )
    except AssistantTimeoutError as e:
        logger.exception("Assistant chat timed out")
        raise HTTPException(status_code=504, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail="Assistant session belongs to another user",
        ) from e
    except AssistantUnavailableError as e:
        # The one case where "unavailable" is the truth. Narrowed from a bare
        # RuntimeError catch, which also swallowed unrelated runtime bugs and
        # returned their messages to the client.
        logger.exception("Assistant chat unavailable (not configured)")
        raise HTTPException(
            status_code=503, detail="The analysis assistant is not configured"
        ) from e
    except ModelHTTPError as e:
        # Upstream said no. Keep its meaning: throttling stays throttling and an
        # upstream outage stays an outage, both of which are worth retrying and
        # both of which the client already has distinct messaging for. Only a
        # provider 4xx we can't act on falls through to a generic failure.
        logger.exception("Assistant model call failed upstream (%s)", e.status_code)
        if e.status_code == 429:
            raise HTTPException(
                status_code=429, detail="The assistant is rate limited right now"
            ) from e
        if e.status_code >= 500:
            raise HTTPException(
                status_code=503, detail="The assistant's model provider is unavailable"
            ) from e
        raise HTTPException(
            status_code=500, detail="The assistant could not complete that request"
        ) from e
    except (UsageLimitExceeded, ConcurrencyLimitExceeded) as e:
        # A cap we set, not a broken run: retrying later is the right advice.
        logger.exception("Assistant chat hit a usage or concurrency limit")
        raise HTTPException(
            status_code=429, detail="The assistant is at capacity right now"
        ) from e
    except AgentRunError as e:
        # What's left is the run itself going wrong -- a tool exhausting its
        # retries, unparseable model output. One broken turn, not an outage, and
        # not worth retrying: the same question fails the same way.
        logger.exception("Assistant chat run failed")
        raise HTTPException(
            status_code=500, detail="The assistant could not complete that request"
        ) from e
    except Exception as e:
        logger.exception("Assistant chat error")
        raise HTTPException(status_code=500, detail="Internal assistant error") from e

    # Auto-save for signed-in users. Read back rather than threading state out
    # of the agent, which stays DB-agnostic; the store is fail-open and the
    # read back is guarded, so nothing here can cost the user their reply.
    if current_user:
        try:
            state = await agent.session_service.get_session(chat_response.session_id)
            if state is not None:
                # Reported back so the UI can say "saved" on an acknowledgement
                # rather than on the assumption that being signed in means kept.
                chat_response.saved = await analysis_store.record(state)
        except Exception:
            # get_session reads Redis strictly and raises on a blip, so
            # without this a cache hiccup would 500 a turn whose reply already
            # succeeded -- the one thing the auto-save must never do.
            logger.exception("Failed to auto-save session %s", chat_response.session_id)

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

    # Reconcile the persisted schema against the current catalog before deciding
    # handoff. The chat path does this every turn; restore read the stored state
    # directly, so without it a session whose workflow was since removed from the
    # catalog would still yield a handoff URL from its stale detail (sol review).
    schema_state = agent.reconcile_schema(state.schema_state)
    # Re-derive suggestions from the reconciled schema too: the persisted chips
    # can be inconsistent with a schema that just lost a removed workflow (e.g. a
    # stale "continue to handoff" chip), which would steer the user down an
    # invalid path (Copilot). This is the same derivation the chat path runs.
    suggestions = agent._derive_suggestions(schema_state)
    is_complete, handoff_url = agent.compute_handoff(
        schema_state, session_id=state.session_id
    )
    return SessionRestoreResponse(
        session_id=state.session_id,
        messages=state.messages,
        schema_state=schema_state,
        suggestions=suggestions,
        is_complete=is_complete,
        handoff_url=handoff_url,
    )


@router.post("/session/{session_id}/save", response_model=SessionSaveResponse)
async def save_session_to_account(
    session_id: str,
    session_cookie: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    current_user: UserMeResponse = Depends(get_current_user),
    agent=Depends(get_assistant_agent),
) -> SessionSaveResponse:
    """Claim this conversation for the signed-in user and save it now.

    Auto-save rides on chat turns, which leaves a gap the UI cannot honestly
    paper over: a user who signs in *because* we offered to keep the
    conversation has not sent a turn since, so nothing has been written and
    the session dies with its two-hour Redis TTL. This closes that gap, and
    unlike the per-turn write it reports failure rather than swallowing it.
    """
    require_session_cookie(session_id, session_cookie)

    try:
        state = await agent.session_service.claim_session(session_id, current_user.sub)
    except KeyError as e:
        raise HTTPException(
            status_code=404, detail="Session not found or expired"
        ) from e
    except PermissionError as e:
        raise HTTPException(
            status_code=403, detail="Assistant session belongs to another user"
        ) from e

    try:
        saved_analysis_id = await analysis_store.persist(state)
    except Exception as e:
        logger.exception("Failed to save session %s to account", session_id)
        raise HTTPException(
            status_code=503, detail="Could not save this conversation"
        ) from e

    if saved_analysis_id is None:
        # An empty conversation has nothing worth listing. Not an error, but
        # the caller must not be told it was saved.
        raise HTTPException(status_code=409, detail="Nothing to save yet")

    return SessionSaveResponse(saved_analysis_id=saved_analysis_id)


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
