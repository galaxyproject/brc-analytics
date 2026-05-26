import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import assistant, auth, cache, ena, health, links, llm, version
from app.core.config import get_settings
from app.core.dependencies import (
    get_auth_service,
    get_cache_service,
    get_catalog_data,
    get_ena_service,
    get_llm_service,
    reset_all_services,
)
from app.services.mcp_server import create_mcp_server

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Build and return the fully configured FastAPI application.

    Used by uvicorn via --factory so that importing this module has no side
    effects (no Sentry init, no catalog loading, no MCP server construction).
    """
    settings = get_settings()

    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            release=settings.APP_VERSION,
            traces_sample_rate=1.0,
        )

    mcp = create_mcp_server(get_catalog_data(), get_ena_service())
    mcp_app = mcp.http_app(path="/", stateless_http=True)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with mcp_app.lifespan(app):
            cache_service = get_cache_service()
            await cache_service.flush_all()
            logger.info("Cache cleared on startup")

            get_llm_service()

            logger.info("All services initialized")

            yield

            auth_service = get_auth_service()
            await auth_service.close()
            await cache_service.close()
            reset_all_services()
            logger.info("All services shut down")

    app = FastAPI(
        title="BRC Analytics API",
        version=settings.APP_VERSION,
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    app.include_router(cache.router, prefix="/api/v1/cache", tags=["cache"])
    app.include_router(version.router, prefix="/api/v1/version", tags=["version"])
    app.include_router(links.router, prefix="/api/v1", tags=["links"])
    app.include_router(llm.router, prefix="/api/v1/llm", tags=["llm"])
    app.include_router(ena.router, prefix="/api/v1/ena", tags=["ena"])
    app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["assistant"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

    app.mount("/api/v1/mcp", mcp_app)

    @app.get("/")
    async def root():
        return {"message": "BRC Analytics API", "version": settings.APP_VERSION}

    return app
