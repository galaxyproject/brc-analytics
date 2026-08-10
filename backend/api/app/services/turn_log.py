"""Durable per-turn assistant logging (#1294).

Owns both halves of the turn log's background work: writing rows off the
response path, and sweeping expired ones. The chat endpoint only calls
`schedule()`; `main.py` only opens `lifecycle()`.

Writes are fail-open by design. Losing a log row must never cost a user their
reply, so every failure here is swallowed after being reported.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
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

logger = logging.getLogger(__name__)


def _strip_nuls(value):
    """Remove NUL characters, which Postgres rejects in text and jsonb.

    A NUL is legal in a Python str and in JSON, so a user can paste one into
    the chat box and -- because this writer is fail-open -- silently keep the
    whole turn out of the corpus. Scrubbing beats losing the row.
    """
    if isinstance(value, str):
        return value.replace("\x00", "")
    if isinstance(value, dict):
        return {k: _strip_nuls(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_strip_nuls(v) for v in value]
    return value


# Detached writes need a strong reference or the loop may collect them
# mid-flight. Discarded on completion.
_pending_writes: set[asyncio.Task] = set()

# Analytics must not starve user-facing endpoints for pooled connections
# (pool_size=5, max_overflow=10), so writes queue in-process instead.
_write_slots = asyncio.Semaphore(2)


def schedule(telemetry: TurnTelemetry) -> None:
    """Persist one turn, off the response path. Returns immediately."""
    settings = get_settings()
    if not settings.ASSISTANT_TURN_LOGGING_ENABLED or not settings.DATABASE_URL:
        return

    task = asyncio.create_task(_write_with_timeout(telemetry))
    _pending_writes.add(task)
    task.add_done_callback(_pending_writes.discard)


async def drain(timeout: float = 5.0) -> None:
    """Let in-flight writes finish before the DB engine goes away.

    Shutdown disposes the engine, so without this the turns logged in the last
    moments before a deploy are lost -- often the ones worth reading.
    """
    if not _pending_writes:
        return
    tasks = list(_pending_writes)
    logger.info("Waiting on %d in-flight turn log writes", len(tasks))
    _, still_running = await asyncio.wait(tasks, timeout=timeout)
    if still_running:
        # Cancel rather than abandon: close_db() is next and nulls the engine,
        # so a straggler reaching db_session() would build a fresh engine and
        # connection pool that nothing will ever dispose.
        logger.warning(
            "Giving up on %d turn log writes still running at shutdown",
            len(still_running),
        )
        for task in still_running:
            task.cancel()
        await asyncio.gather(*still_running, return_exceptions=True)


async def _write_with_timeout(telemetry: TurnTelemetry) -> None:
    """Never raises -- this runs detached, so an escape would be unhandled."""
    settings = get_settings()

    async def _acquire_and_write() -> None:
        # Inside the timeout: with only a couple of slots, queueing for one is
        # exactly where a write stalls, and a bound that excluded the wait
        # would let a backlog outlive the drain and die at close_db().
        async with _write_slots:
            await _write(telemetry)

    try:
        await asyncio.wait_for(
            _acquire_and_write(),
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
            user_message=_strip_nuls(telemetry.user_message),
            assistant_reply=_strip_nuls(telemetry.assistant_reply),
            outcome=telemetry.outcome.value,
            error_kind=telemetry.error_kind,
            transcript=_strip_nuls(telemetry.transcript),
            transcript_truncated=telemetry.transcript_truncated,
            schema_state=_strip_nuls(telemetry.schema_state),
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
    settings = get_settings()
    if not settings.DATABASE_URL:
        return None
    if not settings.ASSISTANT_TURN_LOG_PURGE_ENABLED:
        # The UI still promises deletion, so say this out loud.
        logger.warning(
            "Turn log retention sweep is disabled; rows will not be deleted "
            "after %d days despite the notice shown to users",
            settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
        )
        return None

    logger.info(
        "Turn log retention sweep every %.1fh, window %d days",
        settings.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS,
        settings.ASSISTANT_TURN_LOG_RETENTION_DAYS,
    )
    return asyncio.create_task(_purge_loop())


@asynccontextmanager
async def lifecycle():
    """Run the sweep for the app's lifetime and drain writes on the way out.

    The drain has to happen before the DB engine is disposed, so owning both
    ends here keeps that ordering out of main.py.
    """
    purge_task = start_purge_task()
    try:
        yield
    finally:
        if purge_task is not None:
            purge_task.cancel()
            try:
                await purge_task
            except asyncio.CancelledError:
                pass
        await drain()
