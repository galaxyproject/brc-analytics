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


async def record(state: SessionState) -> None:
    """Persist the current state of one conversation for its owner.

    Never raises. Every expression that touches `state` sits inside the
    try, so even a malformed session cannot cost the user their reply.
    """
    settings = get_settings()
    if not settings.DATABASE_URL:
        # No sink to write to. The chat endpoint authenticates via JWT alone
        # (get_optional_current_user), so a deployment with OIDC enabled and
        # DATABASE_URL unset is reachable -- without this, every authenticated
        # turn would log an exception and fire Sentry.
        return

    try:
        await asyncio.wait_for(
            _write(state),
            timeout=settings.ASSISTANT_AUTOSAVE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        # Reported, not just logged: a stalled write means the user's
        # conversation is quietly not being kept.
        logger.warning("Auto-save timed out for session %s", _session_label(state))
        sentry_sdk.capture_message("Assistant auto-save timed out", level="warning")
    except Exception:
        logger.exception(
            "Failed to auto-save analysis for session %s", _session_label(state)
        )
        sentry_sdk.capture_exception()


async def _write(state: SessionState) -> None:
    if state.owner_keycloak_sub is None:
        # Anonymous conversation -- no user to own the row yet. Signing in
        # claims the session and the next turn writes it.
        return

    if not any(message.role == MessageRole.USER for message in state.messages):
        # Nothing the user would recognise in a list.
        return

    async with db_session() as session:
        user = await get_user_by_keycloak_sub(session, state.owner_keycloak_sub)
        if user is None:
            return
        await upsert_saved_analysis(
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
            schema=strip_nuls(state.schema_state.model_dump(mode="json")),
            source_session=state.session_id,
            title=strip_nuls(_build_title(state)),
        )
