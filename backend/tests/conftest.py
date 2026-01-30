"""Pytest configuration and fixtures for backend tests."""

import asyncio
import os
import sys
from unittest.mock import AsyncMock, Mock

import pytest

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.cache import CacheService
from app.models.llm import DatasetQuery
from app.services.llm_service import LLMService


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_cache_service():
    """Create a mock cache service for testing."""
    cache = Mock(spec=CacheService)
    cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock(return_value=True)
    cache.delete = AsyncMock(return_value=True)
    cache.make_key = Mock(side_effect=lambda prefix, params: f"{prefix}:mock_key")
    return cache


@pytest.fixture
def mock_llm_service(mock_cache_service):
    """Create a mock LLM service for testing."""
    service = LLMService(mock_cache_service)

    # Mock the availability check
    service.is_available = Mock(return_value=True)

    # Mock the agents since they're None without an API key
    # These need proper async mock setup - tests will configure .run() as needed
    service.reasoning_agent = Mock()
    service.reasoning_agent.run = AsyncMock()
    service.formatting_agent = Mock()
    service.formatting_agent.run = AsyncMock()

    return service


@pytest.fixture
def valid_dataset_query():
    """Create a valid DatasetQuery instance for testing."""
    return DatasetQuery(
        organism="Escherichia coli",
        taxonomy_id="562",
        experiment_type="RNA-seq",
        library_strategy="RNA-Seq",
        library_source="TRANSCRIPTOMIC",
        sequencing_platform="Illumina",
        date_range={"start": "2023-01-01", "end": "2023-12-31"},
        keywords=["E. coli", "RNA-seq"],
        study_type=None,
        assembly_level=None,
        assembly_completeness=None,
        confidence=0.9,
    )


@pytest.fixture
def invalid_dataset_query():
    """Create an invalid DatasetQuery instance for testing."""
    return DatasetQuery(
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
        confidence=0.0,
    )


@pytest.fixture
def low_confidence_dataset_query():
    """Create a low confidence DatasetQuery instance for testing."""
    return DatasetQuery(
        organism="Escherichia coli",
        taxonomy_id="562",
        experiment_type=None,
        library_strategy=None,
        library_source=None,
        sequencing_platform=None,
        date_range=None,
        keywords=["coli"],
        study_type=None,
        assembly_level=None,
        assembly_completeness=None,
        confidence=0.2,  # Below threshold
    )


# Test data constants
# Note: empty strings ("", "   ") are handled separately as they fail input validation
# before reaching the LLM with "Query cannot be empty"
INVALID_QUERIES = [
    "sdfsdfs",
    "xyzabc123",
    "@#$%^&*",
    "12345",
    "weather forecast",
    "stock prices",
    "random nonsense gibberish",
]

VALID_QUERIES = [
    "E. coli RNA-seq data",
    "Plasmodium falciparum genome",
    "PacBio sequencing from 2023",
    "Complete genome assemblies",
    "Drug-resistant tuberculosis strains",
    "Candida albicans genomic DNA",
    "16S rRNA sequences",
    "SARS-CoV-2 complete genome",
]

BORDERLINE_QUERIES = [
    "some biological data",
    "genomic information",
    "sequence data maybe",
    "microbial stuff",
]
