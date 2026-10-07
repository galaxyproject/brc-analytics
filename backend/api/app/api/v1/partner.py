"""Partner API: Logan searches run on behalf of an external partner service.

A thin, keyed layer over the same GalaxyService the site uses, so partner
traffic has its own identity, budgets, Galaxy history and analytics tag, and
can be paused or retired without touching the routes our own frontend uses.
Mounted only when PARTNER_API_ENABLED is set, and answers 410 once
PARTNER_API_SUNSET passes.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Optional

import redis.asyncio as redis
from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Response
from starlette.requests import Request

from app.api.v1.galaxy import serve_kmindex_export
from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.core.dependencies import (
    check_partner_submit_rate_limit,
    get_cache_service,
    get_partner,
    get_sra_mirror_service,
)
from app.core.galaxy_credential import GalaxyCredential
from app.core.partner_keys import Partner, sunset_header
from app.models.galaxy import (
    KmindexOrder,
    KmindexQuerySubmission,
    KmindexResults,
    KmindexSort,
)
from app.models.logan import JOB_ID_PATTERN
from app.models.partner import PartnerJobCreated, PartnerJobStatus
from app.services.galaxy_service import (
    GalaxyJobAggregating,
    GalaxyJobFailed,
    GalaxyJobNotComplete,
    GalaxyJobNotFound,
    GalaxyService,
    GalaxySubmitNotStarted,
    KmindexUnknownIndex,
)
from app.services.kmindex_submissions import record_submission
from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)
# Every route authenticates here, not by way of whichever dependency happens to
# need the partner. FastAPI resolves get_partner once per request, so the routes
# that also ask for it are not charged twice.
router = APIRouter(dependencies=[Depends(get_partner)])

PARTNER_PREFIX = "/api/v1/partner/logan"

# Seconds a caller should wait before asking again. Status matches the live
# status cache, so an earlier poll could only ever see the same answer.
STATUS_RETRY_AFTER = "10"
RESULTS_RETRY_AFTER = "15"

# A claim with no job recorded yet is held for the whole day, like a recorded
# job. A submit normally fills it in within seconds; one that never does died
# somewhere around run_tool, which is as ambiguous as a submit that failed
# there, and letting the claim lapse would let a retry start a second search.
#
# These records sit in the cache Redis (allkeys-lru), so the guarantee holds
# only while Redis isn't evicting. That's a deliberate tradeoff for a temporary
# API; docs/partner-api.md says to watch evicted_keys.
IDEMPOTENCY_TTL = CacheTTL.ONE_DAY
STDERR_TAIL = 2000

JobId = Path(..., pattern=JOB_ID_PATTERN)


async def get_partner_galaxy_service(
    partner: Partner = Depends(get_partner),
    cache: CacheService = Depends(get_cache_service),
    sra_mirror: Optional[SRAMirrorService] = Depends(get_sra_mirror_service),
) -> GalaxyService:
    """
    A GalaxyService on the BRC service account, in the partner's own history.

    Built from the service key directly, never from get_galaxy_credential:
    that one prefers a signed-in user's bearer, so a stray session cookie on a
    partner request would otherwise run the job as that user.
    """
    key = get_settings().GALAXY_API_KEY
    credential = GalaxyCredential(kind="service", secret=key) if key else None
    return GalaxyService(
        cache,
        credential=credential,
        history_name=f"BRC Logan Partner - {partner.partner_id}",
        sra_mirror=sra_mirror,
    )


def _require_galaxy(galaxy: GalaxyService) -> None:
    if not galaxy.is_available():
        raise HTTPException(status_code=503, detail="Galaxy service is not available")


def _created(job_id: str) -> PartnerJobCreated:
    # Paths, not absolute URLs: behind the proxy, url_for would hand back the
    # backend container's own host.
    base = f"{PARTNER_PREFIX}/jobs/{job_id}"
    return PartnerJobCreated(
        export_url=f"{base}/export",
        job_id=job_id,
        results_url=f"{base}/results",
        status_url=base,
    )


def _idempotency_key(partner: Partner, key: str) -> str:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return f"partner:idem:{partner.partner_id}:{digest}"


def _fingerprint(submission: KmindexQuerySubmission) -> str:
    body = json.dumps(submission.model_dump(), sort_keys=True)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _replay(existing: dict, fingerprint: str) -> str:
    """The job an earlier submit under this key made, or why there isn't one.

    A claim with no job yet reads as in progress. Normally that clears within
    seconds; a claim that never does belongs to a submit that was interrupted.
    """
    if existing and existing.get("fingerprint") != fingerprint:
        raise HTTPException(
            status_code=409,
            detail="Idempotency-Key was already used for a different request",
        )
    if existing.get("outcome") == "unknown":
        raise HTTPException(
            status_code=409,
            detail=(
                "The submission under this Idempotency-Key failed after Galaxy "
                "was asked to run it, so it may be running anyway. Send a new "
                "Idempotency-Key to submit it again."
            ),
        )
    job_id = existing.get("job_id")
    if not job_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "A submission with this Idempotency-Key is still in progress. If "
                "this persists past a minute, it was interrupted and may or may "
                "not have started; send a new Idempotency-Key to submit again."
            ),
            headers={"Retry-After": STATUS_RETRY_AFTER},
        )
    return job_id


@router.get("/indexes")
async def list_indexes(galaxy: GalaxyService = Depends(get_partner_galaxy_service)):
    """The Logan indexes a search can name."""
    _require_galaxy(galaxy)
    try:
        indexes = await galaxy.list_kmindex_indexes()
    except Exception as e:
        logger.error(f"Partner index list failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to list kmindex indexes"
        ) from e
    return {"count": len(indexes), "indexes": indexes}


@router.post("/jobs", response_model=PartnerJobCreated, status_code=202)
async def submit_job(
    request: Request,
    submission: KmindexQuerySubmission,
    partner: Partner = Depends(get_partner),
    galaxy: GalaxyService = Depends(get_partner_galaxy_service),
    cache: CacheService = Depends(get_cache_service),
    idempotency_key: Optional[str] = Header(
        default=None, alias="Idempotency-Key", max_length=255
    ),
):
    """
    Start a search. Poll status_url, then read results_url or export_url.

    Send an Idempotency-Key to make retries safe: a repeat of the same request
    under the same key within a day answers with the job the first one made,
    instead of starting another search across every index.
    """
    if not submission.sequence.strip():
        raise HTTPException(status_code=400, detail="Query sequence cannot be empty")
    if idempotency_key is not None and not idempotency_key.strip():
        # A blank key would otherwise read as no key at all, and the caller
        # would believe its retries were protected when they aren't.
        raise HTTPException(status_code=400, detail="Idempotency-Key is empty")
    idem_key = _idempotency_key(partner, idempotency_key) if idempotency_key else None
    fingerprint = _fingerprint(submission)

    # A replay hands back a job that already exists, so it comes before the
    # controls on starting new ones: a caller whose 20th submit lost its reply
    # must still get that job id back, not a 429, and pausing submits mustn't
    # strand jobs already made.
    if idem_key is not None:
        existing = await cache.get(idem_key)
        if existing:
            return _created(_replay(existing, fingerprint))

    if get_settings().PARTNER_SUBMIT_PAUSED:
        raise HTTPException(
            status_code=503,
            detail="New partner submissions are paused; existing jobs still answer",
        )
    _require_galaxy(galaxy)
    await check_partner_submit_rate_limit(request, partner)

    if idem_key is not None:
        try:
            claimed = await cache.set_if_absent(
                idem_key, {"fingerprint": fingerprint}, IDEMPOTENCY_TTL
            )
        except redis.RedisError as e:
            # The caller asked for a retry-safe submit; going ahead without the
            # claim would make it quietly unsafe.
            logger.error(f"Idempotency claim failed for {partner.partner_id}: {e}")
            raise HTTPException(
                status_code=503,
                detail="Could not reserve the Idempotency-Key; try again shortly",
                headers={"Retry-After": STATUS_RETRY_AFTER},
            ) from e
        if not claimed:
            return _created(_replay(await cache.get(idem_key) or {}, fingerprint))

    try:
        response = await galaxy.submit_kmindex_query(submission)
    except KmindexUnknownIndex as e:
        # A bad request, not a failure: release the key so the caller can fix
        # the index list and resend under it.
        if idem_key is not None:
            await cache.delete(idem_key)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except GalaxySubmitNotStarted as e:
        # Nothing reached run_tool, so no job exists and a retry is safe.
        if idem_key is not None:
            await cache.delete(idem_key)
        logger.error(f"Partner {partner.partner_id} submit failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to submit kmindex query"
        ) from e
    except Exception as e:
        # Galaxy may have queued the job and lost the reply. Keep the key, so a
        # blind retry can't start a second search across every index.
        if idem_key is not None:
            await cache.set(
                idem_key,
                {"fingerprint": fingerprint, "outcome": "unknown"},
                IDEMPOTENCY_TTL,
            )
        logger.error(
            f"Partner {partner.partner_id} submit ended ambiguously "
            f"(Galaxy may have started it): {e}"
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "The kmindex query may or may not have started; Galaxy did not "
                "confirm it"
            ),
        ) from e

    if idem_key is not None and not await cache.set(
        idem_key,
        {"fingerprint": fingerprint, "job_id": response.job_id},
        IDEMPOTENCY_TTL,
    ):
        # The job exists either way; only a retry within the next few minutes
        # is affected, and it gets a 409 rather than a second job.
        logger.error(
            f"Could not record job {response.job_id} under its Idempotency-Key"
        )
    await record_submission(
        credential=galaxy.credential,
        galaxy_job_id=response.job_id,
        partner_id=partner.partner_id,
        source="partner",
        submission=submission,
    )
    return _created(response.job_id)


@router.get("/jobs/{job_id}", response_model=PartnerJobStatus)
async def job_status(
    response: Response,
    job_id: str = JobId,
    galaxy: GalaxyService = Depends(get_partner_galaxy_service),
):
    """Where the search has got to: 202 with Retry-After until it finishes."""
    _require_galaxy(galaxy)
    try:
        status = await galaxy.get_job_status(job_id)
    except GalaxyJobNotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Partner status for {job_id} failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to get job status") from e

    if not status.is_complete:
        response.status_code = 202
        response.headers["Retry-After"] = STATUS_RETRY_AFTER
    error = None
    if status.is_complete and not status.is_successful:
        error = (status.stderr or "")[-STDERR_TAIL:] or None
    return PartnerJobStatus(
        created_time=status.created_time,
        error=error,
        is_complete=status.is_complete,
        is_successful=status.is_successful,
        job_id=job_id,
        state=status.state,
        updated_time=status.updated_time,
    )


@router.get("/jobs/{job_id}/results", response_model=KmindexResults)
async def job_results(
    job_id: str = JobId,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    sort: KmindexSort = Query(default="score"),
    order: Optional[KmindexOrder] = Query(default=None),
    galaxy: GalaxyService = Depends(get_partner_galaxy_service),
):
    """
    A page of the merged, FP-corrected hits, joined to SRA metadata.

    202 with Retry-After while the job runs or its shards are being merged;
    partner merges have a lane of their own and never wait in line here.
    """
    _require_galaxy(galaxy)
    try:
        return await galaxy.get_kmindex_results(
            job_id, limit, offset, lane="partner", order=order, sort=sort
        )
    except (GalaxyJobNotComplete, GalaxyJobAggregating) as e:
        raise HTTPException(
            status_code=202,
            detail=str(e),
            headers={"Retry-After": RESULTS_RETRY_AFTER},
        ) from e
    except GalaxyJobFailed as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except GalaxyJobNotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Partner results for {job_id} failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to get kmindex results"
        ) from e


@router.get("/jobs/{job_id}/export")
async def job_export(
    job_id: str = JobId,
    format: str = Query(default="tsv", pattern="^(parquet|tsv)$"),
) -> Response:
    """
    Every hit the search matched, not just the pages results serves.

    Written when the results are first merged, so read results once before
    this. Kept for about a day at most, and sooner under disk pressure.
    """
    return await serve_kmindex_export(job_id, format)


async def add_sunset_header(request: Request, call_next):
    """Stamp every partner response, errors included, with the Sunset date."""
    response = await call_next(request)
    sunset = get_settings().PARTNER_API_SUNSET
    path = request.url.path
    if sunset is not None and (
        path == PARTNER_PREFIX or path.startswith(f"{PARTNER_PREFIX}/")
    ):
        response.headers["Sunset"] = sunset_header(sunset)
    return response
