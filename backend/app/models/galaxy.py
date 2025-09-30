"""Galaxy API integration models."""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class GalaxyJobState(str, Enum):
    """Galaxy job states as defined in the API."""
    NEW = "new"
    UPLOAD = "upload"
    WAITING = "waiting"
    QUEUED = "queued"
    RUNNING = "running"
    OK = "ok"
    ERROR = "error"
    PAUSED = "paused"
    DELETED = "deleted"
    DELETED_NEW = "deleted_new"


class GalaxyJobSubmission(BaseModel):
    """Request model for submitting a job to Galaxy."""
    tabular_data: str = Field(..., description="Tabular data content (TSV format)")
    num_random_lines: int = Field(default=10, ge=1, le=1000, description="Number of random lines to select")
    filename: Optional[str] = Field(default="input_data", description="Name for the uploaded file")


class GalaxyJobResponse(BaseModel):
    """Response model for job submission."""
    job_id: str = Field(..., description="Galaxy job ID for tracking")
    upload_dataset_id: str = Field(..., description="ID of the uploaded dataset")
    status: str = Field(default="submitted", description="Initial job status")
    message: str = Field(default="Job submitted successfully")


class GalaxyDataset(BaseModel):
    """Model for Galaxy dataset information."""
    id: str
    name: str
    state: str
    file_ext: str
    file_size: Optional[int] = None
    created_time: Optional[str] = None
    updated_time: Optional[str] = None


class GalaxyJobOutput(BaseModel):
    """Model for Galaxy job output information."""
    id: str
    name: str
    dataset: GalaxyDataset


class GalaxyJobDetails(BaseModel):
    """Detailed information about a Galaxy job."""
    id: str
    tool_id: str
    state: GalaxyJobState
    created_time: str
    updated_time: str
    outputs: List[GalaxyJobOutput] = []
    inputs: Dict[str, Any] = {}
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None


class GalaxyJobStatus(BaseModel):
    """Status response for a Galaxy job."""
    job_id: str
    state: GalaxyJobState
    created_time: str
    updated_time: str
    is_complete: bool = Field(default=False, description="Whether the job has finished (success or failure)")
    is_successful: bool = Field(default=False, description="Whether the job completed successfully")
    outputs: List[GalaxyJobOutput] = []
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None


class GalaxyJobResult(BaseModel):
    """Final results from a completed Galaxy job."""
    job_id: str
    status: GalaxyJobState
    outputs: List[GalaxyJobOutput]
    results: Dict[str, str] = Field(default_factory=dict, description="Output dataset contents")
    processing_time: Optional[str] = None
    created_time: str
    completed_time: Optional[str] = None


class GalaxyAPIError(BaseModel):
    """Model for Galaxy API errors."""
    error: str
    message: str
    status_code: int
    job_id: Optional[str] = None


# Internal Galaxy API request/response models (for service layer)

class GalaxyUploadRequest(BaseModel):
    """Internal model for Galaxy upload tool request."""
    tool_id: str
    history_id: str
    inputs: Dict[str, Any]


class GalaxyToolRequest(BaseModel):
    """Internal model for Galaxy tool execution request."""
    tool_id: str
    history_id: str
    inputs: Dict[str, Any]


class GalaxyAPIResponse(BaseModel):
    """Generic Galaxy API response wrapper."""
    success: bool = True
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: int = 200