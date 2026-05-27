from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.assistant import AnalysisSchema, ChatMessage


class UserPreferences(BaseModel):
    model_config = ConfigDict(extra="allow")


class UserMeResponse(BaseModel):
    email: str | None = None
    email_verified: bool | None = None
    family_name: str | None = None
    given_name: str | None = None
    name: str | None = None
    preferred_username: str | None = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    realm_roles: list[str] = Field(default_factory=list)
    sub: str


class FavoritePayload(BaseModel):
    entity_id: str = Field(min_length=1, max_length=255)
    entity_type: str = Field(min_length=1, max_length=64)


class FavoriteResponse(FavoritePayload):
    created_at: datetime


class SaveAnalysisRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=255)
    title: str | None = Field(default=None, max_length=255)


class SavedAnalysisSummary(BaseModel):
    created_at: datetime
    id: str
    source_session: str | None = None
    title: str | None = None
    updated_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_id_to_str(cls, value):
        return str(value)


class SavedAnalysisDetail(SavedAnalysisSummary):
    messages: list[ChatMessage]
    schema_state: AnalysisSchema = Field(alias="schema")

    model_config = ConfigDict(populate_by_name=True)


class SavedAnalysisRestoreResponse(BaseModel):
    session_id: str
