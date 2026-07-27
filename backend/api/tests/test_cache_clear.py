import fnmatch
from pathlib import Path
from typing import AsyncIterator

import pytest

from app.core.cache import CLEAR_BATCH_SIZE, CacheService


class FakeRedis:
    """Minimal stand-in supporting the scan/delete pair clear_caches uses."""

    def __init__(self, keys: dict[str, str]):
        self.values = dict(keys)
        self.delete_batch_sizes: list[int] = []
        self.scan_counts: list[int | None] = []

    async def scan_iter(
        self, match: str, count: int | None = None
    ) -> AsyncIterator[str]:
        self.scan_counts.append(count)
        # Snapshot the key list the way a real cursor scan does not: this fake
        # can't model concurrent mutation, so tests here cover selection and
        # batching only.
        for key in list(self.values):
            if fnmatch.fnmatch(key, match):
                yield key

    async def delete(self, *keys: str) -> int:
        self.delete_batch_sizes.append(len(keys))
        return sum(self.values.pop(key, None) is not None for key in keys)


def _service(keys: dict[str, str]) -> CacheService:
    service = CacheService.__new__(CacheService)
    service.redis = FakeRedis(keys)
    return service


@pytest.mark.asyncio
async def test_clear_caches_drops_cached_responses_and_keeps_live_state():
    """A deploy must drop stale upstream caches without logging anyone out."""
    service = _service(
        {
            "ena:taxonomy:5833:limit:10": "cached",
            "ena:study:PRJEB1234": "cached",
            "v1:assemblies:links": "cached",
            "v1:organisms:links:5833": "cached",
            "assistant:session:abc123": "live conversation",
            "auth:session:def456": "logged-in user",
            "auth:pkce:state789": "in-flight login",
            "ratelimit:203.0.113.5": "7",
        }
    )

    cleared = await service.clear_caches()

    assert cleared == 4
    assert sorted(service.redis.values) == [
        "assistant:session:abc123",
        "auth:pkce:state789",
        "auth:session:def456",
        "ratelimit:203.0.113.5",
    ]


@pytest.mark.asyncio
async def test_clear_caches_is_a_noop_when_only_state_is_present():
    service = _service({"assistant:session:abc123": "live conversation"})

    assert await service.clear_caches() == 0
    assert "assistant:session:abc123" in service.redis.values


@pytest.mark.asyncio
async def test_clear_caches_batches_its_deletes():
    """One unbounded DELETE would scale with the namespace, on a Redis that is
    also serving live session and rate-limit traffic."""
    service = _service({f"ena:key{i}": "cached" for i in range(1200)})

    cleared = await service.clear_caches()

    assert cleared == 1200
    assert service.redis.values == {}
    assert max(service.redis.delete_batch_sizes) <= CLEAR_BATCH_SIZE
    # SCAN's default COUNT of 10 would be thousands of round trips on a warm
    # cache, all on the connection live traffic is using.
    assert service.redis.scan_counts == [CLEAR_BATCH_SIZE] * len(
        service.redis.scan_counts
    )


def test_startup_clears_caches_rather_than_flushing_the_database():
    """#1523 was the lifespan calling flush_all(), which took live sessions with
    it. Asserted against the source because main.py binds get_cache_service at
    import time, so a fixture can't substitute the cache the lifespan actually
    uses -- which is also why no existing test caught the original bug."""
    source = (Path(__file__).resolve().parents[1] / "app" / "main.py").read_text()

    assert "clear_caches()" in source
    assert "flushdb" not in source
    assert "flush_all" not in source
