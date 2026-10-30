"""Response models for the temporary partner API."""

from typing import Optional, Union

from pydantic import BaseModel, Field

from app.models.galaxy import GalaxyJobState


class PartnerJobCreated(BaseModel):
    """A submitted search, and where to follow it."""

    job_id: str
    status_url: str
    results_url: str
    export_url: str


class PartnerJobStatus(BaseModel):
    """Where a partner's search has got to."""

    job_id: str
    state: Union[GalaxyJobState, str] = Field(union_mode="left_to_right")
    is_complete: bool
    is_successful: bool
    created_time: str
    updated_time: str
    # The tail of the tool's stderr when the job failed, which is usually the
    # only explanation there is.
    error: Optional[str] = None
