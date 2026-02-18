"""Tests for AssistantAgent parsing and schema update logic."""

from unittest.mock import MagicMock

import pytest

from app.models.assistant import (
    AnalysisSchema,
    FieldStatus,
    SchemaField,
    SuggestionChip,
)
from app.services.assistant_agent import AssistantAgent


@pytest.fixture()
def agent():
    """Build a minimal AssistantAgent without Redis/LLM by stubbing __init__."""
    instance = object.__new__(AssistantAgent)
    instance.catalog = MagicMock()
    instance.catalog.workflows_by_category = []
    return instance


# ---------- _parse_structured_output ----------


class TestParseStructuredOutput:
    def test_plain_text_unchanged(self, agent):
        text, suggestions, updates = agent._parse_structured_output(
            "Hello, how can I help?"
        )
        assert text == "Hello, how can I help?"
        assert suggestions == []
        assert updates == {}

    def test_suggestions_extracted(self, agent):
        raw = 'Here are some options.\nSUGGESTIONS: ["Option A", "Option B"]'
        text, suggestions, updates = agent._parse_structured_output(raw)
        assert text == "Here are some options."
        assert len(suggestions) == 2
        assert suggestions[0].label == "Option A"
        assert suggestions[1].message == "Option B"

    def test_schema_update_extracted(self, agent):
        raw = (
            "Got it, using yeast.\n"
            'SCHEMA_UPDATE: {"organism": "Saccharomyces cerevisiae"}'
        )
        text, _, updates = agent._parse_structured_output(raw)
        assert text == "Got it, using yeast."
        assert updates == {"organism": "Saccharomyces cerevisiae"}

    def test_both_suggestions_and_schema(self, agent):
        raw = (
            "Selected assembly.\n"
            'SCHEMA_UPDATE: {"assembly": "GCF_000146045.2"}\n'
            'SUGGESTIONS: ["Check compatibility", "Next step"]'
        )
        text, suggestions, updates = agent._parse_structured_output(raw)
        assert text == "Selected assembly."
        assert len(suggestions) == 2
        assert "assembly" in updates

    def test_markdown_bold_prefix(self, agent):
        raw = '**SUGGESTIONS:** ["A", "B"]'
        _, suggestions, _ = agent._parse_structured_output(raw)
        assert len(suggestions) == 2

    def test_markdown_bold_colon_outside(self, agent):
        raw = '**SUGGESTIONS**: ["A", "B"]'
        _, suggestions, _ = agent._parse_structured_output(raw)
        assert len(suggestions) == 2

    def test_case_insensitive(self, agent):
        raw = 'suggestions: ["lower case"]'
        _, suggestions, _ = agent._parse_structured_output(raw)
        assert len(suggestions) == 1
        assert suggestions[0].label == "lower case"

    def test_leading_whitespace(self, agent):
        raw = '  SUGGESTIONS: ["indented"]'
        _, suggestions, _ = agent._parse_structured_output(raw)
        assert len(suggestions) == 1

    def test_malformed_json_kept_as_text(self, agent):
        raw = "SUGGESTIONS: not valid json"
        text, suggestions, _ = agent._parse_structured_output(raw)
        assert suggestions == []
        assert "not valid json" in text

    def test_malformed_schema_kept_as_text(self, agent):
        raw = "SCHEMA_UPDATE: {broken"
        text, _, updates = agent._parse_structured_output(raw)
        assert updates == {}
        assert "{broken" in text

    def test_multiline_body_preserved(self, agent):
        raw = 'Line 1\nLine 2\nLine 3\nSUGGESTIONS: ["Next"]'
        text, suggestions, _ = agent._parse_structured_output(raw)
        assert text == "Line 1\nLine 2\nLine 3"
        assert len(suggestions) == 1

    def test_empty_input(self, agent):
        text, suggestions, updates = agent._parse_structured_output("")
        assert text == ""
        assert suggestions == []
        assert updates == {}

    def test_schema_update_bold_markdown(self, agent):
        raw = '**SCHEMA_UPDATE:** {"organism": "E. coli"}'
        _, _, updates = agent._parse_structured_output(raw)
        assert updates == {"organism": "E. coli"}


# ---------- _apply_schema_updates ----------


class TestApplySchemaUpdates:
    def test_empty_updates_returns_same(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(schema, {})
        assert result is schema  # same object, not a copy

    def test_sets_organism(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema, {"organism": "Plasmodium falciparum"}
        )
        assert result.organism.value == "Plasmodium falciparum"
        assert result.organism.status == FieldStatus.FILLED

    def test_original_unchanged(self, agent):
        schema = AnalysisSchema()
        agent._apply_schema_updates(schema, {"organism": "Test"})
        assert schema.organism.status == FieldStatus.EMPTY

    def test_assembly_accession_extracted(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema,
            {"assembly": "Reference genome GCF_000146045.2 (S. cerevisiae)"},
        )
        assert result.assembly.status == FieldStatus.FILLED
        assert result.assembly.detail == "GCF_000146045.2"

    def test_assembly_gca_accession_extracted(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema,
            {"assembly": "Assembly GCA_000001405.29"},
        )
        assert result.assembly.detail == "GCA_000001405.29"

    def test_assembly_no_accession(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema, {"assembly": "Some assembly without accession"}
        )
        assert result.assembly.status == FieldStatus.FILLED
        assert result.assembly.detail is None

    def test_invalid_field_name_ignored(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema, {"bogus_field": "value", "organism": "Test"}
        )
        assert result.organism.value == "Test"
        assert not hasattr(result, "bogus_field")

    def test_empty_value_ignored(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(schema, {"organism": ""})
        assert result.organism.status == FieldStatus.EMPTY

    def test_multiple_fields_set(self, agent):
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema,
            {
                "organism": "Yeast",
                "analysis_type": "Transcriptomics",
                "data_source": "ENA",
            },
        )
        assert result.organism.value == "Yeast"
        assert result.analysis_type.value == "Transcriptomics"
        assert result.data_source.value == "ENA"

    def test_workflow_trs_id_lookup(self, agent):
        agent.catalog.workflows_by_category = [
            {
                "category": "TRANSCRIPTOMICS",
                "workflows": [
                    {
                        "iwcId": "rnaseq-pe",
                        "trsId": "#workflow/github.com/iwc/rnaseq-pe/main",
                    }
                ],
            }
        ]
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema, {"workflow": "RNA-Seq PE (rnaseq-pe)"}
        )
        assert result.workflow.status == FieldStatus.FILLED
        assert result.workflow.detail == "#workflow/github.com/iwc/rnaseq-pe/main"

    def test_workflow_no_match(self, agent):
        agent.catalog.workflows_by_category = [
            {
                "category": "TRANSCRIPTOMICS",
                "workflows": [{"iwcId": "rnaseq-pe", "trsId": "trs-123"}],
            }
        ]
        schema = AnalysisSchema()
        result = agent._apply_schema_updates(
            schema, {"workflow": "some-other-workflow"}
        )
        assert result.workflow.status == FieldStatus.FILLED
        assert result.workflow.detail is None

    def test_preserves_existing_fields(self, agent):
        schema = AnalysisSchema(
            organism=SchemaField(value="Existing", status=FieldStatus.FILLED)
        )
        result = agent._apply_schema_updates(schema, {"assembly": "GCF_000146045.2"})
        assert result.organism.value == "Existing"
        assert result.assembly.detail == "GCF_000146045.2"
