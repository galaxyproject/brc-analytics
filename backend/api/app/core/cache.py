import hashlib
import json
import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis

logger = logging.getLogger(__name__)

# Cached upstream responses, safe to drop on deploy. Everything else in this
# database is live state -- assistant and auth sessions, in-flight PKCE,
# rate-limit counters -- and has to survive a restart. Add new cache namespaces
# here; missing one only means it ages out on its TTL, the safe way to be wrong.
CACHE_KEY_PATTERNS = ("ena:*", "v1:*")

# Bounds both the DELETE argument list and our own key buffer, so neither grows
# with the size of the namespace.
CLEAR_BATCH_SIZE = 500


class CacheService:
    """Redis-based cache service with TTL support and key management"""

    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache by key, or None if it can't be read"""
        try:
            return await self.get_strict(key)
        except redis.RedisError as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    async def get_strict(self, key: str) -> Optional[Any]:
        """Read a key, telling "absent" apart from "Redis unavailable".

        get() answers None to both, which is the right call for a cache and the
        wrong one for state that merely lives in one: a Redis blip would be
        indistinguishable from an expired session, and the caller would tell the
        user their conversation is gone. Raises RedisError so callers can tell
        the difference. A genuine miss, or a value that won't decode, is still
        None -- there's nothing to recover in either case.
        """
        value = await self.redis.get(key)
        if not value:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError as e:
            logger.error(f"Cache value for key {key} is not valid JSON: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set a value in cache with TTL (time to live) in seconds"""
        try:
            serialized_value = json.dumps(value, default=str)
            await self.redis.setex(key, ttl, serialized_value)
            return True
        except (redis.RedisError, TypeError) as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        try:
            result = await self.redis.delete(key)
            return result > 0
        except redis.RedisError as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return await self.redis.exists(key) > 0
        except redis.RedisError as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    async def get_ttl(self, key: str) -> int:
        """Get remaining TTL for a key (-1 if no TTL, -2 if key doesn't exist)"""
        try:
            return await self.redis.ttl(key)
        except redis.RedisError as e:
            logger.error(f"Cache TTL error for key {key}: {e}")
            return -2

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern.

        Scans rather than using KEYS, and deletes in batches, so neither the
        server nor this process is held up in proportion to the keyspace.
        """
        cleared = 0
        try:
            batch: list[str] = []
            # MATCH filters server-side but still walks the whole keyspace, and
            # SCAN's default COUNT of 10 would make that thousands of round
            # trips on a warm cache. Ask for the batch size we're going to
            # delete anyway.
            async for key in self.redis.scan_iter(
                match=pattern, count=CLEAR_BATCH_SIZE
            ):
                batch.append(key)
                if len(batch) >= CLEAR_BATCH_SIZE:
                    cleared += await self.redis.delete(*batch)
                    batch.clear()
            if batch:
                cleared += await self.redis.delete(*batch)
        except redis.RedisError as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
        return cleared

    async def clear_caches(self) -> int:
        """Drop cached upstream responses, leaving live state intact.

        Scoped to CACHE_KEY_PATTERNS rather than flushing the database: the same
        Redis holds sessions and rate-limit counters, and a deploy must not take
        those with it.
        """
        cleared = 0
        for pattern in CACHE_KEY_PATTERNS:
            cleared += await self.clear_pattern(pattern)
        return cleared

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            info = await self.redis.info()
            return {
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(info),
                "memory_used": info.get("used_memory_human", "0B"),
                "memory_used_bytes": info.get("used_memory", 0),
                "keys_count": await self.redis.dbsize(),
                "connected_clients": info.get("connected_clients", 0),
            }
        except redis.RedisError as e:
            logger.error(f"Cache stats error: {e}")
            return {}

    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate cache hit rate from Redis info"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        return (hits / total) if total > 0 else 0.0

    def make_key(self, prefix: str, params: Dict[str, Any]) -> str:
        """Generate a cache key from prefix and parameters"""
        # Sort parameters for consistent keys
        param_str = json.dumps(params, sort_keys=True, default=str)
        hash_val = hashlib.md5(param_str.encode(), usedforsecurity=False).hexdigest()[
            :16
        ]
        return f"{prefix}:{hash_val}"

    async def close(self):
        """Close Redis connection"""
        await self.redis.close()


# Cache TTL constants (in seconds)
class CacheTTL:
    FIVE_MINUTES = 300
    ONE_HOUR = 3600
    SIX_HOURS = 21600
    ONE_DAY = 86400
    ONE_WEEK = 604800
    THIRTY_DAYS = 2592000
