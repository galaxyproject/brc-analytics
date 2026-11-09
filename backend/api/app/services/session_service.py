import json
import logging
import uuid
from typing import Optional

from pydantic_core import to_json

from app.core.cache import CacheService
from app.models.assistant import AnalysisSchema, ChatMessage, SessionState

logger = logging.getLogger(__name__)

SESSION_PREFIX = "assistant:session"
SESSION_TTL = 7200  # 2 hours
BINDING_PREFIX = "assistant:binding"
# Outlives the session it guards, so a browser coming back to one that has just
# expired is still recognised and gets a fresh session rather than a refusal.
BINDING_TTL = 24 * 60 * 60


class SessionService:
    """Redis-backed session store for assistant conversations."""

    def __init__(self, cache: CacheService):
        self.cache = cache

    def _key(self, session_id: str) -> str:
        return f"{SESSION_PREFIX}:{session_id}"

    def _binding_key(self, session_id: str, binding: str) -> str:
        # Browser first, so one pattern finds every session a browser holds.
        return f"{BINDING_PREFIX}:{binding}:{session_id}"

    async def create_session(
        self,
        owner_keycloak_sub: str | None = None,
        *,
        schema_state: AnalysisSchema | None = None,
        messages: list[ChatMessage] | None = None,
        metadata: dict | None = None,
    ) -> SessionState:
        session_id = uuid.uuid4().hex
        state = SessionState(
            session_id=session_id,
            owner_keycloak_sub=owner_keycloak_sub,
            schema_state=schema_state or AnalysisSchema(),
            messages=messages or [],
            metadata=dict(metadata or {}),
        )
        await self._save(state)
        logger.info(f"Created assistant session {session_id}")
        return state

    async def get_session(self, session_id: str) -> Optional[SessionState]:
        # Strict read: a Redis outage has to surface as an error rather than as
        # None. get() fails open, which would report a live conversation as
        # expired and prompt the client to discard its only reference to it.
        raw = await self.cache.get_strict(self._key(session_id))
        if raw is None:
            return None
        try:
            return SessionState.model_validate(raw)
        except Exception:
            logger.exception(f"Failed to deserialize session {session_id}")
            return None

    async def save_session(self, state: SessionState) -> None:
        await self._save(state)

    async def touch_session(self, session_id: str) -> bool:
        """Reset a session's TTL without rewriting it.

        For a caller that read the session and has nothing to change: saving
        back the copy it read would overwrite any turn that landed in between.

        Returns False when the TTL was not reset -- the key expired after the
        caller read it, or Redis refused -- so the caller must not treat the
        session it read as still live.
        """
        return await self.cache.expire(self._key(session_id), SESSION_TTL)

    async def require_session(
        self, session_id: str, owner_keycloak_sub: str | None
    ) -> SessionState:
        state = await self.get_session(session_id)
        if state is None:
            raise KeyError(session_id)

        if state.owner_keycloak_sub != owner_keycloak_sub:
            raise PermissionError(session_id)

        return state

    async def claim_session(
        self, session_id: str, owner_keycloak_sub: str
    ) -> SessionState:
        """Stamp owner_keycloak_sub onto an anonymous session.

        Use when an authenticated user touches a session that was started
        anonymously -- the caller MUST have separately verified possession
        (the browser binding, see app/core/session_signing.py) before invoking
        this.

        Returns the (possibly updated) session. Raises KeyError if the
        session is missing and PermissionError if it is already owned by
        a different user.
        """
        state = await self.get_session(session_id)
        if state is None:
            raise KeyError(session_id)
        if state.owner_keycloak_sub is None:
            state.owner_keycloak_sub = owner_keycloak_sub
            await self._save(state)
            logger.info("Claimed anonymous assistant session %s for user", session_id)
        elif state.owner_keycloak_sub != owner_keycloak_sub:
            raise PermissionError(session_id)
        return state

    async def bind_browser(self, session_id: str, binding: str) -> None:
        """Let the browser with this binding use the session.

        A key of its own, so no rewrite of the session can drop it. Raises
        RedisError: a binding that silently failed would refuse the next request.
        """
        await self.cache.set_strict(
            self._binding_key(session_id, binding), 1, BINDING_TTL
        )

    async def is_browser_bound(self, session_id: str, binding: str) -> bool:
        """Whether the browser may use the session, keeping its binding alive if so.

        Raises RedisError, so an outage isn't mistaken for "not yours".
        """
        return await self.cache.expire_strict(
            self._binding_key(session_id, binding), BINDING_TTL
        )

    async def unbind_browser(self, binding: str) -> int:
        """Drop every session binding the browser holds; returns how many.

        Best effort: a Redis error is logged, and bindings left behind expire.
        """
        return await self.cache.clear_pattern(f"{BINDING_PREFIX}:{binding}:*")

    async def delete_session(self, session_id: str) -> bool:
        return await self.cache.delete(self._key(session_id))

    async def _save(self, state: SessionState) -> None:
        data = json.loads(to_json(state))
        await self.cache.set(self._key(state.session_id), data, ttl=SESSION_TTL)
