import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkflowRunCreateRequest(BaseModel):
    workflow_trs_id: str = Field(min_length=1, max_length=255)
    workflow_id: str | None = Field(default=None, max_length=255)
    galaxy_instance_url: str | None = Field(default=None, max_length=2048)
    handoff_url: str = Field(min_length=1, max_length=8192)
    assembly_accession: str | None = Field(default=None, max_length=255)
    launch_source: str = Field(default="site", min_length=1, max_length=64)
    assistant_session_id: str | None = Field(default=None, max_length=255)
    parameters: dict[str, Any] = Field(default_factory=dict)


class WorkflowRunResponse(BaseModel):
    id: uuid.UUID
    workflow_trs_id: str
    workflow_id: str | None = None
    galaxy_instance_url: str | None = None
    handoff_url: str
    assembly_accession: str | None = None
    launch_source: str
    assistant_session_id: str | None = None
    galaxy_invocation_id: str | None = None
    status: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
