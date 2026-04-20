import pytest

from app.models.assistant import AnalysisSchema, ChatMessage, MessageRole
from app.services.session_service import SessionService


class FakeCache:
    def __init__(self):
        self.values: dict[str, dict] = {}

    async def delete(self, key: str) -> bool:
        return self.values.pop(key, None) is not None

    async def get(self, key: str):
        return self.values.get(key)

    async def set(self, key: str, value, ttl: int = 3600) -> bool:
        self.values[key] = value
        return True


@pytest.mark.asyncio
async def test_require_session_rejects_wrong_owner():
    cache = FakeCache()
    service = SessionService(cache)

    state = await service.create_session(
        owner_keycloak_sub="user-a",
        schema_state=AnalysisSchema(),
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
    )

    with pytest.raises(PermissionError):
        await service.require_session(state.session_id, "user-b")

    loaded = await service.require_session(state.session_id, "user-a")

    assert loaded.owner_keycloak_sub == "user-a"
