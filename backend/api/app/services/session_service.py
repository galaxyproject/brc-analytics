import json
import logging
import uuid
from typing import Optional

from pydantic_core import to_json

from app.core.cache import CacheService
from app.models.assistant import SessionState

logger = logging.getLogger(__name__)

SESSION_PREFIX = "assistant:session"
SESSION_TTL = 7200  # 2 hours


class SessionService:
    """Redis-backed session store for assistant conversations."""

    def __init__(self, cache: CacheService):
        self.cache = cache

    def _key(self, session_id: str) -> str:
        return f"{SESSION_PREFIX}:{session_id}"

    async def create_session(self) -> SessionState:
        session_id = uuid.uuid4().hex
        state = SessionState(session_id=session_id)
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

    async def delete_session(self, session_id: str) -> bool:
        return await self.cache.delete(self._key(session_id))

    async def _save(self, state: SessionState) -> None:
        data = json.loads(to_json(state))
        await self.cache.set(self._key(state.session_id), data, ttl=SESSION_TTL)
