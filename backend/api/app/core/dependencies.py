import logging

from fastapi import Request

from app.core.cache import CacheService
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Global service instances (singletons)
_cache_service = None
_llm_service = None
_ena_service = None
_rate_limiter = None


async def get_cache_service() -> CacheService:
    """Dependency to get cache service instance"""
    global _cache_service
    if _cache_service is None:
        settings = get_settings()
        _cache_service = CacheService(settings.REDIS_URL)
    return _cache_service


async def get_llm_service():
    """Dependency to get LLM service singleton instance"""
    global _llm_service
    if _llm_service is None:
        from app.services.llm_service import LLMService

        cache = await get_cache_service()
        _llm_service = LLMService(cache)
        available = _llm_service.is_available()
        logger.info(f"LLM service initialized (singleton), available: {available}")
    return _llm_service


async def get_ena_service():
    """Dependency to get ENA service singleton instance"""
    global _ena_service
    if _ena_service is None:
        from app.services.ena_service import ENAService

        cache = await get_cache_service()
        _ena_service = ENAService(cache)
        logger.info("ENA service initialized (singleton)")
    return _ena_service


async def get_rate_limiter():
    """Get rate limiter singleton instance"""
    global _rate_limiter
    if _rate_limiter is None:
        from app.core.rate_limit import RateLimiter

        cache = await get_cache_service()
        settings = get_settings()
        _rate_limiter = RateLimiter(
            cache=cache,
            requests=settings.RATE_LIMIT_REQUESTS,
            window=settings.RATE_LIMIT_WINDOW,
        )
        logger.info(
            f"Rate limiter initialized: {settings.RATE_LIMIT_REQUESTS} "
            f"requests per {settings.RATE_LIMIT_WINDOW}s"
        )
    return _rate_limiter


async def check_rate_limit(request: Request) -> dict:
    """Dependency to check rate limit for a request"""
    rate_limiter = await get_rate_limiter()
    return await rate_limiter.check(request)


def reset_cache_service() -> None:
    """Reset the global cache service instance (used during shutdown)"""
    global _cache_service
    _cache_service = None


def reset_all_services() -> None:
    """Reset all global service instances (used during shutdown)"""
    global _cache_service, _llm_service, _ena_service, _rate_limiter
    _cache_service = None
    _llm_service = None
    _ena_service = None
    _rate_limiter = None
