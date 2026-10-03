"""Durable record of every Logan/kmindex search, for analytics.

One row per submitted job, tagged with where it came from: brc-analytics.org
itself ("native") or the partner API ("partner"). Fail-open like the assistant
turn log -- the Galaxy job already exists by the time this runs, so losing the
row must never cost the caller their job id.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Literal, Optional

from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.db.crud import create_kmindex_submission, get_user_id_by_keycloak_sub
from app.db.session import db_session
from app.models.galaxy import KmindexQuerySubmission, query_bases

logger = logging.getLogger(__name__)

SubmissionSource = Literal["native", "partner"]

# An insert is milliseconds; this only bounds a database that has stopped
# answering, which would otherwise hold the submit response hostage.
WRITE_TIMEOUT_SECONDS = 5.0


async def record_submission(
    *,
    galaxy_job_id: str,
    submission: KmindexQuerySubmission,
    source: SubmissionSource,
    credential: Optional[GalaxyCredential],
    partner_id: Optional[str] = None,
) -> None:
    """
    Persist one submission row. Never raises.

    Skipped where no database is configured; the structured log line is then
    the only record.

    @param galaxy_job_id: the job Galaxy created.
    @param submission: the validated request, for indexes, size and settings.
    @param source: native or partner.
    @param credential: the Galaxy identity the job ran as.
    @param partner_id: the partner, when source is partner.
    """
    identity = credential.kind if credential is not None else "service"
    logger.info(
        "kmindex submission job=%s source=%s partner=%s identity=%s indexes=%d",
        galaxy_job_id,
        source,
        partner_id or "-",
        identity,
        len(submission.indexes),
    )
    if not get_settings().DATABASE_URL:
        return

    try:
        await asyncio.wait_for(
            _write(galaxy_job_id, submission, source, credential, partner_id),
            timeout=WRITE_TIMEOUT_SECONDS,
        )
    except Exception:
        logger.exception("Failed to record kmindex submission %s", galaxy_job_id)


async def _write(
    galaxy_job_id: str,
    submission: KmindexQuerySubmission,
    source: SubmissionSource,
    credential: Optional[GalaxyCredential],
    partner_id: Optional[str],
) -> None:
    """Insert the row, resolving a signed-in user's id on the way."""
    async with db_session() as db:
        user_id = None
        if credential is not None and credential.kind == "user":
            user_id = await get_user_id_by_keycloak_sub(db, credential.user_sub)
        await create_kmindex_submission(
            db,
            galaxy_job_id=galaxy_job_id,
            identity=credential.kind if credential is not None else "service",
            indexes=list(submission.indexes),
            partner_id=partner_id,
            query_bases=query_bases(submission.sequence),
            source=source,
            threshold=submission.threshold,
            user_id=user_id,
            zvalue=submission.zvalue,
        )
        await db.commit()
