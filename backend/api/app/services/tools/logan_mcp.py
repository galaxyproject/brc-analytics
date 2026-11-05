"""Logan tools that only make sense over MCP: they act for the caller.

The read tools in logan_tools.py are shared with the assistant and only ever
read. These start searches, so they need to know who is asking: an
X-API-Key header makes the caller that partner, with its budget and history;
no header makes it an anonymous client, exactly as on the web page.

Failures come back as an error dict rather than an exception. Every one of
them -- a spent budget, a bad index, a key past its sunset -- is something an
agent can act on, and the status and Retry-After tell it how.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from typing import Any, List, Optional

from fastapi import HTTPException
from fastmcp.server.dependencies import get_http_request
from pydantic import ValidationError
from starlette.requests import Request

from app.core import dependencies
from app.core.config import get_settings
from app.core.partner_keys import Partner
from app.models.galaxy import KmindexQuerySubmission
from app.services import logan_jobs
from app.services.galaxy_service import (
    AggregationLane,
    GalaxyJobAggregating,
    GalaxyJobNotComplete,
    GalaxyService,
    GalaxySubmitNotStarted,
    KmindexUnknownIndex,
)
from app.services.logan_snapshot import results_url_for

logger = logging.getLogger(__name__)

# Agents retry tool calls on timeouts and on their own whims. Within this
# window the same caller sending the same search gets the job it already
# started, not a second search across every index.
DEDUPE_TTL = 600
# How long a claim made before submitting holds off a retry: long enough to
# cover an upload and tool run, short enough that an interrupted submit
# doesn't block the same search for the whole dedupe window.
CLAIM_TTL = 120


def http_error(e: HTTPException) -> dict:
    out: dict[str, Any] = {"error": e.detail, "status_code": e.status_code}
    retry_after = (e.headers or {}).get("Retry-After")
    if retry_after:
        out["retry_after_seconds"] = int(retry_after)
    return out


def current_request() -> Optional[Request]:
    try:
        return get_http_request()
    except RuntimeError:
        return None


def resolve_partner(request: Request) -> Optional[Partner]:
    """The partner an X-API-Key names, None without one.

    A key that's present but wrong is an error, never a quiet downgrade to
    anonymous: the caller meant to spend its own budget and should hear why
    it can't.
    """
    key = request.headers.get("x-api-key")
    if key is None:
        return None
    if not get_settings().PARTNER_API_ENABLED:
        raise HTTPException(
            status_code=400, detail="This server does not accept partner API keys"
        )
    return dependencies.authenticate_partner_key(key)


def _dedupe_key(request: Request, partner: Optional[Partner], fingerprint: str) -> str:
    if partner is not None:
        who = f"partner:{partner.partner_id}"
    else:
        # Same identity the anonymous submit pool charges.
        who = dependencies.get_submit_rate_limiter()._get_client_key(request)
    digest = hashlib.sha256(who.encode("utf-8")).hexdigest()[:32]
    return f"mcp:logan:dedupe:{digest}:{fingerprint}"


async def logan_submit(
    sequence: str, indexes: List[str], threshold: float = 0.5
) -> dict:
    request = current_request()
    if request is None:
        return {"error": "Starting a search needs an HTTP MCP connection."}
    try:
        submission = KmindexQuerySubmission(
            sequence=sequence, indexes=indexes, threshold=threshold
        )
    except ValidationError as e:
        return {
            "error": "Invalid search request",
            "status_code": 422,
            "details": [
                {"field": ".".join(str(p) for p in err["loc"]), "message": err["msg"]}
                for err in e.errors()
            ],
        }
    try:
        partner = resolve_partner(request)
        cache = dependencies.get_cache_service()
        sra_mirror = dependencies.get_sra_mirror_service()
        dedupe_key = _dedupe_key(
            request, partner, logan_jobs.submission_fingerprint(submission)
        )
        if partner is not None:
            galaxy = logan_jobs.partner_galaxy_service(partner, cache, sra_mirror)
        else:
            galaxy = logan_jobs.anonymous_galaxy_service(cache, sra_mirror)
        # Claimed before submitting, so a retry that lands while the first
        # call is still talking to Galaxy finds the claim instead of nothing.
        if not await cache.set_if_absent(dedupe_key, {"pending": True}, CLAIM_TTL):
            existing = await cache.get(dedupe_key) or {}
            if not (
                existing.get("job_id") and await _job_failed(galaxy, existing["job_id"])
            ):
                return _claimed(existing, partner)
            await cache.delete(dedupe_key)
            if not await cache.set_if_absent(dedupe_key, {"pending": True}, CLAIM_TTL):
                return _claimed(await cache.get(dedupe_key) or {}, partner)
    except HTTPException as e:
        return http_error(e)
    try:
        if partner is not None:
            job_id = await logan_jobs.submit_partner_job(
                request, partner, submission, galaxy, cache
            )
        else:
            job_id = await logan_jobs.submit_anonymous_job(request, submission, galaxy)
    except HTTPException as e:
        if _maybe_started(e):
            await cache.set(dedupe_key, {"outcome": "unknown"}, CLAIM_TTL)
        else:
            await cache.delete(dedupe_key)
        return http_error(e)
    await cache.set(dedupe_key, {"job_id": job_id}, DEDUPE_TTL)
    return _started(job_id, partner, reused=False)


async def _job_failed(galaxy: GalaxyService, job_id: str) -> bool:
    try:
        status = await galaxy.get_job_status(job_id)
    except Exception:
        return False  # can't tell; reusing is the cheaper mistake
    return bool(status.is_complete and not status.is_successful)


def _maybe_started(e: HTTPException) -> bool:
    # logan_jobs raises from the Galaxy error when Galaxy was asked; only a
    # clean refusal there means nothing runs. Anything raised before the
    # submit (budget, pause, validation) has no cause.
    cause = e.__cause__
    return cause is not None and not isinstance(
        cause, (GalaxySubmitNotStarted, KmindexUnknownIndex)
    )


def _claimed(existing: dict, partner: Optional[Partner]) -> dict:
    if existing.get("job_id"):
        return _started(existing["job_id"], partner, reused=True)
    if existing.get("outcome") == "unknown":
        error = (
            "The same search just failed after Galaxy was asked to run it, so "
            "it may be running anyway. Check logan_queue, or send it again "
            "after the retry delay."
        )
        retry_after = CLAIM_TTL
    else:
        error = "The same search is being started right now; ask again shortly."
        retry_after = int(logan_jobs.STATUS_RETRY_AFTER)
    return {"error": error, "status_code": 409, "retry_after_seconds": retry_after}


def _started(job_id: str, partner: Optional[Partner], reused: bool) -> dict:
    return {
        "status": "reused" if reused else "submitted",
        "job_id": job_id,
        "as": f"partner:{partner.partner_id}" if partner else "anonymous",
        "results_url": results_url_for(job_id),
        "message": (
            (
                "This search was already started in the last few minutes; "
                "here is that job. "
                if reused
                else ""
            )
            + "Searches usually take a few minutes and can wait to start when "
            "the queue is busy (see logan_queue). Poll logan_job_status with "
            "this job_id, then read logan_cohort and logan_hits."
        ),
    }


async def logan_list_indexes(galaxy: GalaxyService) -> dict:
    try:
        indexes = await galaxy.list_kmindex_indexes()
    except Exception as e:
        logger.error(f"MCP index list failed: {e}")
        return {"error": "Failed to list Logan indexes", "status_code": 502}
    return {"count": len(indexes), "indexes": indexes}


async def logan_queue(galaxy: GalaxyService) -> dict:
    try:
        status = await galaxy.get_kmindex_queue()
    except Exception as e:
        logger.error(f"MCP queue read failed: {e}")
        return {"error": "Failed to read the search queue", "status_code": 502}
    return status.model_dump(mode="json")


# Seconds to tell an agent to wait before asking again while results merge.
BUILD_RETRY_AFTER = 15
STDERR_TAIL = 2000

# A merge that fails is remembered this long, so polls get an answer instead
# of "building" forever, each one starting the same failing merge again.
BUILD_FAILURE_TTL = 300


def _build_failure_key(job_id: str) -> str:
    return f"mcp:logan:buildfail:{job_id}"


# Strong references to running merges: the event loop only keeps weak ones,
# and a merge collected mid-flight leaves its claim marker set for an hour.
_builds: set[asyncio.Task] = set()


def _start_build(galaxy: GalaxyService, job_id: str, lane: AggregationLane) -> None:
    async def build() -> None:
        try:
            await galaxy.get_kmindex_results(
                job_id, limit=1, offset=0, lane=lane, wait=False
            )
        except (GalaxyJobAggregating, GalaxyJobNotComplete):
            pass  # someone else is merging it, or no slot; the next poll retries
        except Exception as e:
            logger.error("MCP merge for %s failed: %s", job_id, e)
            await galaxy.cache.set(
                _build_failure_key(job_id), {"failed": True}, BUILD_FAILURE_TTL
            )

    task = asyncio.create_task(build())
    _builds.add(task)
    task.add_done_callback(_builds.discard)


async def with_rebuild(galaxy: GalaxyService, job_id: str, out: dict) -> dict:
    """Turn a cache miss on a finished search into a merge the agent can wait on.

    The read tools are cache-only because the assistant can't wait on a merge
    inside a chat turn. An MCP client can: it gets told to ask again shortly
    while the merge runs off the request, so no tool call sits through a
    multi-minute merge. Key holders merge on the partner lane; anonymous
    callers on the native one, without ever queueing there behind the web.
    """
    if out.get("status") != "expired":
        return out
    request = current_request()
    try:
        partner = resolve_partner(request) if request is not None else None
    except HTTPException as e:
        return http_error(e)
    try:
        status = await galaxy.get_job_status(job_id)
    except Exception as e:
        # The "expired" answer sends a human to the results page, which an
        # agent can't use; tell it to ask again instead.
        logger.warning("MCP status for %s failed: %s", job_id, e)
        return {
            "error": "Could not read this search's status from Galaxy.",
            "status_code": 502,
            "job_id": job_id,
            "retry_after_seconds": BUILD_RETRY_AFTER,
        }
    if not status.is_complete:
        return {
            "status": "not_ready",
            "job_id": job_id,
            "retry_after_seconds": BUILD_RETRY_AFTER,
            "results_url": results_url_for(job_id),
            "message": "This search is still running; poll logan_job_status.",
        }
    if not status.is_successful:
        return {
            "status": "failed",
            "job_id": job_id,
            "error": (status.stderr or "")[-STDERR_TAIL:] or None,
            "results_url": results_url_for(job_id),
        }
    if await galaxy.cache.get(_build_failure_key(job_id)):
        return {
            "error": "Merging this search's results failed. Try again later.",
            "status_code": 502,
            "job_id": job_id,
            "retry_after_seconds": BUILD_FAILURE_TTL,
            "results_url": results_url_for(job_id),
        }
    _start_build(galaxy, job_id, "partner" if partner is not None else "native")
    return {
        "status": "building",
        "job_id": job_id,
        "retry_after_seconds": BUILD_RETRY_AFTER,
        "results_url": results_url_for(job_id),
        "message": (
            "This search has finished and its results are being merged now. "
            f"Ask again in about {BUILD_RETRY_AFTER} seconds; a search over "
            "every index can take a few minutes to merge."
        ),
    }
