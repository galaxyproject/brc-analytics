import logging
from functools import lru_cache

from fastapi import Request

from app.core.cache import CacheService
from app.core.config import get_settings
from app.core.rate_limit import RateLimiter
from app.services.assistant_agent import AssistantAgent
from app.services.auth_service import AuthService
from app.services.catalog_data import CatalogData
from app.services.ena_service import ENAService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_auth_service() -> AuthService:
    settings = get_settings()
    service = AuthService(settings.REDIS_URL)
    logger.info("Auth service initialized (singleton)")
    return service


@lru_cache(maxsize=1)
def get_cache_service() -> CacheService:
    settings = get_settings()
    return CacheService(settings.REDIS_URL)


@lru_cache(maxsize=1)
def get_catalog_data() -> CatalogData:
    settings = get_settings()
    return CatalogData(settings.CATALOG_PATH)


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    cache = get_cache_service()
    service = LLMService(cache)
    logger.info(
        f"LLM service initialized (singleton), available: {service.is_available()}"
    )
    return service


@lru_cache(maxsize=1)
def get_ena_service() -> ENAService:
    cache = get_cache_service()
    service = ENAService(cache)
    logger.info("ENA service initialized (singleton)")
    return service


@lru_cache(maxsize=1)
def get_assistant_agent() -> AssistantAgent:
    cache = get_cache_service()
    agent = AssistantAgent(cache)
    logger.info(
        f"Assistant agent initialized (singleton), available: {agent.is_available()}"
    )
    return agent


@lru_cache(maxsize=1)
def get_rate_limiter() -> RateLimiter:
    cache = get_cache_service()
    settings = get_settings()
    limiter = RateLimiter(
        cache=cache,
        requests=settings.RATE_LIMIT_REQUESTS,
        window=settings.RATE_LIMIT_WINDOW,
    )
    logger.info(
        f"Rate limiter initialized: {settings.RATE_LIMIT_REQUESTS} "
        f"requests per {settings.RATE_LIMIT_WINDOW}s"
    )
    return limiter


async def check_rate_limit(request: Request) -> dict:
    rate_limiter = get_rate_limiter()
    return await rate_limiter.check(request)


def reset_cache_service() -> None:
    get_cache_service.cache_clear()


def reset_all_services() -> None:
    get_auth_service.cache_clear()
    get_cache_service.cache_clear()
    get_catalog_data.cache_clear()
    get_llm_service.cache_clear()
    get_ena_service.cache_clear()
    get_assistant_agent.cache_clear()
    get_rate_limiter.cache_clear()
