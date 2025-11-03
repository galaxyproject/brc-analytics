from functools import lru_cache

from app.core.cache import CacheService
from app.core.config import get_settings

# Global cache service instance
_cache_service = None


async def get_cache_service() -> CacheService:
    """Dependency to get cache service instance"""
    global _cache_service
    if _cache_service is None:
        settings = get_settings()
        _cache_service = CacheService(settings.REDIS_URL)
    return _cache_service
