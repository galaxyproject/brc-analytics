"""Which Galaxy a request talks to.

Job ids from before a move between Galaxy servers stay readable: with a legacy
Galaxy configured, an existing job whose id is one Blowfish block (16 hex,
Galaxy Test) is read there, and everything else -- every submit, index list
and queue read, and every 32-hex id (usegalaxy.org) -- goes to the primary.
Chosen by length alone rather than by trying one server and then the other,
so a given id always lands on the same Galaxy and a 404 means what it says.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.core.config import get_settings

LEGACY_JOB_ID_LENGTH = 16


@dataclass(frozen=True)
class GalaxyTarget:
    """One Galaxy server and the service key BRC holds on it."""

    api_url: str
    base_url: str
    api_key: str
    # Read-only: never submitted to, and never given a user's bearer.
    legacy: bool = False


def primary_galaxy_target() -> GalaxyTarget:
    settings = get_settings()
    return GalaxyTarget(
        api_url=settings.GALAXY_API_URL,
        base_url=settings.GALAXY_BASE_URL,
        api_key=settings.GALAXY_API_KEY,
    )


def legacy_galaxy_target() -> Optional[GalaxyTarget]:
    settings = get_settings()
    if not settings.GALAXY_LEGACY_API_URL:
        return None
    return GalaxyTarget(
        api_url=settings.GALAXY_LEGACY_API_URL,
        base_url=settings.GALAXY_LEGACY_BASE_URL,
        api_key=settings.GALAXY_LEGACY_API_KEY,
        legacy=True,
    )


def galaxy_target_for_job(job_id: Optional[str]) -> GalaxyTarget:
    """The Galaxy that holds an existing job; the primary when there is none.

    @param job_id: the encoded job id the request is about, or None.
    @returns: the legacy target for a 16-character id when one is configured,
        otherwise the primary.
    """
    if job_id is not None and len(job_id) == LEGACY_JOB_ID_LENGTH:
        legacy = legacy_galaxy_target()
        if legacy is not None:
            return legacy
    return primary_galaxy_target()
