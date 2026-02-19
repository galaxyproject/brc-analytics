import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import assistant, cache, ena, health, links, llm, version
from app.core.config import get_settings
from app.core.dependencies import (
    get_cache_service,
    get_ena_service,
    get_llm_service,
    reset_all_services,
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the application"""
    # Startup: initialize services and flush cache
    cache_service = await get_cache_service()
    await cache_service.flush_all()
    logger.info("Cache cleared on startup")

    # Pre-initialize LLM and ENA services (singletons)
    await get_llm_service()
    await get_ena_service()
    logger.info("All services initialized")

    yield

    # Shutdown: close cache connection and reset all service singletons
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

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(cache.router, prefix="/api/v1/cache", tags=["cache"])
app.include_router(version.router, prefix="/api/v1/version", tags=["version"])
app.include_router(links.router, prefix="/api/v1", tags=["links"])
app.include_router(llm.router, prefix="/api/v1/llm", tags=["llm"])
app.include_router(ena.router, prefix="/api/v1/ena", tags=["ena"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["assistant"])


@app.get("/")
async def root():
    return {"message": "BRC Analytics API", "version": settings.APP_VERSION}
