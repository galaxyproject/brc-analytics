import hashlib
import json
import logging
from datetime import timedelta
from typing import Any, Dict, Optional

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-based cache service with TTL support and key management"""

    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache by key"""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.error(f"Cache get error for key {key}: {e}")
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
        """Clear all keys matching a pattern"""
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                return await self.redis.delete(*keys)
            return 0
        except redis.RedisError as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0

    async def flush_all(self) -> bool:
        """Flush all keys from the current database"""
        try:
            await self.redis.flushdb()
            logger.info("Cache flushed successfully")
            return True
        except redis.RedisError as e:
            logger.error(f"Cache flush error: {e}")
            return False

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
        hash_val = hashlib.md5(param_str.encode()).hexdigest()[:16]
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
