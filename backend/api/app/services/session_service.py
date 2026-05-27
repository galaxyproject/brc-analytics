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


class SessionService:
    """Redis-backed session store for assistant conversations."""

    def __init__(self, cache: CacheService):
        self.cache = cache

    def _key(self, session_id: str) -> str:
        return f"{SESSION_PREFIX}:{session_id}"

    async def create_session(
        self,
        owner_keycloak_sub: str | None = None,
        *,
        schema_state: AnalysisSchema | None = None,
        messages: list[ChatMessage] | None = None,
    ) -> SessionState:
        session_id = uuid.uuid4().hex
        state = SessionState(
            session_id=session_id,
            owner_keycloak_sub=owner_keycloak_sub,
            schema_state=schema_state or AnalysisSchema(),
            messages=messages or [],
        )
        await self._save(state)
        logger.info(f"Created assistant session {session_id}")
        return state

    async def get_session(self, session_id: str) -> Optional[SessionState]:
        raw = await self.cache.get(self._key(session_id))
        if raw is None:
            return None
        try:
            return SessionState.model_validate(raw)
        except Exception:
            logger.exception(f"Failed to deserialize session {session_id}")
            return None

    async def save_session(self, state: SessionState) -> None:
        await self._save(state)

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
        (e.g. via the signed session cookie) before invoking this.

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

    async def delete_session(self, session_id: str) -> bool:
        return await self.cache.delete(self._key(session_id))

    async def _save(self, state: SessionState) -> None:
        data = json.loads(to_json(state))
        await self.cache.set(self._key(state.session_id), data, ttl=SESSION_TTL)
