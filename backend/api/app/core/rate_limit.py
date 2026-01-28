"""Rate limiting using Redis for FastAPI endpoints"""

import logging
from typing import Optional

from fastapi import HTTPException, Request

from app.core.cache import CacheService
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Redis-based rate limiter using sliding window counter"""

    def __init__(self, cache: CacheService, requests: int, window: int):
        """
        Initialize rate limiter.

        Args:
            cache: Redis cache service
            requests: Maximum requests allowed in window
            window: Time window in seconds
        """
        self.cache = cache
        self.requests = requests
        self.window = window

    def _get_client_key(self, request: Request) -> str:
        """Generate rate limit key for a client based on IP address"""
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        return f"ratelimit:{client_ip}"

    async def check(self, request: Request) -> dict:
        """
        Check if request is allowed under rate limit.

        Returns dict with rate limit info.
        Raises HTTPException 429 if rate limit exceeded.
        """
        key = self._get_client_key(request)

        try:
            # Use Redis INCR with TTL for atomic counter
            current = await self.cache.redis.incr(key)

            if current == 1:
                # First request in window - set expiry
                await self.cache.redis.expire(key, self.window)

            remaining = max(0, self.requests - current)
            ttl = await self.cache.redis.ttl(key)

            if current > self.requests:
                logger.warning(
                    f"Rate limit exceeded for {key}: {current}/{self.requests}"
                )
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "limit": self.requests,
                        "window_seconds": self.window,
                        "retry_after": ttl if ttl > 0 else self.window,
                    },
                    headers={
                        "X-RateLimit-Limit": str(self.requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(ttl if ttl > 0 else self.window),
                        "Retry-After": str(ttl if ttl > 0 else self.window),
                    },
                )

            return {
                "limit": self.requests,
                "remaining": remaining,
                "reset": ttl if ttl > 0 else self.window,
            }

        except HTTPException:
            raise
        except Exception as e:
            # On Redis errors, allow the request but log the issue
            logger.error(f"Rate limit check failed: {e}")
            return {
                "limit": self.requests,
                "remaining": self.requests,
                "reset": self.window,
            }


# Global rate limiter instance (initialized lazily)
_rate_limiter: Optional[RateLimiter] = None


async def get_rate_limiter(cache: CacheService) -> RateLimiter:
    """Get or create rate limiter singleton"""
    global _rate_limiter
    if _rate_limiter is None:
        settings = get_settings()
        _rate_limiter = RateLimiter(
            cache=cache,
            requests=settings.RATE_LIMIT_REQUESTS,
            window=settings.RATE_LIMIT_WINDOW,
        )
    return _rate_limiter


def reset_rate_limiter() -> None:
    """Reset the rate limiter singleton (for shutdown)"""
    global _rate_limiter
    _rate_limiter = None
