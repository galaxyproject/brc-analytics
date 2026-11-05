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
from app.services.logan_snapshot import results_url_for

logger = logging.getLogger(__name__)

# Agents retry tool calls on timeouts and on their own whims. Within this
# window the same caller sending the same search gets the job it already
# started, not a second search across every index.
DEDUPE_TTL = 600


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
    if not key:
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
        existing = await cache.get(dedupe_key)
        if existing and existing.get("job_id"):
            return _started(existing["job_id"], partner, reused=True)
        if partner is not None:
            galaxy = logan_jobs.partner_galaxy_service(partner, cache, sra_mirror)
            job_id = await logan_jobs.submit_partner_job(
                request, partner, submission, galaxy, cache
            )
        else:
            galaxy = logan_jobs.anonymous_galaxy_service(cache, sra_mirror)
            job_id = await logan_jobs.submit_anonymous_job(request, submission, galaxy)
    except HTTPException as e:
        return http_error(e)
    await cache.set(dedupe_key, {"job_id": job_id}, DEDUPE_TTL)
    return _started(job_id, partner, reused=False)


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
