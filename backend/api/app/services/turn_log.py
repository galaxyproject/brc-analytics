"""Durable per-turn assistant logging (#1294).

Owns both halves of the turn log: writing a row per turn, and sweeping expired
ones. The agent calls `record()`; `main.py` opens `lifecycle()` for the sweep.

The write is awaited in the request. An insert is a few milliseconds against a
turn that spends seconds in model inference, and it is the try/except -- not
detachment -- that keeps a log failure from costing a user their reply.

Writes are fail-open by design. Losing a log row must never cost a user their
reply, so every failure here is swallowed after being reported.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timedelta, timezone

import sentry_sdk

from app.core.config import get_settings
from app.db.crud import (
    create_assistant_turn_log,
    get_user_id_by_keycloak_sub,
    purge_assistant_turn_logs_before,
)
from app.db.session import db_session
from app.models.assistant import TurnTelemetry
from app.services.sanitize import strip_nuls

logger = logging.getLogger(__name__)


def active_retention_days(settings=None) -> int | None:
    """The window we keep turns for, or None when we aren't keeping them.

    Single source of truth for both halves of the contract: the writer will not
    persist a turn unless this returns a number, and /info shows the user the
    same number. Keeping them on one predicate is what stops a deployment from
    logging conversations while the UI shows no notice -- or promising a
    deletion no sweep will carry out.
    """
    settings = settings or get_settings()
    if not settings.ASSISTANT_TURN_LOGGING_ENABLED or not settings.DATABASE_URL:
        return None
    if not settings.ASSISTANT_TURN_LOG_PURGE_ENABLED:
        return None
    days = settings.ASSISTANT_TURN_LOG_RETENTION_DAYS
    return days if days >= 1 else None


async def record(telemetry: TurnTelemetry) -> None:
    """Persist one turn. Never raises.

    Awaited in the request rather than backgrounded. The insert is a few
    milliseconds against a turn that spends seconds in model inference, and it
    is the try/except -- not the detachment -- that keeps a log failure from
    costing a user their reply. Doing it inline also means nothing is ever in
    flight at shutdown, so there is no drain to get wrong.
    """
    settings = get_settings()
    if active_retention_days(settings) is None:
        return

    try:
        await asyncio.wait_for(
            _write(telemetry),
            timeout=settings.ASSISTANT_TURN_LOG_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        # Reported, not just logged: a silently incomplete corpus looks
        # exactly like a quiet beta.
        logger.warning(
            "Turn log write timed out (turn_id=%s session=%s)",
            telemetry.turn_id,
            telemetry.session_id,
        )
        sentry_sdk.capture_message(
            "Assistant turn log write timed out", level="warning"
        )
    except Exception:
        logger.exception(
            "Turn log write failed (turn_id=%s session=%s)",
            telemetry.turn_id,
            telemetry.session_id,
        )
        sentry_sdk.capture_exception()


async def _write(telemetry: TurnTelemetry) -> None:
    async with db_session() as session:
        user_id = None
        if telemetry.owner_keycloak_sub:
            user_id = await get_user_id_by_keycloak_sub(
                session, telemetry.owner_keycloak_sub
            )

        usage = telemetry.token_usage
        await create_assistant_turn_log(
            session,
            turn_id=telemetry.turn_id,
            session_id=telemetry.session_id,
            turn_index=telemetry.turn_index,
            user_id=user_id,
            user_message=strip_nuls(telemetry.user_message),
            assistant_reply=strip_nuls(telemetry.assistant_reply),
            outcome=telemetry.outcome.value,
            error_kind=telemetry.error_kind,
            transcript=strip_nuls(telemetry.transcript),
            transcript_truncated=telemetry.transcript_truncated,
            schema_state=strip_nuls(telemetry.schema_state),
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
            requests=usage.requests,
            tool_calls=usage.tool_calls,
            latency_ms=telemetry.latency_ms,
            model=telemetry.model,
            provider=telemetry.provider,
        )


async def purge_expired(days: int | None = None) -> int:
    """Delete turn logs past the retention window. Returns rows removed."""
    settings = get_settings()
    if days is None:
        days = settings.ASSISTANT_TURN_LOG_RETENTION_DAYS
    if days < 1:
        # 0 reads like "no expiry" but computes a cutoff of now, which deletes
        # the whole table on the next sweep. The CLI already rejects this.
        logger.error(
            "Refusing to purge: ASSISTANT_TURN_LOG_RETENTION_DAYS=%s is not a "
            "positive number of days. Use ASSISTANT_TURN_LOG_PURGE_ENABLED to "
            "turn the sweep off.",
            days,
        )
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    async with db_session() as session:
        return await purge_assistant_turn_logs_before(session, cutoff)


async def _purge_loop() -> None:
    settings = get_settings()
    interval = max(60.0, settings.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS * 3600.0)
    while True:
        try:
            deleted = await purge_expired()
            if deleted:
                logger.info(
                    "Purged %d turn log rows past the %d day window",
                    deleted,
                    settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            # A broken sweep is a privacy problem, not a cosmetic one -- log it
            # every pass, and let the next pass retry.
            logger.exception("Turn log purge failed")
        await asyncio.sleep(interval)


def start_purge_task() -> asyncio.Task | None:
    """Start the sweep, or explain why there isn't one."""
    settings = get_settings()
    days = active_retention_days(settings)
    if days is None:
        # Same predicate as the writer, so we never spin a loop that can only
        # log errors -- a non-positive window makes purge_expired refuse.
        if settings.DATABASE_URL and settings.ASSISTANT_TURN_LOGGING_ENABLED:
            logger.warning(
                "No turn log retention sweep: %s. Turn logging is disabled too, "
                "so nothing is being recorded.",
                "sweep switched off"
                if not settings.ASSISTANT_TURN_LOG_PURGE_ENABLED
                else f"retention window is {settings.ASSISTANT_TURN_LOG_RETENTION_DAYS} days",
            )
        return None

    logger.info(
        "Turn log retention sweep every %.1fh, window %d days",
        settings.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS,
        days,
    )
    return asyncio.create_task(_purge_loop())


@asynccontextmanager
async def lifecycle():
    """Run the retention sweep for the app's lifetime."""
    purge_task = start_purge_task()
    try:
        yield
    finally:
        if purge_task is not None:
            purge_task.cancel()
            with suppress(asyncio.CancelledError):
                await purge_task
