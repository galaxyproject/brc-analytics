from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import cache, health
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="BRC Analytics API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
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


@app.get("/")
async def root():
    return {"message": "BRC Analytics API", "version": "1.0.0"}
