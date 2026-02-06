import json
import logging
import uuid
from typing import Optional

from pydantic_core import to_json, to_jsonable_python

from app.core.cache import CacheService
from app.models.assistant import (
    AnalysisSchema,
    ChatMessage,
    SessionState,
)

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

    async def add_message(
        self, session_id: str, message: ChatMessage
    ) -> Optional[SessionState]:
        state = await self.get_session(session_id)
        if state is None:
            return None
        state.messages.append(message)
        await self._save(state)
        return state

    async def update_schema(
        self, session_id: str, schema_state: AnalysisSchema
    ) -> Optional[SessionState]:
        state = await self.get_session(session_id)
        if state is None:
            return None
        state.schema_state = schema_state
        await self._save(state)
        return state

    async def update_agent_history(
        self, session_id: str, agent_messages: list
    ) -> Optional[SessionState]:
        """Store the raw pydantic-ai message list (serialised to dicts)."""
        state = await self.get_session(session_id)
        if state is None:
            return None
        state.agent_message_history = to_jsonable_python(agent_messages)
        await self._save(state)
        return state

    async def delete_session(self, session_id: str) -> bool:
        return await self.cache.delete(self._key(session_id))

    async def _save(self, state: SessionState) -> None:
        data = json.loads(to_json(state))
        await self.cache.set(self._key(state.session_id), data, ttl=SESSION_TTL)
