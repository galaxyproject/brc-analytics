"""Pytest configuration and fixtures for backend tests."""

import asyncio
import os
import sys
from unittest.mock import AsyncMock, Mock

import pytest

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.cache import CacheService


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
