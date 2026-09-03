"""Auto-saves an authenticated user's assistant conversations.

Called from the chat endpoint after a successful turn, deliberately not from
the agent -- `chat_with_telemetry` stays DB-agnostic, the same split
`turn_log` uses.

Writes are fail-open. Losing an auto-save must never cost a user their reply,
so every failure here is reported and swallowed.

Distinct from `assistant_turn_log`: that table is observability, keyed by
turn, retained on a sweep, and never shown to a user. This one is the
user-facing record of a conversation, one row for its whole life.
"""

from __future__ import annotations

import asyncio
import logging

import sentry_sdk
from pydantic_core import to_jsonable_python

from app.core.config import get_settings
from app.db.crud import get_user_by_keycloak_sub, upsert_saved_analysis
from app.db.session import db_session
from app.models.assistant import MessageRole, SessionState
from app.services.sanitize import strip_nuls

logger = logging.getLogger(__name__)

TITLE_MAX_LENGTH = 80


class UnprovisionedUserError(Exception):
    """The session's owner has no users row.

    Distinct from "nothing to save": the conversation is fine and the caller
    is authenticated, but there is no account to hang the row on -- a DB
    restore or a manual cleanup, which `get_current_user_db` already treats as
    reachable. Without this it looked identical to an empty conversation.
    """


def _session_label(state: SessionState) -> str | None:
    """Best-effort session id for the error paths, which must not raise."""
    try:
        return state.session_id
    except Exception:
        return None


def _build_title(state: SessionState) -> str:
    """The first thing the user asked, which is what they will recognise."""
    for message in state.messages:
        if message.role == MessageRole.USER:
            return message.content[:TITLE_MAX_LENGTH]
    return "Saved analysis"


async def record(state: SessionState) -> str | None:
    """Persist the current state of one conversation for its owner.

    Never raises. Every expression that touches `state` sits inside the
    try, so even a malformed session cannot cost the user their reply.

    Returns the saved analysis id, so the UI can say a conversation is saved
    because it was told so rather than because it inferred it, and so the
    caller can stamp that id onto the session.
    """
    try:
        settings = get_settings()
        if not settings.DATABASE_URL:
            # No sink to write to. The chat endpoint authenticates via JWT
            # alone (get_optional_current_user), so a deployment with OIDC
            # enabled and DATABASE_URL unset is reachable -- without this,
            # every authenticated turn would log an exception and fire Sentry.
            return None

        return await asyncio.wait_for(
            _write(state),
            timeout=settings.ASSISTANT_AUTOSAVE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        # Reported, not just logged: a stalled write means the user's
        # conversation is quietly not being kept.
        logger.warning("Auto-save timed out for session %s", _session_label(state))
        sentry_sdk.capture_message("Assistant auto-save timed out", level="warning")
        return None
    except UnprovisionedUserError:
        # Every turn of this conversation will fail the same way, and silently
        # before now: the user is authenticated against a users row that is
        # gone, so nothing is being kept for them at all.
        logger.exception(
            "Auto-save found no user row for session %s", _session_label(state)
        )
        sentry_sdk.capture_exception()
        return None
    except Exception:
        logger.exception(
            "Failed to auto-save analysis for session %s", _session_label(state)
        )
        sentry_sdk.capture_exception()
        return None


async def persist(state: SessionState) -> str | None:
    """Save on the user's explicit instruction, surfacing failures.

    The fail-open contract above is right for a background write riding on a
    chat turn, but wrong when the user asked for this and is being told the
    result: a swallowed error there becomes a promise we did not keep.

    Returns the saved analysis id, or None when there is nothing to save.
    """
    if not get_settings().DATABASE_URL:
        raise RuntimeError("Saving analyses requires DATABASE_URL")
    return await _write(state)


async def _write(state: SessionState) -> str | None:
    if state.owner_keycloak_sub is None:
        # Anonymous conversation -- no user to own the row yet. Signing in
        # claims the session and persists it.
        return None

    if not any(message.role == MessageRole.USER for message in state.messages):
        # Nothing the user would recognise in a list.
        return None

    async with db_session() as session:
        user = await get_user_by_keycloak_sub(session, state.owner_keycloak_sub)
        if user is None:
            raise UnprovisionedUserError(state.owner_keycloak_sub)
        saved = await upsert_saved_analysis(
            session,
            user,
            # Every field here is rewritten in full on every turn, so one
            # unscrubbed NUL would poison all future auto-saves for this
            # conversation, not just the turn it arrived on.
            agent_message_history=strip_nuls(
                to_jsonable_python(state.agent_message_history)
            ),
            messages=strip_nuls(
                [message.model_dump(mode="json") for message in state.messages]
            ),
            saved_analysis_id=state.saved_analysis_id,
            schema=strip_nuls(state.schema_state.model_dump(mode="json")),
            source_session=state.session_id,
            title=strip_nuls(_build_title(state)),
        )
        return str(saved.id)
