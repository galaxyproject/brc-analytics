"""Partner API: Logan searches run on behalf of an external partner service.

A thin, keyed layer over the same GalaxyService the site uses, so partner
traffic has its own identity, budgets, Galaxy history and analytics tag, and
can be paused or retired without touching the routes our own frontend uses.
Mounted only when PARTNER_API_ENABLED is set, and answers 410 once
PARTNER_API_SUNSET passes.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Response
from starlette.requests import Request

from app.api.v1.galaxy import serve_kmindex_export
from app.core.cache import CacheService
from app.core.config import get_settings
from app.core.dependencies import (
    get_cache_service,
    get_partner,
    get_sra_mirror_service,
)
from app.core.partner_keys import Partner, sunset_header
from app.models.galaxy import (
    KmindexOrder,
    KmindexQuerySubmission,
    KmindexQueueStatus,
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
)
from app.services.logan_jobs import (
    RESULTS_RETRY_AFTER,
    STATUS_RETRY_AFTER,
    partner_galaxy_service,
    require_galaxy,
    submit_partner_job,
)
from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)
# Every route authenticates here, not by way of whichever dependency happens to
# need the partner. FastAPI resolves get_partner once per request, so the routes
# that also ask for it are not charged twice.
router = APIRouter(dependencies=[Depends(get_partner)])

PARTNER_PREFIX = "/api/v1/partner/logan"

STDERR_TAIL = 2000

JobId = Path(..., pattern=JOB_ID_PATTERN)


async def get_partner_galaxy_service(
    partner: Partner = Depends(get_partner),
    cache: CacheService = Depends(get_cache_service),
    sra_mirror: Optional[SRAMirrorService] = Depends(get_sra_mirror_service),
) -> GalaxyService:
    """A GalaxyService on the BRC service account, in the partner's own history."""
    return partner_galaxy_service(partner, cache, sra_mirror)


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


@router.get("/indexes")
async def list_indexes(galaxy: GalaxyService = Depends(get_partner_galaxy_service)):
    """The Logan indexes a search can name."""
    require_galaxy(galaxy)
    try:
        indexes = await galaxy.list_kmindex_indexes()
    except Exception as e:
        logger.error(f"Partner index list failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to list kmindex indexes"
        ) from e
    return {"count": len(indexes), "indexes": indexes}


@router.get("/queue", response_model=KmindexQueueStatus)
async def queue(galaxy: GalaxyService = Depends(get_partner_galaxy_service)):
    """How many searches are waiting to start, and how long recent ones waited."""
    require_galaxy(galaxy)
    try:
        return await galaxy.get_kmindex_queue()
    except Exception as e:
        logger.error(f"Partner queue read failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to read the search queue"
        ) from e


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
    job_id = await submit_partner_job(
        request, partner, submission, galaxy, cache, idempotency_key
    )
    return _created(job_id)


@router.get("/jobs/{job_id}", response_model=PartnerJobStatus)
async def job_status(
    response: Response,
    job_id: str = JobId,
    galaxy: GalaxyService = Depends(get_partner_galaxy_service),
):
    """Where the search has got to: 202 with Retry-After until it finishes."""
    require_galaxy(galaxy)
    try:
        status = await galaxy.get_job_status(job_id)
    except GalaxyJobNotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        # Warning, not error: the 502 below already reaches Sentry.
        logger.warning("Partner status for %s failed: %s", job_id, e)
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
    require_galaxy(galaxy)
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
    galaxy: GalaxyService = Depends(get_partner_galaxy_service),
) -> Response:
    """
    Every hit the search matched, not just the pages results serves.

    Written when the results are first merged, so read results once before
    this. Kept for about a day at most, and sooner under disk pressure.
    """
    return await serve_kmindex_export(job_id, format, galaxy)


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
