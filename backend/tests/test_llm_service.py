"""Unit tests for LLMService class."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from conftest import BORDERLINE_QUERIES, INVALID_QUERIES, VALID_QUERIES

from app.models.llm import DatasetQuery, LLMResponse
from app.services.llm_service import LLMService


class TestLLMService:
    """Test suite for LLMService functionality."""

    def test_is_available_when_models_initialized(self, mock_llm_service):
        """Test that service reports available when models are initialized."""
        mock_llm_service.reasoning_model = Mock()
        mock_llm_service.formatting_model = Mock()

        assert mock_llm_service.is_available() is True

    def test_is_not_available_when_models_not_initialized(self, mock_cache_service):
        """Test that service reports not available when models are None."""
        service = LLMService(mock_cache_service)
        service.reasoning_model = None
        service.formatting_model = None

        assert service.is_available() is False

    @pytest.mark.asyncio
    async def test_interpret_search_query_service_unavailable(self, mock_cache_service):
        """Test behavior when LLM service is not available."""
        service = LLMService(mock_cache_service)
        service.reasoning_model = None
        service.formatting_model = None

        result = await service.interpret_search_query("test query")

        assert result.success is False
        assert "not available" in result.error
        assert "API key" in result.error

    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached_result(
        self, mock_llm_service, mock_cache_service, valid_dataset_query
    ):
        """Test that cached results are returned when available."""
        # Setup cache hit
        cached_data = {
            "data": valid_dataset_query.model_dump(),
            "raw_response": "cached response",
            "tokens_used": 100,
            "model_used": "test-model",
        }
        mock_cache_service.get.return_value = cached_data

        result = await mock_llm_service.interpret_search_query("E. coli RNA-seq")

        assert result.success is True
        assert result.data.organism == "Escherichia coli"
        assert result.tokens_used == 100
        mock_cache_service.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalid_query_detection(self, mock_llm_service, mock_cache_service):
        """Test that invalid queries are properly detected and rejected."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent to return INVALID_QUERY marker
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "INVALID_QUERY: This query does not appear to be a valid bioinformatics search request."
        mock_reasoning_result.usage.return_value.total_tokens = 50

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(return_value=mock_reasoning_result)

            result = await mock_llm_service.interpret_search_query("sdfsdfs")

            assert result.success is False
            assert "Invalid query" in result.error
            assert result.data.confidence == 0.0

    @pytest.mark.asyncio
    async def test_valid_query_processing(self, mock_llm_service, mock_cache_service):
        """Test that valid queries are processed correctly."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent response
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = (
            "Analysis: This is a valid query for E. coli RNA-seq data."
        )
        mock_reasoning_result.usage.return_value.total_tokens = 100

        # Mock formatting agent response
        mock_formatting_result = Mock()
        mock_formatting_result.output = """{
            "organism": "Escherichia coli",
            "taxonomy_id": "562",
            "experiment_type": "RNA-seq",
            "library_strategy": "RNA-Seq",
            "library_source": null,
            "sequencing_platform": "Illumina",
            "date_range": null,
            "keywords": ["E. coli", "RNA-seq"],
            "study_type": null,
            "assembly_level": null,
            "assembly_completeness": null,
            "confidence": 0.9
        }"""
        mock_formatting_result.usage.return_value.total_tokens = 50

        with patch("app.services.llm_service.Agent") as mock_agent:
            # Setup different return values for reasoning and formatting agents
            agent_instance = Mock()
            agent_instance.run = AsyncMock(
                side_effect=[mock_reasoning_result, mock_formatting_result]
            )
            mock_agent.return_value = agent_instance

            result = await mock_llm_service.interpret_search_query(
                "E. coli RNA-seq data"
            )

            assert result.success is True
            assert result.data.organism == "Escherichia coli"
            assert result.data.confidence == 0.9
            assert result.tokens_used == 150

    @pytest.mark.asyncio
    async def test_json_parsing_error_handling(
        self, mock_llm_service, mock_cache_service
    ):
        """Test handling of invalid JSON from formatting agent."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent response
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "Analysis: Valid query."

        # Mock formatting agent with invalid JSON
        mock_formatting_result = Mock()
        mock_formatting_result.output = "invalid json response"

        with patch("app.services.llm_service.Agent") as mock_agent:
            agent_instance = Mock()
            agent_instance.run = AsyncMock(
                side_effect=[mock_reasoning_result, mock_formatting_result]
            )
            mock_agent.return_value = agent_instance

            result = await mock_llm_service.interpret_search_query("test query")

            assert result.success is False
            assert "Failed to parse" in result.error

    @pytest.mark.asyncio
    async def test_caching_of_successful_results(
        self, mock_llm_service, mock_cache_service
    ):
        """Test that successful results are properly cached."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock successful processing
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "Valid analysis"
        mock_reasoning_result.usage.return_value.total_tokens = 100

        mock_formatting_result = Mock()
        mock_formatting_result.output = """{
            "organism": "Escherichia coli",
            "taxonomy_id": "562",
            "experiment_type": "RNA-seq",
            "library_strategy": "RNA-Seq",
            "library_source": null,
            "sequencing_platform": null,
            "date_range": null,
            "keywords": [],
            "study_type": null,
            "assembly_level": null,
            "assembly_completeness": null,
            "confidence": 0.9
        }"""
        mock_formatting_result.usage.return_value.total_tokens = 50

        with patch("app.services.llm_service.Agent") as mock_agent:
            agent_instance = Mock()
            agent_instance.run = AsyncMock(
                side_effect=[mock_reasoning_result, mock_formatting_result]
            )
            mock_agent.return_value = agent_instance

            result = await mock_llm_service.interpret_search_query("test query")

            assert result.success is True
            # Verify that set was called to cache the result
            mock_cache_service.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_markdown_cleanup_in_json_response(
        self, mock_llm_service, mock_cache_service
    ):
        """Test that markdown formatting is properly cleaned from JSON responses."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent response
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "Valid analysis"

        # Mock formatting agent with markdown-wrapped JSON
        mock_formatting_result = Mock()
        mock_formatting_result.output = """```json
        {
            "organism": "Escherichia coli",
            "taxonomy_id": "562",
            "experiment_type": null,
            "library_strategy": null,
            "library_source": null,
            "sequencing_platform": null,
            "date_range": null,
            "keywords": [],
            "study_type": null,
            "assembly_level": null,
            "assembly_completeness": null,
            "confidence": 0.8
        }
        ```"""
        mock_formatting_result.usage.return_value.total_tokens = 50

        with patch("app.services.llm_service.Agent") as mock_agent:
            agent_instance = Mock()
            agent_instance.run = AsyncMock(
                side_effect=[mock_reasoning_result, mock_formatting_result]
            )
            mock_agent.return_value = agent_instance

            result = await mock_llm_service.interpret_search_query("test query")

            assert result.success is True
            assert result.data.organism == "Escherichia coli"
            assert result.data.confidence == 0.8

    @pytest.mark.asyncio
    async def test_agent_run_error_handling(self, mock_llm_service, mock_cache_service):
        """Test handling of AgentRunError exceptions."""
        from pydantic_ai.exceptions import AgentRunError

        # Mock cache miss
        mock_cache_service.get.return_value = None

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(
                side_effect=AgentRunError("Test error")
            )

            result = await mock_llm_service.interpret_search_query("test query")

            assert result.success is False
            assert "LLM interpretation failed" in result.error

    @pytest.mark.asyncio
    async def test_unexpected_error_handling(
        self, mock_llm_service, mock_cache_service
    ):
        """Test handling of unexpected exceptions."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(
                side_effect=Exception("Unexpected error")
            )

            result = await mock_llm_service.interpret_search_query("test query")

            assert result.success is False
            assert "Unexpected error" in result.error


class TestQueryValidation:
    """Test suite for query validation logic."""

    @pytest.mark.parametrize("invalid_query", INVALID_QUERIES)
    async def test_invalid_queries_rejected(
        self, mock_llm_service, mock_cache_service, invalid_query
    ):
        """Test that various types of invalid queries are rejected."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent to detect invalid query
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = (
            f"INVALID_QUERY: {invalid_query} is not a valid bioinformatics query."
        )

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(return_value=mock_reasoning_result)

            result = await mock_llm_service.interpret_search_query(invalid_query)

            assert result.success is False
            assert "Invalid query" in result.error

    @pytest.mark.parametrize("valid_query", VALID_QUERIES)
    async def test_valid_queries_accepted(
        self, mock_llm_service, mock_cache_service, valid_query
    ):
        """Test that valid bioinformatics queries are accepted."""
        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent response (no INVALID_QUERY marker)
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = (
            f"Analysis: {valid_query} is a valid bioinformatics query."
        )
        mock_reasoning_result.usage.return_value.total_tokens = 100

        # Mock formatting agent response with high confidence
        mock_formatting_result = Mock()
        mock_formatting_result.output = """{
            "organism": "Test organism",
            "taxonomy_id": null,
            "experiment_type": "RNA-seq",
            "library_strategy": null,
            "library_source": null,
            "sequencing_platform": null,
            "date_range": null,
            "keywords": [],
            "study_type": null,
            "assembly_level": null,
            "assembly_completeness": null,
            "confidence": 0.9
        }"""
        mock_formatting_result.usage.return_value.total_tokens = 50

        with patch("app.services.llm_service.Agent") as mock_agent:
            agent_instance = Mock()
            agent_instance.run = AsyncMock(
                side_effect=[mock_reasoning_result, mock_formatting_result]
            )
            mock_agent.return_value = agent_instance

            result = await mock_llm_service.interpret_search_query(valid_query)

            assert result.success is True
            assert result.data.confidence >= 0.3
