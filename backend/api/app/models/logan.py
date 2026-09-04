"""Models for handing a Logan/kmindex search to the Analysis Assistant.

The snapshot is what a session stores and what the model is shown. It is
deliberately small: the whole-match-set cohort (the only honest numbers), the
top hits by score, and the totals. Never the 50,000-row pageable list.
"""

from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.galaxy import KmindexCohort, KmindexIndexSummary

JOB_ID_PATTERN = r"^[0-9a-f]{16}$"


class LoganTopHit(BaseModel):
    """One score-ranked hit with its mirror metadata flattened."""

    rank: int
    accession: str
    score: float
    organism: Optional[str] = None
    platform: Optional[str] = None
    assay_type: Optional[str] = None
    library_layout: Optional[str] = None
    instrument: Optional[str] = None
    country: Optional[str] = None
    release_date: Optional[str] = None
    bioproject: Optional[str] = None
    study: Optional[str] = None


class LoganSnapshot(BaseModel):
    """What a Logan-bound assistant session remembers about its search."""

    job_id: str
    query_name: Optional[str] = None
    results_url: str
    total_matches: int
    total_hits: int
    truncated: bool = False
    shards_searched: int = 0
    shards_with_hits: int = 0
    shards_failed: int = 0
    per_index: List[KmindexIndexSummary] = Field(default_factory=list)
    cohort: Optional[KmindexCohort] = None
    sra_mirror_available: bool = False
    top_hits: List[LoganTopHit] = Field(default_factory=list)
    captured_at: str


class LoganContext(BaseModel):
    """The few fields the UI's cohort card needs from a Logan-bound session."""

    job_id: str
    total_matches: int
    in_mirror: int = 0
    top_organism: Optional[str] = None
    top_organism_share: Optional[float] = Field(
        default=None, description="Share of in_mirror runs, 0-1"
    )
    results_url: str


class LoganSessionRequest(BaseModel):
    """Body for POST /api/v1/assistant/session."""

    logan_job_id: str = Field(..., pattern=JOB_ID_PATTERN)
