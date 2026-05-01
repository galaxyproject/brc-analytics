"""Tests for the in-memory eval cache."""

import pytest

from evals.tasks import _InMemoryCache


@pytest.mark.asyncio
async def test_cache_persists_within_run():
    cache = _InMemoryCache()
    await cache.set("k", {"v": 1})
    assert await cache.get("k") == {"v": 1}


@pytest.mark.asyncio
async def test_cache_get_missing_returns_none():
    cache = _InMemoryCache()
    assert await cache.get("missing") is None


@pytest.mark.asyncio
async def test_cache_delete():
    cache = _InMemoryCache()
    await cache.set("k", "v")
    assert await cache.delete("k") is True
    assert await cache.get("k") is None
    assert await cache.delete("k") is False


def test_make_key_is_deterministic():
    cache = _InMemoryCache()
    a = cache.make_key("p", {"x": 1, "y": 2})
    b = cache.make_key("p", {"y": 2, "x": 1})
    assert a == b
    assert a.startswith("p:")


@pytest.mark.asyncio
async def test_with_fresh_cache_isolates_runs():
    """Cross-model isolation: with_fresh_cache() must hand back a deps with an
    empty cache so LLMService's content-keyed entries can't leak between
    (dataset, model) runs. Settings/catalog should be reused."""
    from evals.tasks import EvalDeps, _InMemoryCache

    cache = _InMemoryCache()
    await cache.set("llm:interpret:abc", {"taxonomy_id": "4932"})

    settings = object()
    catalog = object()
    deps = EvalDeps(settings=settings, cache=cache, catalog=catalog)  # type: ignore[arg-type]
    fresh = deps.with_fresh_cache()

    assert fresh.settings is settings
    assert fresh.catalog is catalog
    assert fresh.cache is not deps.cache
    assert await fresh.cache.get("llm:interpret:abc") is None
