from fastapi import APIRouter, Depends, HTTPException

from app.core.cache import CacheService
from app.core.dependencies import get_cache_service

router = APIRouter()


@router.get("/health")
async def cache_health(cache: CacheService = Depends(get_cache_service)):
    """Check if cache service is healthy"""
    try:
        # Try to set and get a test value
        test_key = "health_check"
        test_value = "ok"

        await cache.set(test_key, test_value, ttl=60)
        result = await cache.get(test_key)
        await cache.delete(test_key)

        if result == test_value:
            return {"status": "healthy", "cache": "connected"}
        else:
            raise HTTPException(
                status_code=503, detail="Cache service not responding correctly"
            )

    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"Cache service unhealthy: {str(e)}"
        ) from e
