import asyncio
import logging
from contextlib import asynccontextmanager, suppress

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    assistant,
    auth,
    cache,
    ena,
    favorites,
    health,
    links,
    saved_analyses,
    user,
    version,
    workflow_runs,
)
from app.core.config import get_settings
from app.core.dependencies import (
    get_auth_service,
    get_cache_service,
    get_catalog_data,
    get_ena_service,
    get_sra_mirror_service,
    reset_all_services,
)
from app.db.session import close_db, init_db
from app.services.mcp_server import create_mcp_server
from app.services.turn_log_retention import start_turn_log_purge_task

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

    mcp = create_mcp_server(
        get_catalog_data(),
        get_ena_service(),
        sra_mirror=get_sra_mirror_service(),
    )
    mcp_app = mcp.http_app(path="/", stateless_http=True)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with mcp_app.lifespan(app):
            cache_service = get_cache_service()
            cleared = await cache_service.clear_caches()
            logger.info("Cleared %d cached response keys on startup", cleared)

            await init_db()

            # A live assistant with no durable log is the failure mode #1294
            # exists to prevent, and it's silent -- say so at boot.
            if settings.ASSISTANT_TURN_LOGGING_ENABLED and not settings.DATABASE_URL:
                logger.warning(
                    "Assistant turn logging is enabled but DATABASE_URL is unset; "
                    "conversations will not be recorded beyond the Redis session TTL"
                )

            purge_task = start_turn_log_purge_task()

            yield

            if purge_task is not None:
                purge_task.cancel()
                with suppress(asyncio.CancelledError):
                    await purge_task

            auth_service = get_auth_service()
            await auth_service.close()
            await close_db()
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
    app.include_router(ena.router, prefix="/api/v1/ena", tags=["ena"])
    app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["assistant"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(favorites.router, prefix="/api/v1/favorites", tags=["favorites"])
    app.include_router(
        saved_analyses.router,
        prefix="/api/v1/saved_analyses",
        tags=["saved_analyses"],
    )
    app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
    app.include_router(
        workflow_runs.router,
        prefix="/api/v1/workflow_runs",
        tags=["workflow_runs"],
    )

    app.mount("/api/v1/mcp", mcp_app)

    @app.get("/")
    async def root():
        return {"message": "BRC Analytics API", "version": settings.APP_VERSION}

    return app
