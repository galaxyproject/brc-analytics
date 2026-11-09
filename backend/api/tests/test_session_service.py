import pytest
import redis.asyncio as redis

from app.models.assistant import AnalysisSchema, ChatMessage, MessageRole
from app.services.session_service import BINDING_TTL, SESSION_TTL, SessionService


class FakeCache:
    def __init__(self, fail_reads: bool = False):
        self.values: dict[str, dict] = {}
        self.expired: dict[str, int] = {}
        self.fail_reads = fail_reads

    async def delete(self, key: str) -> bool:
        return self.values.pop(key, None) is not None

    async def expire(self, key: str, ttl: int) -> bool:
        self.expired[key] = ttl
        return key in self.values

    async def get(self, key: str):
        return self.values.get(key)

    async def get_strict(self, key: str):
        if self.fail_reads:
            raise redis.RedisError("redis is unreachable")
        return self.values.get(key)

    async def set(self, key: str, value, ttl: int = 3600) -> bool:
        self.values[key] = value
        return True

    async def set_strict(self, key: str, value, ttl: int) -> None:
        if self.fail_reads:
            raise redis.RedisError("redis is unreachable")
        self.values[key] = value
        self.expired[key] = ttl

    async def expire_strict(self, key: str, ttl: int) -> bool:
        if self.fail_reads:
            raise redis.RedisError("redis is unreachable")
        if key not in self.values:
            return False
        self.expired[key] = ttl
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
    await service.bind_browser(state.session_id, "binding")
    assert await service.is_browser_bound(state.session_id, "binding")


@pytest.mark.asyncio
async def test_create_session_stores_metadata():
    service = SessionService(FakeCache())
    state = await service.create_session(metadata={"logan": {"job_id": "abc"}})
    assert state.metadata == {"logan": {"job_id": "abc"}}
    loaded = await service.get_session(state.session_id)
    assert loaded.metadata == {"logan": {"job_id": "abc"}}


@pytest.mark.asyncio
async def test_touch_session_resets_the_ttl_without_rewriting_the_session():
    """Reopening an analysis reuses a live session it only read. Writing that
    copy back would drop any turn saved in between, so the TTL reset has to
    leave the stored value alone."""
    cache = FakeCache()
    service = SessionService(cache)
    state = await service.create_session(owner_keycloak_sub="user-a")
    key = service._key(state.session_id)
    stored = cache.values[key]

    assert await service.touch_session(state.session_id) is True

    assert cache.expired == {key: SESSION_TTL}
    assert cache.values[key] is stored


@pytest.mark.asyncio
async def test_touch_session_reports_a_session_that_is_already_gone():
    service = SessionService(FakeCache())

    assert await service.touch_session("expired-session") is False


@pytest.mark.asyncio
async def test_a_binding_survives_the_session_being_saved_over():
    # Bindings live in keys of their own: a turn saving back the copy of the
    # session it read can't drop a browser bound in the meantime.
    service = SessionService(FakeCache())
    state = await service.create_session()

    await service.bind_browser(state.session_id, "binding")
    await service.save_session(state)

    assert await service.is_browser_bound(state.session_id, "binding")


@pytest.mark.asyncio
async def test_is_browser_bound_refuses_another_browser_or_session():
    service = SessionService(FakeCache())
    await service.bind_browser("s1", "binding")

    assert not await service.is_browser_bound("s1", "other-binding")
    assert not await service.is_browser_bound("s2", "binding")


@pytest.mark.asyncio
async def test_is_browser_bound_keeps_the_binding_alive():
    cache = FakeCache()
    service = SessionService(cache)
    await service.bind_browser("s1", "binding")
    cache.expired.clear()

    await service.is_browser_bound("s1", "binding")

    assert list(cache.expired.values()) == [BINDING_TTL]


@pytest.mark.asyncio
async def test_binding_checks_surface_redis_failure_instead_of_refusing():
    # A refusal makes the client drop the conversation for good; an outage
    # must read as an error it can retry.
    service = SessionService(FakeCache(fail_reads=True))

    with pytest.raises(redis.RedisError):
        await service.is_browser_bound("s1", "binding")
    with pytest.raises(redis.RedisError):
        await service.bind_browser("s1", "binding")
