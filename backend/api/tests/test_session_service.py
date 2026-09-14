import pytest
import redis.asyncio as redis

from app.models.assistant import AnalysisSchema, ChatMessage, MessageRole
from app.services.session_service import SessionService


class FakeCache:
    def __init__(self, fail_reads: bool = False):
        self.values: dict[str, dict] = {}
        self.fail_reads = fail_reads

    async def delete(self, key: str) -> bool:
        return self.values.pop(key, None) is not None

    async def get(self, key: str):
        return self.values.get(key)

    async def get_strict(self, key: str):
        if self.fail_reads:
            raise redis.RedisError("redis is unreachable")
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


@pytest.mark.asyncio
async def test_claim_session_stamps_owner_on_anonymous_session():
    cache = FakeCache()
    service = SessionService(cache)

    state = await service.create_session()
    assert state.owner_keycloak_sub is None

    claimed = await service.claim_session(state.session_id, "user-a")
    assert claimed.owner_keycloak_sub == "user-a"

    # Round-trip through cache: ownership must persist.
    reloaded = await service.get_session(state.session_id)
    assert reloaded.owner_keycloak_sub == "user-a"


@pytest.mark.asyncio
async def test_claim_session_is_noop_when_already_owned_by_caller():
    cache = FakeCache()
    service = SessionService(cache)

    state = await service.create_session(owner_keycloak_sub="user-a")
    claimed = await service.claim_session(state.session_id, "user-a")
    assert claimed.owner_keycloak_sub == "user-a"


@pytest.mark.asyncio
async def test_claim_session_rejects_when_owned_by_other_user():
    cache = FakeCache()
    service = SessionService(cache)

    state = await service.create_session(owner_keycloak_sub="user-a")
    with pytest.raises(PermissionError):
        await service.claim_session(state.session_id, "user-b")


@pytest.mark.asyncio
async def test_claim_session_raises_keyerror_for_missing_session():
    cache = FakeCache()
    service = SessionService(cache)

    with pytest.raises(KeyError):
        await service.claim_session("does-not-exist", "user-a")


@pytest.mark.asyncio
async def test_get_session_surfaces_redis_failure_instead_of_reporting_a_miss():
    """A Redis outage must not be indistinguishable from an expired session.

    If it returns None the endpoint answers 404, and the client takes that as
    "this conversation is gone" and discards its only pointer to a session that
    is still very much alive.
    """
    cache = FakeCache()
    service = SessionService(cache)
    state = await service.create_session(
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
    )

    cache.fail_reads = True

    with pytest.raises(redis.RedisError):
        await service.get_session(state.session_id)


@pytest.mark.asyncio
async def test_get_session_still_returns_none_for_a_genuine_miss():
    cache = FakeCache()
    service = SessionService(cache)

    assert await service.get_session("never-existed") is None


@pytest.mark.asyncio
async def test_eval_harness_cache_double_satisfies_session_service():
    """The evals run SessionService against their own dict-backed cache.

    It's duck-typed, so adding a read method to CacheService breaks it at
    runtime with nothing at import time to catch it -- get_strict already did
    once. Round-trip a session through it so the next one fails here instead.
    """
    from evals.tasks import _InMemoryCache

    service = SessionService(_InMemoryCache())
    state = await service.create_session(
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
    )

    loaded = await service.get_session(state.session_id)

    assert loaded is not None
    assert loaded.messages[0].content == "hello"


@pytest.mark.asyncio
async def test_create_session_stores_metadata():
    service = SessionService(FakeCache())
    state = await service.create_session(metadata={"logan": {"job_id": "abc"}})
    assert state.metadata == {"logan": {"job_id": "abc"}}
    loaded = await service.get_session(state.session_id)
    assert loaded.metadata == {"logan": {"job_id": "abc"}}
