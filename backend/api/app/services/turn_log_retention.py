"""Retention sweep for assistant turn logs (#1294).

The assistant page and /learn/assistant tell users conversations are kept for
90 days and then deleted. That promise has to be enforced by something that
runs on its own -- a script somebody is supposed to wire into cron is a
documentation claim, not a retention policy. This runs the sweep inside the
app so the deployed system honours what the UI says.

The purge is an idempotent `DELETE ... WHERE created_at < cutoff`, so several
workers running it concurrently is harmless.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.db.crud import purge_assistant_turn_logs_before
from app.db.session import get_session_factory

logger = logging.getLogger(__name__)


async def purge_expired_turn_logs() -> int:
    """Delete turn logs past the retention window. Returns rows removed."""
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(
        days=settings.ASSISTANT_TURN_LOG_RETENTION_DAYS
    )
    session_factory = get_session_factory()
    async with session_factory() as session:
        return await purge_assistant_turn_logs_before(session, cutoff)


async def _purge_loop() -> None:
    settings = get_settings()
    interval = max(60.0, settings.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS * 3600.0)
    while True:
        try:
            deleted = await purge_expired_turn_logs()
            if deleted:
                logger.info(
                    "Purged %d assistant turn log rows past the %d day window",
                    deleted,
                    settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            # A failed sweep must not kill the loop -- the next pass retries,
            # and a permanently broken purge is a privacy problem, not a
            # cosmetic one, so it is logged loudly every time.
            logger.exception("Assistant turn log purge failed")
        await asyncio.sleep(interval)


def start_turn_log_purge_task() -> asyncio.Task | None:
    """Start the periodic sweep, or return None when it shouldn't run."""
    settings = get_settings()
    if not settings.DATABASE_URL:
        return None
    if not settings.ASSISTANT_TURN_LOG_PURGE_ENABLED:
        # Explicitly disabled: say so, because the UI still promises deletion.
        logger.warning(
            "Assistant turn log retention sweep is disabled; rows will not be "
            "deleted after %d days despite the notice shown to users",
            settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
        )
        return None

    logger.info(
        "Assistant turn log retention sweep every %.1fh, window %d days",
        settings.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS,
        settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
    )
    return asyncio.create_task(_purge_loop())
