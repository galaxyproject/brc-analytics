import logging
from functools import lru_cache

from fastapi import Cookie, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheService
from app.core.config import get_settings
from app.core.rate_limit import RateLimiter
from app.db.crud import get_user_by_keycloak_sub
from app.db.models import User
from app.db.session import get_db_session
from app.models.user_data import UserMeResponse
from app.services.assistant_agent import AssistantAgent
from app.services.auth_service import COOKIE_NAME, AuthService
from app.services.catalog_data import CatalogData
from app.services.ena_service import ENAService
from app.services.sra_mirror import SRAMirrorService

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
def get_ena_service() -> ENAService:
    cache = get_cache_service()
    service = ENAService(cache)
    logger.info("ENA service initialized (singleton)")
    return service


@lru_cache(maxsize=1)
def get_sra_mirror_service() -> SRAMirrorService:
    settings = get_settings()
    service = SRAMirrorService(settings.SRA_MIRROR_PATH)
    logger.info(
        f"SRA mirror service initialized (singleton), available: {service.is_available()}"
    )
    return service


@lru_cache(maxsize=1)
def get_assistant_agent() -> AssistantAgent:
    cache = get_cache_service()
    sra_mirror = get_sra_mirror_service()
    agent = AssistantAgent(cache, sra_mirror=sra_mirror)
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


async def get_optional_current_user(
    brc_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
    auth: AuthService = Depends(get_auth_service),
) -> UserMeResponse | None:
    if not brc_session:
        return None

    user_info = await auth.get_user_info(brc_session)
    if not user_info:
        return None

    return UserMeResponse.model_validate(user_info)


async def get_current_user(
    current_user: UserMeResponse | None = Depends(get_optional_current_user),
) -> UserMeResponse:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


async def get_current_user_db(
    current_user: UserMeResponse = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user = await get_user_by_keycloak_sub(session, current_user.sub)
    if user is None:
        raise HTTPException(
            status_code=503, detail="Authenticated user is not provisioned"
        )
    return user


async def get_optional_current_user_db(
    current_user: UserMeResponse | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User | None:
    if current_user is None:
        return None
    return await get_user_by_keycloak_sub(session, current_user.sub)


def reset_cache_service() -> None:
    get_cache_service.cache_clear()


def reset_all_services() -> None:
    get_auth_service.cache_clear()
    get_cache_service.cache_clear()
    get_catalog_data.cache_clear()
    get_ena_service.cache_clear()
    get_sra_mirror_service.cache_clear()
    get_assistant_agent.cache_clear()
    get_rate_limiter.cache_clear()
