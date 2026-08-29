"""Assistant tools over Logan/kmindex searches. Read-only and cache-only.

A kmindex job's merged result lives in Redis for a day after the results
page first assembled it. These tools read that and nothing else: a miss is
reported as expired (or not ready) with the results URL, because rebuilding
the aggregate means pulling every shard from Galaxy under a process-wide
lock -- far too slow for a chat turn, and the results page already does it.
"""

from __future__ import annotations

import json
import re

from app.models.logan import JOB_ID_PATTERN
from app.services.logan_snapshot import results_url_for
from app.services.tools.catalog_tools import AssistantDeps

LOGAN_HITS_MAX_LIMIT = 100
_JOB_ID = re.compile(JOB_ID_PATTERN)


def _unavailable() -> str:
    return json.dumps({"error": "Logan search is not configured.", "available": False})


def _bad_job(job_id: str) -> str:
    return json.dumps(
        {"error": f"Invalid job id {job_id!r}; expected 16 hex characters."}
    )


async def _miss(deps: AssistantDeps, job_id: str) -> str:
    """Why a cached read came back empty: still running, or gone."""
    try:
        status = await deps.galaxy.get_job_status(job_id)
        ready = bool(status.is_complete)
    except Exception:
        ready = True  # can't tell; "expired" sends them somewhere useful
    return json.dumps(
        {
            "status": "expired" if ready else "not_ready",
            "job_id": job_id,
            "results_url": results_url_for(job_id),
            "message": (
                "This search's merged results are not cached. Open the results "
                "page to rebuild them, then ask again."
                if ready
                else "This search is still running. Open the results page to "
                "wait for it."
            ),
        }
    )


async def logan_job_status(deps: AssistantDeps, job_id: str) -> str:
    """Check whether a Logan sequence search (kmindex job) has finished.

    Args:
        job_id: the 16-character Galaxy job id from a Logan results URL
            (/logan-search?job=<id>).
    """
    if not deps.galaxy or not deps.galaxy.is_available():
        return _unavailable()
    if not _JOB_ID.match(job_id or ""):
        return _bad_job(job_id)
    status = await deps.galaxy.get_job_status(job_id)
    state = status.state
    return json.dumps(
        {
            "job_id": job_id,
            "state": state.value if hasattr(state, "value") else str(state),
            "is_complete": status.is_complete,
            "is_successful": status.is_successful,
            "results_url": results_url_for(job_id),
        }
    )


async def logan_cohort(deps: AssistantDeps, job_id: str) -> str:
    """Whole-match-set summary of a finished Logan search: how many runs it
    matched, how many the SRA mirror knows, organism/BioProject/study/country
    counts, the ten most frequent organisms, and six metadata facets (assay
    type, platform, library layout, instrument, country, release year) with
    an 'other' and a 'not recorded' row each so shares add to 100%.

    These are the only numbers to describe a search with -- the pageable hit
    list is capped and its composition is not representative.

    Args:
        job_id: the 16-character Galaxy job id from a Logan results URL.
    """
    if not deps.galaxy or not deps.galaxy.is_available():
        return _unavailable()
    if not _JOB_ID.match(job_id or ""):
        return _bad_job(job_id)
    page = await deps.galaxy.get_cached_kmindex_results(job_id, limit=1, offset=0)
    if page is None:
        return await _miss(deps, job_id)
    return json.dumps(
        {
            "status": "ok",
            "job_id": job_id,
            "query_name": page.query_name,
            "total_matches": page.total_matches,
            "total_hits": page.total_hits,
            "truncated": page.truncated,
            "shards_searched": page.shards_searched,
            "shards_with_hits": page.shards_with_hits,
            "shards_failed": page.shards_failed,
            "per_index": [i.model_dump() for i in page.per_index],
            "cohort": page.cohort.model_dump() if page.cohort else None,
            "sra_mirror_available": page.sra_mirror_available,
            "results_url": results_url_for(job_id),
        },
        default=str,
    )


async def logan_hits(
    deps: AssistantDeps, job_id: str, offset: int = 0, limit: int = 25
) -> str:
    """A page of score-ranked hits from a finished Logan search, each with
    its SRA run metadata when the mirror knows it (organism, platform, assay
    type, library layout, instrument, country, release date, BioProject,
    study). Sorted by shared k-mer score, highest first.

    Never compute shares or distributions from a page of hits; use
    logan_cohort for that.

    Args:
        job_id: the 16-character Galaxy job id from a Logan results URL.
        offset: first hit to return (0-based).
        limit: hits per page (default 25, capped at 100).
    """
    if not deps.galaxy or not deps.galaxy.is_available():
        return _unavailable()
    if not _JOB_ID.match(job_id or ""):
        return _bad_job(job_id)
    limit = max(1, min(int(limit), LOGAN_HITS_MAX_LIMIT))
    offset = max(0, int(offset))
    page = await deps.galaxy.get_cached_kmindex_results(
        job_id, limit=limit, offset=offset
    )
    if page is None:
        return await _miss(deps, job_id)
    return json.dumps(
        {
            "status": "ok",
            "job_id": job_id,
            "total_hits": page.total_hits,
            "total_matches": page.total_matches,
            "offset": offset,
            "limit": limit,
            "sra_annotated": page.sra_annotated,
            "hits": [h.model_dump() for h in page.hits],
            "results_url": results_url_for(job_id),
        },
        default=str,
    )
