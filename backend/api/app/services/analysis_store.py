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

import logging

import sentry_sdk
from pydantic_core import to_jsonable_python

from app.db.crud import get_user_by_keycloak_sub, upsert_saved_analysis
from app.db.session import db_session
from app.models.assistant import MessageRole, SessionState

logger = logging.getLogger(__name__)

TITLE_MAX_LENGTH = 80


def _build_title(state: SessionState) -> str:
    """The first thing the user asked, which is what they will recognise."""
    for message in state.messages:
        if message.role == MessageRole.USER:
            return message.content[:TITLE_MAX_LENGTH]
    return "Saved analysis"


async def record(state: SessionState) -> None:
    """Persist the current state of one conversation for its owner."""
    if state.owner_keycloak_sub is None:
        # Anonymous conversation -- no user to own the row yet. Signing in
        # claims the session and the next turn writes it.
        return

    if not any(message.role == MessageRole.USER for message in state.messages):
        # Nothing the user would recognise in a list.
        return

    try:
        async with db_session() as session:
            user = await get_user_by_keycloak_sub(session, state.owner_keycloak_sub)
            if user is None:
                return
            await upsert_saved_analysis(
                session,
                user,
                agent_message_history=to_jsonable_python(state.agent_message_history),
                messages=[
                    message.model_dump(mode="json") for message in state.messages
                ],
                schema=state.schema_state.model_dump(mode="json"),
                source_session=state.session_id,
                title=_build_title(state),
            )
    except Exception:
        logger.exception(
            "Failed to auto-save analysis for session %s", state.session_id
        )
        sentry_sdk.capture_exception()
