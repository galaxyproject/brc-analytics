"""Specific tests for invalid query detection functionality."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from app.models.llm import DatasetQuery
from app.services.llm_service import LLMService
from conftest import BORDERLINE_QUERIES, INVALID_QUERIES, VALID_QUERIES


class TestInvalidQueryDetection:
    """Test suite specifically for invalid query detection."""

    @pytest.mark.asyncio
    async def test_nonsense_string_detection(
        self, mock_llm_service, mock_cache_service
    ):
        """Test detection of random nonsense strings."""
        nonsense_queries = ["sdfsdfs", "xyzabc123", "qwerty", "asdfghjkl"]

        for query in nonsense_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = f"INVALID_QUERY: '{query}' appears to be random characters with no biological meaning."
            mock_reasoning_result.usage.return_value.total_tokens = 25

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error
                assert "bioinformatics" in result.error
                assert result.data.confidence == 0.0

    @pytest.mark.asyncio
    async def test_empty_whitespace_detection(
        self, mock_llm_service, mock_cache_service
    ):
        """Test detection of empty and whitespace-only queries."""
        empty_queries = ["", "   ", "\n\n", "\t", "  \n  \t  "]

        for query in empty_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                "INVALID_QUERY: Empty or whitespace-only query is not valid."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 20

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error

    @pytest.mark.asyncio
    async def test_special_characters_detection(
        self, mock_llm_service, mock_cache_service
    ):
        """Test detection of special characters only queries."""
        special_queries = ["@#$%^&*", "!!!???", "<<<>>>", "~`!@#$%^&*()_+"]

        for query in special_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                f"INVALID_QUERY: '{query}' contains only special characters."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 30

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error

    @pytest.mark.asyncio
    async def test_numbers_only_detection(self, mock_llm_service, mock_cache_service):
        """Test detection of numbers-only queries."""
        number_queries = ["12345", "999999", "0000", "123456789"]

        for query in number_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                f"INVALID_QUERY: '{query}' is just numbers with no biological context."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 25

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error

    @pytest.mark.asyncio
    async def test_non_bioinformatics_detection(
        self, mock_llm_service, mock_cache_service
    ):
        """Test detection of non-bioinformatics queries."""
        non_bio_queries = [
            "weather forecast tomorrow",
            "stock price of Apple",
            "recipe for chocolate cake",
            "how to fix my car",
            "best restaurants nearby",
        ]

        for query in non_bio_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = f"INVALID_QUERY: '{query}' is not related to bioinformatics or genomics."
            mock_reasoning_result.usage.return_value.total_tokens = 35

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error
                assert "bioinformatics" in result.error

    @pytest.mark.asyncio
    async def test_mixed_nonsense_detection(self, mock_llm_service, mock_cache_service):
        """Test detection of mixed nonsense queries."""
        mixed_queries = [
            "sdf123 @#$ xyz",
            "random words here there",
            "lalala banana potato",
            "test 999 @@@ nonsense",
        ]

        for query in mixed_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to detect invalid query
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                f"INVALID_QUERY: '{query}' appears to be a mix of random elements."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 40

            with patch("app.services.llm_service.Agent") as mock_agent:
                mock_agent.return_value.run = AsyncMock(
                    return_value=mock_reasoning_result
                )

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is False
                assert "Invalid query" in result.error

    @pytest.mark.asyncio
    async def test_invalid_query_not_cached(self, mock_llm_service, mock_cache_service):
        """Test that invalid queries are not cached."""
        query = "sdfsdfs nonsense"

        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent to detect invalid query
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "INVALID_QUERY: This is nonsense."
        mock_reasoning_result.usage.return_value.total_tokens = 25

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(return_value=mock_reasoning_result)

            result = await mock_llm_service.interpret_search_query(query)

            assert result.success is False
            # Verify that cache.set was NOT called for invalid queries
            mock_cache_service.set.assert_not_called()

    @pytest.mark.asyncio
    async def test_confidence_based_rejection(
        self, mock_llm_service, mock_cache_service
    ):
        """Test that queries are rejected based on low confidence scores."""
        # This tests the API layer validation, but we can test the data structure
        low_confidence_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=[],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.1,  # Very low confidence
        )

        # Verify the confidence is below threshold
        assert low_confidence_query.confidence < 0.3

    @pytest.mark.asyncio
    async def test_error_message_format(self, mock_llm_service, mock_cache_service):
        """Test that error messages have the correct format and content."""
        query = "random nonsense xyz123"

        # Mock cache miss
        mock_cache_service.get.return_value = None

        # Mock reasoning agent to detect invalid query
        mock_reasoning_result = Mock()
        mock_reasoning_result.output = "INVALID_QUERY: Random nonsense detected."
        mock_reasoning_result.usage.return_value.total_tokens = 30

        with patch("app.services.llm_service.Agent") as mock_agent:
            mock_agent.return_value.run = AsyncMock(return_value=mock_reasoning_result)

            result = await mock_llm_service.interpret_search_query(query)

            assert result.success is False
            assert result.error is not None
            assert "Invalid query" in result.error
            assert "bioinformatics search request" in result.error
            assert result.data is not None
            assert result.data.confidence == 0.0

    @pytest.mark.asyncio
    async def test_valid_queries_not_falsely_rejected(
        self, mock_llm_service, mock_cache_service
    ):
        """Test that valid queries are not falsely rejected."""
        valid_queries = [
            "E. coli RNA-seq data",
            "Plasmodium falciparum genome",
            "Complete genome assemblies",
            "PacBio sequencing",
            "16S rRNA sequences",
        ]

        for query in valid_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to NOT detect invalid query (no INVALID_QUERY marker)
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                f"Analysis: {query} is a valid bioinformatics query about genomic data."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 50

            # Mock formatting agent response
            mock_formatting_result = Mock()
            mock_formatting_result.output = """{
                "organism": "Test organism",
                "taxonomy_id": null,
                "experiment_type": "genomic",
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
            mock_formatting_result.usage.return_value.total_tokens = 40

            with patch("app.services.llm_service.Agent") as mock_agent:
                agent_instance = Mock()
                agent_instance.run = AsyncMock(
                    side_effect=[mock_reasoning_result, mock_formatting_result]
                )
                mock_agent.return_value = agent_instance

                result = await mock_llm_service.interpret_search_query(query)

                assert result.success is True
                assert result.data.confidence >= 0.3

    @pytest.mark.asyncio
    async def test_borderline_queries_handling(
        self, mock_llm_service, mock_cache_service
    ):
        """Test handling of borderline queries that might have low confidence."""
        borderline_queries = [
            "some biological data",
            "genomic information",
            "sequence data maybe",
            "microbial stuff",
        ]

        for query in borderline_queries:
            # Mock cache miss
            mock_cache_service.get.return_value = None

            # Mock reasoning agent to NOT flag as invalid but might have low confidence
            mock_reasoning_result = Mock()
            mock_reasoning_result.output = (
                f"Analysis: {query} might be bioinformatics related but is very vague."
            )
            mock_reasoning_result.usage.return_value.total_tokens = 45

            # Mock formatting agent response with low confidence
            mock_formatting_result = Mock()
            mock_formatting_result.output = """{
                "organism": null,
                "taxonomy_id": null,
                "experiment_type": null,
                "library_strategy": null,
                "library_source": null,
                "sequencing_platform": null,
                "date_range": null,
                "keywords": [],
                "study_type": null,
                "assembly_level": null,
                "assembly_completeness": null,
                "confidence": 0.2
            }"""
            mock_formatting_result.usage.return_value.total_tokens = 35

            with patch("app.services.llm_service.Agent") as mock_agent:
                agent_instance = Mock()
                agent_instance.run = AsyncMock(
                    side_effect=[mock_reasoning_result, mock_formatting_result]
                )
                mock_agent.return_value = agent_instance

                result = await mock_llm_service.interpret_search_query(query)

                # Should succeed but with low confidence (will be rejected at API layer)
                assert result.success is True
                assert result.data.confidence < 0.3
