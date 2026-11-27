import pytest

from app.core.cache import CacheService


class FakePipeline:
    """Records sadd/sismember/expire until execute(), as a Redis pipeline does."""

    def __init__(self, redis: "FakeRedis"):
        self.redis = redis
        self.queued: list[tuple] = []

    async def __aenter__(self) -> "FakePipeline":
        return self

    async def __aexit__(self, *exc) -> None:
        return None

    def sadd(self, key: str, member: str) -> "FakePipeline":
        self.queued.append(("sadd", key, member))
        return self

    def sismember(self, key: str, member: str) -> "FakePipeline":
        self.queued.append(("sismember", key, member))
        return self

    def expire(self, key: str, ttl: int) -> "FakePipeline":
        self.queued.append(("expire", key, ttl))
        return self

    async def execute(self) -> list:
        results = []
        for op, key, arg in self.queued:
            if op == "sadd":
                members = self.redis.sets.setdefault(key, set())
                results.append(int(arg not in members))
                members.add(arg)
            elif op == "sismember":
                results.append(int(arg in self.redis.sets.get(key, set())))
            else:
                exists = key in self.redis.sets
                if exists:
                    self.redis.ttls[key] = arg
                results.append(exists)
        self.queued = []
        return results


class FakeRedis:
    """Minimal stand-in for the set operations behind browser bindings."""

    def __init__(self):
        self.sets: dict[str, set[str]] = {}
        self.ttls: dict[str, int] = {}

    def pipeline(self, transaction: bool = True) -> FakePipeline:
        return FakePipeline(self)


def _service() -> CacheService:
    service = CacheService.__new__(CacheService)
    service.redis = FakeRedis()
    return service


@pytest.mark.asyncio
async def test_a_member_never_added_is_not_in_the_set():
    service = _service()

    assert await service.is_in_set("assistant:browser:b1", "s1", 60) is False


@pytest.mark.asyncio
async def test_an_added_member_is_in_the_set_and_others_are_not():
    service = _service()

    await service.add_to_set("assistant:browser:b1", "s1", 60)

    assert await service.is_in_set("assistant:browser:b1", "s1", 60) is True
    assert await service.is_in_set("assistant:browser:b1", "s2", 60) is False
    assert await service.is_in_set("assistant:browser:b2", "s1", 60) is False


@pytest.mark.asyncio
async def test_adding_a_member_gives_the_set_its_expiry():
    service = _service()

    await service.add_to_set("assistant:browser:b1", "s1", 86400)

    assert service.redis.ttls == {"assistant:browser:b1": 86400}


@pytest.mark.asyncio
async def test_checking_membership_resets_the_set_expiry():
    service = _service()
    await service.add_to_set("assistant:browser:b1", "s1", 60)

    await service.is_in_set("assistant:browser:b1", "s1", 86400)

    assert service.redis.ttls == {"assistant:browser:b1": 86400}
