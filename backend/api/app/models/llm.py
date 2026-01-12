from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DatasetQuery(BaseModel):
    """Structured representation of a natural language dataset search query"""

    organism: Optional[str] = Field(None, description="Scientific name of the organism")
    taxonomy_id: Optional[str] = Field(None, description="NCBI taxonomy ID")
    experiment_type: Optional[str] = Field(
        None,
        description="Type of sequencing experiment (RNA-seq, DNA-seq, ChIP-seq, etc.)",
    )
    library_strategy: Optional[str] = Field(
        None, description="Library preparation strategy"
    )
    library_source: Optional[str] = Field(
        None, description="Library source (GENOMIC, TRANSCRIPTOMIC, etc.)"
    )
    sequencing_platform: Optional[str] = Field(
        None,
        description="Sequencing platform/technology (Illumina, PacBio, Oxford Nanopore, etc.)",
    )
    date_range: Optional[Dict[str, str]] = Field(
        None, description="Date range for submission/publication"
    )
    keywords: List[str] = Field(
        default_factory=list, description="Additional search keywords"
    )
    study_type: Optional[str] = Field(
        None, description="Type of study or research focus"
    )
    assembly_level: Optional[str] = Field(
        None,
        description="Assembly level (Complete Genome, Chromosome, Scaffold, Contig)",
    )
    assembly_completeness: Optional[str] = Field(
        None, description="Assembly completeness level"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score of the interpretation",
    )


class WorkflowRecommendation(BaseModel):
    """Workflow recommendation from LLM analysis"""

    workflow_id: str = Field(..., description="Identifier of the recommended workflow")
    workflow_name: str = Field(..., description="Human-readable name of the workflow")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score for this recommendation"
    )
    reasoning: str = Field(
        ..., description="Explanation of why this workflow was recommended"
    )
    parameters: Optional[Dict[str, Any]] = Field(
        None, description="Suggested parameter values"
    )
    compatibility_notes: Optional[str] = Field(
        None, description="Notes about dataset compatibility"
    )


class WorkflowSuggestionRequest(BaseModel):
    """Request for workflow recommendation"""

    dataset_description: str = Field(..., description="Description of the dataset")
    analysis_goal: str = Field(..., description="What the user wants to analyze")
    organism_taxonomy_id: Optional[str] = Field(
        None, description="NCBI taxonomy ID of the organism"
    )
    experiment_type: Optional[str] = Field(
        None, description="Type of sequencing experiment"
    )
    data_format: Optional[str] = Field(None, description="Format of the input data")


class LLMResponse(BaseModel):
    """Generic LLM response wrapper"""

    success: bool = Field(..., description="Whether the LLM call was successful")
    data: Optional[Any] = Field(None, description="The structured response data")
    raw_response: Optional[str] = Field(None, description="Raw text response from LLM")
    tokens_used: Optional[int] = Field(None, description="Number of tokens consumed")
    model_used: Optional[str] = Field(None, description="Which model was used")
    cached: bool = Field(
        default=False, description="Whether this response came from cache"
    )
    error: Optional[str] = Field(None, description="Error message if unsuccessful")
