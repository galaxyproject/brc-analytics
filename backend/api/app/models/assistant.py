from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FieldStatus(str, Enum):
    """Status of a field in the analysis schema."""

    EMPTY = "empty"
    FILLED = "filled"
    NEEDS_ATTENTION = "needs_attention"


class SchemaField(BaseModel):
    """A single field in the analysis schema with its status."""

    value: Optional[str] = None
    status: FieldStatus = FieldStatus.EMPTY
    detail: Optional[str] = Field(
        None, description="Extra context, e.g. accession or reason for attention"
    )


class AnalysisSchema(BaseModel):
    """Tracks the user's analysis configuration as it's built up in conversation."""

    organism: SchemaField = Field(default_factory=SchemaField)
    assembly: SchemaField = Field(default_factory=SchemaField)
    analysis_type: SchemaField = Field(default_factory=SchemaField)
    workflow: SchemaField = Field(default_factory=SchemaField)
    data_source: SchemaField = Field(default_factory=SchemaField)
    data_characteristics: SchemaField = Field(default_factory=SchemaField)
    gene_annotation: SchemaField = Field(default_factory=SchemaField)

    def filled_count(self) -> int:
        return sum(
            1
            for f in [
                self.organism,
                self.assembly,
                self.analysis_type,
                self.workflow,
                self.data_source,
                self.data_characteristics,
                self.gene_annotation,
            ]
            if f.status == FieldStatus.FILLED
        )

    def is_complete(self) -> bool:
        """All required fields filled (gene_annotation may be optional depending on workflow)."""
        required = [
            self.organism,
            self.assembly,
            self.analysis_type,
            self.workflow,
            self.data_source,
            self.data_characteristics,
        ]
        return all(f.status == FieldStatus.FILLED for f in required)


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """A single message in the conversation, as exposed to the frontend."""

    role: MessageRole
    content: str


class SuggestionChip(BaseModel):
    """A quick-tap option shown below the chat input."""

    label: str
    message: str = Field(description="The message sent when the chip is tapped")


class ChatRequest(BaseModel):
    """Request body for POST /api/v1/assistant/chat."""

    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = Field(
        None, description="Existing session to continue; omit to start fresh"
    )


class ChatResponse(BaseModel):
    """Response from the assistant chat endpoint."""

    session_id: str
    reply: str
    schema_state: AnalysisSchema
    suggestions: List[SuggestionChip] = Field(default_factory=list)
    is_complete: bool = Field(
        False, description="True when the analysis config is ready for handoff"
    )
    handoff_url: Optional[str] = Field(
        None,
        description="URL to the workflow stepper, set when is_complete is True",
    )


class SessionState(BaseModel):
    """The full state stored in Redis for one assistant session."""

    session_id: str
    schema_state: AnalysisSchema = Field(default_factory=AnalysisSchema)
    messages: List[ChatMessage] = Field(default_factory=list)
    # Raw pydantic-ai message history, serialised as JSON-safe dicts
    agent_message_history: List[Dict[str, Any]] = Field(default_factory=list)
    # Metadata accumulated during conversation (taxonomy_id, accession, etc.)
    metadata: Dict[str, Any] = Field(default_factory=dict)
