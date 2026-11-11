"""Starting Logan searches on behalf of someone other than a signed-in user.

The partner API and the MCP server both submit kmindex searches for callers
who have no BRC session, and both have to get the same things right: whose
budget a submit is charged to, which Galaxy history it lands in, how retries
avoid starting a second search across every index, and what gets recorded.
That logic lives here so the HTTP and MCP paths can't drift apart.

Errors are raised as HTTPException because the partner router is the first
caller and its status codes are the contract; the MCP layer translates them.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Optional

import redis.asyncio as redis
from fastapi import HTTPException
from starlette.requests import Request

from app.core import dependencies
from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.core.dependencies import check_partner_submit_rate_limit
from app.core.galaxy_credential import GalaxyCredential
from app.core.galaxy_target import galaxy_target_for_job
from app.core.partner_keys import Partner
from app.models.galaxy import KmindexQuerySubmission
from app.services.galaxy_service import (
    GalaxyService,
    GalaxySubmitNotStarted,
    KmindexUnknownIndex,
)
from app.services.kmindex_submissions import record_submission
from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)

# Seconds a caller should wait before asking again. Status matches the live
# status cache, so an earlier poll could only ever see the same answer.
STATUS_RETRY_AFTER = "10"
RESULTS_RETRY_AFTER = "15"

# A claim with no job recorded yet is held for the whole day, like a recorded
# job. A submit normally fills it in within seconds; one that never does died
# somewhere around the tool request, which is as ambiguous as a submit that failed
# there, and letting the claim lapse would let a retry start a second search.
#
# These records sit in the cache Redis (allkeys-lru), so the guarantee holds
# only while Redis isn't evicting. That's a deliberate tradeoff; docs/partner-api.md
# says to watch evicted_keys.
IDEMPOTENCY_TTL = CacheTTL.ONE_DAY

MCP_HISTORY_NAME = "BRC Logan MCP"


def _service_account_galaxy(
    cache: CacheService,
    sra_mirror: Optional[SRAMirrorService],
    history_name: str,
    job_id: Optional[str] = None,
) -> GalaxyService:
    """A GalaxyService on the BRC service account, in the given history.

    Built from the service key directly, never from get_galaxy_credential:
    that one prefers a signed-in user's bearer, so a stray session cookie on a
    partner or MCP request would otherwise run the job as that user.

    @param job_id: the existing job this service will read, if any, which
        picks the Galaxy it lives on. None -- a submit -- is always primary.
    """
    target = galaxy_target_for_job(job_id)
    key = target.api_key
    credential = GalaxyCredential(kind="service", secret=key) if key else None
    return GalaxyService(
        cache,
        credential=credential,
        history_name=history_name,
        sra_mirror=sra_mirror,
        target=target,
    )


def partner_galaxy_service(
    partner: Partner,
    cache: CacheService,
    sra_mirror: Optional[SRAMirrorService],
    job_id: Optional[str] = None,
) -> GalaxyService:
    """A service-account GalaxyService in the partner's own history."""
    return _service_account_galaxy(
        cache, sra_mirror, f"BRC Logan Partner - {partner.partner_id}", job_id
    )


def require_galaxy(galaxy: GalaxyService) -> None:
    if not galaxy.is_available():
        raise HTTPException(status_code=503, detail="Galaxy service is not available")


def submission_fingerprint(submission: KmindexQuerySubmission) -> str:
    body = json.dumps(submission.model_dump(), sort_keys=True)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _idempotency_key(partner: Partner, key: str) -> str:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return f"partner:idem:{partner.partner_id}:{digest}"


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


async def submit_partner_job(
    request: Request,
    partner: Partner,
    submission: KmindexQuerySubmission,
    galaxy: GalaxyService,
    cache: CacheService,
    idempotency_key: Optional[str] = None,
) -> str:
    """
    Start a search charged to a partner and return its Galaxy job id.

    With an idempotency key, a repeat of the same request under the same key
    within a day answers with the job the first one made, instead of starting
    another search across every index.
    """
    if not submission.sequence.strip():
        raise HTTPException(status_code=400, detail="Query sequence cannot be empty")
    if idempotency_key is not None and not idempotency_key.strip():
        # A blank key would otherwise read as no key at all, and the caller
        # would believe its retries were protected when they aren't.
        raise HTTPException(status_code=400, detail="Idempotency-Key is empty")
    idem_key = _idempotency_key(partner, idempotency_key) if idempotency_key else None
    fingerprint = submission_fingerprint(submission)

    # A replay hands back a job that already exists, so it comes before the
    # controls on starting new ones: a caller whose 20th submit lost its reply
    # must still get that job id back, not a 429, and pausing submits mustn't
    # strand jobs already made.
    if idem_key is not None:
        existing = await cache.get(idem_key)
        if existing:
            return _replay(existing, fingerprint)

    if get_settings().PARTNER_SUBMIT_PAUSED:
        raise HTTPException(
            status_code=503,
            detail="New partner submissions are paused; existing jobs still answer",
        )
    require_galaxy(galaxy)
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
            return _replay(await cache.get(idem_key) or {}, fingerprint)

    try:
        response = await galaxy.submit_kmindex_query(submission)
    except KmindexUnknownIndex as e:
        # A bad request, not a failure: release the key so the caller can fix
        # the index list and resend under it.
        if idem_key is not None:
            await cache.delete(idem_key)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except GalaxySubmitNotStarted as e:
        # Galaxy queued nothing, so no job exists and a retry is safe.
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
    return response.job_id


def anonymous_galaxy_service(
    cache: CacheService, sra_mirror: Optional[SRAMirrorService]
) -> GalaxyService:
    """A service-account GalaxyService for keyless MCP searches.

    Its own history, so agent traffic can be told apart from the web's
    anonymous searches when someone goes looking in Galaxy.
    """
    return _service_account_galaxy(cache, sra_mirror, MCP_HISTORY_NAME)


async def submit_anonymous_job(
    request: Request,
    submission: KmindexQuerySubmission,
    galaxy: GalaxyService,
) -> str:
    """
    Start a keyless search and return its Galaxy job id.

    Charged to the same per-IP submit pool as an anonymous search from the web
    page: an agent with no key is just another anonymous client.
    """
    if not submission.sequence.strip():
        raise HTTPException(status_code=400, detail="Query sequence cannot be empty")
    require_galaxy(galaxy)
    await dependencies.get_submit_rate_limiter().check(request)
    try:
        response = await galaxy.submit_kmindex_query(submission)
    except KmindexUnknownIndex as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except GalaxySubmitNotStarted as e:
        logger.error(f"MCP submit failed: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to submit kmindex query"
        ) from e
    except Exception as e:
        logger.error(f"MCP submit ended ambiguously (Galaxy may have started it): {e}")
        raise HTTPException(
            status_code=502,
            detail=(
                "The kmindex query may or may not have started; Galaxy did not "
                "confirm it"
            ),
        ) from e
    await record_submission(
        credential=galaxy.credential,
        galaxy_job_id=response.job_id,
        source="mcp",
        submission=submission,
    )
    return response.job_id
