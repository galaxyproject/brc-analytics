from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("")
async def get_version():
    """Get API version and build information"""
    return {
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "service": "BRC Analytics API",
    }
