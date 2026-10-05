"""The boot-time warm of the kmindex index list.

Without it the first visitor after a restart is the one who waits on Galaxy for
the index picker, and the one who sees it fail if Galaxy is rate-limiting us
right then.
"""

import asyncio
import logging
import threading
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app import main


def _galaxy(available=True, **kwargs):
    galaxy = MagicMock()
    galaxy.is_available.return_value = available
    galaxy.list_kmindex_indexes = AsyncMock(**kwargs)
    return galaxy


@pytest.mark.asyncio
async def test_the_warm_fills_the_list_before_a_reader_arrives(monkeypatch, caplog):
    galaxy = _galaxy(return_value=["A", "B"])
    monkeypatch.setattr(main, "get_service_galaxy", MagicMock(return_value=galaxy))

    with caplog.at_level(logging.INFO):
        await main.warm_kmindex_indexes()

    galaxy.list_kmindex_indexes.assert_awaited_once()
    assert "2 indexes" in caplog.text


@pytest.mark.asyncio
async def test_a_galaxy_that_will_not_answer_does_not_fail_the_boot(
    monkeypatch, caplog
):
    galaxy = _galaxy(side_effect=Exception("Unexpected HTTP status code: 429"))
    monkeypatch.setattr(main, "get_service_galaxy", MagicMock(return_value=galaxy))

    with caplog.at_level(logging.WARNING):
        await main.warm_kmindex_indexes()

    assert "Could not warm" in caplog.text


@pytest.mark.asyncio
async def test_an_unconfigured_galaxy_is_not_called_at_all(monkeypatch):
    galaxy = _galaxy(available=False, side_effect=AssertionError("called"))
    monkeypatch.setattr(main, "get_service_galaxy", MagicMock(return_value=galaxy))

    await main.warm_kmindex_indexes()


@pytest.fixture()
def booted_app(monkeypatch, tmp_path):
    """The real app, with a warm that starts and then never finishes.

    Patched on `main` itself rather than on `app.core.dependencies`: the
    lifespan calls the names main imported at import time, so patching the
    module they came from substitutes nothing.
    """
    for name in ("assemblies.json", "organisms.json", "workflows.json"):
        (tmp_path / name).write_text("[]")
    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))

    from app.core import dependencies
    from app.core.config import get_settings

    get_settings.cache_clear()
    dependencies.reset_all_services()

    fake_cache = MagicMock()
    fake_cache.clear_caches = AsyncMock(return_value=0)
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()
    monkeypatch.setattr(main, "get_cache_service", MagicMock(return_value=fake_cache))
    monkeypatch.setattr(main, "get_auth_service", MagicMock(return_value=fake_auth))

    started = threading.Event()

    async def never_finishes():
        started.set()
        await asyncio.sleep(30)

    monkeypatch.setattr(main, "warm_kmindex_indexes", never_finishes)

    yield main.create_app(), started
    get_settings.cache_clear()
    dependencies.reset_all_services()


def test_the_app_serves_while_the_warm_is_still_running(booted_app):
    """What "off the boot path" has to mean: a Galaxy that is slow to answer, or
    never answers, delays neither startup nor shutdown."""
    app, warm_started = booted_app

    with TestClient(app) as client:
        assert warm_started.wait(timeout=5)
        assert client.get("/api/v1/version").status_code == 200
