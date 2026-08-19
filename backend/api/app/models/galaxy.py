"""Galaxy API integration models."""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


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
    num_random_lines: int = Field(
        default=10, ge=1, le=1000, description="Number of random lines to select"
    )
    filename: Optional[str] = Field(
        default="input_data", description="Name for the uploaded file"
    )


MAX_QUERY_BASES = 2500

# kmindex_query's index select is multiple="true", so one job can search any
# combination of the ~109 registered indexes and write a JSON per shard for each.
# The ceiling is ours, not the tool's: a single index already fans out to dozens
# of shard datasets (GENOMIC_BCT alone is 55), and we download every one of them
# through a service account Galaxy rate-limits. Raise this once the aggregation
# path stops pulling shards one dataset at a time.
MAX_INDEXES = 8


class KmindexQuerySubmission(BaseModel):
    """Request model for a Logan/kmindex sequence search."""

    # max_length is a cheap guard on the raw payload so a multi-megabyte body
    # is rejected before it is parsed; single_record/max_bases below enforce
    # the real limit on base count.
    sequence: str = Field(
        ...,
        max_length=MAX_QUERY_BASES * 4,
        description="Query sequence in FASTA format",
    )
    indexes: List[str] = Field(
        ...,
        min_length=1,
        description=(
            "kmindex index names to search in one job, e.g. "
            "['METAGENOMIC_ENV', 'GENOMIC_BCT']"
        ),
    )
    # kmindex indexes s-mers and queries (s+z)-mers; z=6 is the tool default and
    # matches a standard k-mer query.
    zvalue: int = Field(default=6, ge=0, le=16, description="Z-value")
    threshold: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Minimum proportion of shared k-mers"
    )
    filename: Optional[str] = Field(
        default="query", description="Name for the uploaded query file"
    )

    @field_validator("indexes")
    @classmethod
    def distinct_and_bounded(cls, value: List[str]) -> List[str]:
        """
        Drop blanks, de-duplicate, and cap how many indexes one job may search.

        Duplicates matter beyond tidiness: kmindex keys its output JSON by shard,
        so the same index twice would merge its hits into the ranked list twice.
        """
        seen: List[str] = []
        for name in value:
            cleaned = name.strip()
            if cleaned and cleaned not in seen:
                seen.append(cleaned)

        if not seen:
            raise ValueError("Select at least one index")
        if len(seen) > MAX_INDEXES:
            raise ValueError(
                f"Selected {len(seen)} indexes; at most {MAX_INDEXES} per query"
            )
        return seen

    @field_validator("sequence")
    @classmethod
    def single_record(cls, value: str) -> str:
        """
        Reject multi-record FASTA.

        kmindex reports hits per query record, but the merged view collapses
        them into one ranked list -- so a two-record query silently returns
        both sets of accessions under the first record's name. Until the
        aggregate is keyed by query, one record per submission.
        """
        if sum(1 for line in value.splitlines() if line.startswith(">")) > 1:
            raise ValueError(
                "Submit one sequence per query; multi-record FASTA is not supported"
            )
        return value

    @field_validator("sequence")
    @classmethod
    def within_base_limit(cls, value: str) -> str:
        """
        Cap the query at MAX_QUERY_BASES actual bases.

        The UI enforces the same ceiling, but the UI is not the only caller --
        without this the limit is advisory and a direct API request can hand
        an arbitrarily long query to a 96-core node.
        """
        bases = sum(
            len(line.strip()) for line in value.splitlines() if not line.startswith(">")
        )
        if bases > MAX_QUERY_BASES:
            raise ValueError(f"Query is {bases} bases; the limit is {MAX_QUERY_BASES}")
        return value


class SraRunMetadata(BaseModel):
    """Run metadata from the local SRA mirror, joined onto a search hit."""

    assay_type: Optional[str] = None
    bioproject: Optional[str] = None
    country: Optional[str] = None
    instrument: Optional[str] = None
    library_layout: Optional[str] = None
    mbases: Optional[int] = None
    organism: Optional[str] = None
    platform: Optional[str] = None
    release_date: Optional[str] = None
    study: Optional[str] = None


class KmindexHit(BaseModel):
    """A single SRA accession matched by a kmindex query."""

    accession: str = Field(..., description="SRA run accession, e.g. SRR13392923")
    score: float = Field(..., description="Fraction of query k-mers shared, 0.0-1.0")
    shard: str = Field(..., description="Index shard the hit came from")
    sra: Optional[SraRunMetadata] = Field(
        default=None,
        description="Mirror metadata, absent when the accession isn't mirrored",
    )


class KmindexResults(BaseModel):
    """Hits from a kmindex query, merged across every index shard."""

    job_id: str
    query_name: Optional[str] = None
    total_hits: int = Field(..., description="Hits across all shards before paging")
    shards_searched: int
    shards_with_hits: int
    shards_failed: int = Field(
        default=0,
        description="Shards whose output could not be fetched; >0 means the "
        "hit list is incomplete",
    )
    truncated: bool = Field(
        default=False,
        description="True when the merged hit list hit the aggregation cap",
    )
    limit: int
    offset: int
    sra_mirror_available: bool = Field(
        default=False, description="Whether the SRA mirror was queryable"
    )
    sra_annotated: int = Field(
        default=0, description="Hits on this page found in the SRA mirror"
    )
    hits: List[KmindexHit] = []


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
    is_complete: bool = Field(
        default=False, description="Whether the job has finished (success or failure)"
    )
    is_successful: bool = Field(
        default=False, description="Whether the job completed successfully"
    )
    outputs: List[GalaxyJobOutput] = []
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None


class GalaxyJobResult(BaseModel):
    """Final results from a completed Galaxy job."""

    job_id: str
    status: GalaxyJobState
    outputs: List[GalaxyJobOutput]
    results: Dict[str, str] = Field(
        default_factory=dict, description="Output dataset contents"
    )
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
