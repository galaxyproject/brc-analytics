#!/usr/bin/env python
"""Delete assistant turn logs past the retention window (#1294).

The app already runs this sweep on a timer (see
app/services/turn_log_retention.py) -- retention does not depend on this
script. It exists for manual use: verifying the window, forcing an immediate
purge after a config change, or running a one-off with a shorter window.

    python -m scripts.purge_assistant_turn_logs --dry-run
    python -m scripts.purge_assistant_turn_logs --days 30

Retention defaults to ASSISTANT_TURN_LOG_RETENTION_DAYS (90).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.models import AssistantTurnLog
from app.db.session import close_db, db_session
from app.services.turn_log import purge_expired

logger = logging.getLogger("purge_assistant_turn_logs")


async def _run(days: int, dry_run: bool) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    if dry_run:
        async with db_session() as session:
            result = await session.execute(
                select(func.count())
                .select_from(AssistantTurnLog)
                .where(AssistantTurnLog.created_at < cutoff)
            )
            count = result.scalar_one()
            logger.info(
                "Dry run: %d turn log rows older than %s would be deleted",
                count,
                cutoff.isoformat(),
            )
            return 0

    # Delegate the delete so the retention window has one definition.
    deleted = await purge_expired(days=days)
    logger.info("Deleted %d turn log rows older than %s", deleted, cutoff.isoformat())
    return 0


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    settings = get_settings()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--days",
        type=int,
        default=settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
        help="retention window in days (default: %(default)s)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report what would be deleted without deleting it",
    )
    args = parser.parse_args()

    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL is not configured; nothing to purge")
        return 1
    if args.days < 1:
        logger.error("--days must be at least 1")
        return 1

    try:
        return asyncio.run(_run(args.days, args.dry_run))
    finally:
        asyncio.run(close_db())


if __name__ == "__main__":
    sys.exit(main())
