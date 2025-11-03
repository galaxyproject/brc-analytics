from datetime import datetime

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring system status"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "BRC Analytics API",
    }
