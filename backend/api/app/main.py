import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import cache, health, links, version
from app.core.config import get_settings
from app.core.dependencies import get_cache_service, reset_cache_service

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the application"""
    # Startup: flush cache to ensure fresh data after restart
    cache_service = await get_cache_service()
    await cache_service.flush_all()
    logger.info("Cache cleared on startup")
    yield
    # Shutdown: close cache connection and reset singleton
    await cache_service.close()
    reset_cache_service()


app = FastAPI(
    title="BRC Analytics API",
    version=settings.APP_VERSION,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
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


@app.get("/")
async def root():
    return {"message": "BRC Analytics API", "version": settings.APP_VERSION}
