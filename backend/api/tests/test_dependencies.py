"""Tests for service dependency wiring."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core import dependencies
from app.core.galaxy_credential import GalaxyCredential


class TestSRAMirrorDependencyGating:
    """F2: get_sra_mirror_service must not build a service for an empty
    SRA_MIRROR_PATH -- it should return None, matching evals/tasks.py."""

    def _with_path(self, monkeypatch, path):
        fake = MagicMock()
        fake.SRA_MIRROR_PATH = path
        monkeypatch.setattr(dependencies, "get_settings", lambda: fake)
        dependencies.get_sra_mirror_service.cache_clear()

    def test_returns_none_when_path_unset(self, monkeypatch):
        self._with_path(monkeypatch, "")
        try:
            assert dependencies.get_sra_mirror_service() is None
        finally:
            dependencies.get_sra_mirror_service.cache_clear()

    def test_builds_service_when_path_set(self, monkeypatch, tmp_path):
        # Path set but file missing: service is still constructed (and reports
        # itself unavailable), but the dependency does not short-circuit to None.
        self._with_path(monkeypatch, str(tmp_path / "mirror.duckdb"))
        try:
            svc = dependencies.get_sra_mirror_service()
            assert svc is not None
            assert svc.is_available() is False
        finally:
            dependencies.get_sra_mirror_service.cache_clear()


class TestSubmitRateLimitDispatch:
    """check_submit_rate_limit must route each credential kind to the right
    limiter -- signed-in users get their own per-sub budget, everyone else
    (service credential or no credential) shares the anonymous pool."""

    def _patched_limiters(self, monkeypatch):
        user_limiter = MagicMock()
        user_limiter.check = AsyncMock(return_value={"ok": True})
        anon_limiter = MagicMock()
        anon_limiter.check = AsyncMock(return_value={"ok": True})
        monkeypatch.setattr(
            dependencies, "get_user_submit_rate_limiter", lambda: user_limiter
        )
        monkeypatch.setattr(
            dependencies, "get_submit_rate_limiter", lambda: anon_limiter
        )
        return user_limiter, anon_limiter

    @pytest.mark.asyncio
    async def test_submit_rate_limit_user_credential_uses_per_user_budget(
        self, monkeypatch
    ):
        user_limiter, anon_limiter = self._patched_limiters(monkeypatch)
        request = MagicMock()
        credential = GalaxyCredential(kind="user", secret="t", user_sub="sub-1")

        result = await dependencies.check_submit_rate_limit(
            request, credential=credential
        )

        assert result == {"ok": True}
        user_limiter.check.assert_awaited_once()
        assert user_limiter.check.await_args.args == (request,)
        assert user_limiter.check.await_args.kwargs == {"principal": "sub-1"}
        anon_limiter.check.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_submit_rate_limit_service_credential_uses_anonymous_pool(
        self, monkeypatch
    ):
        user_limiter, anon_limiter = self._patched_limiters(monkeypatch)
        request = MagicMock()
        credential = GalaxyCredential(kind="service", secret="k")

        result = await dependencies.check_submit_rate_limit(
            request, credential=credential
        )

        assert result == {"ok": True}
        anon_limiter.check.assert_awaited_once()
        assert anon_limiter.check.await_args.args == (request,)
        assert anon_limiter.check.await_args.kwargs == {}
        user_limiter.check.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_submit_rate_limit_no_credential_uses_anonymous_pool(
        self, monkeypatch
    ):
        user_limiter, anon_limiter = self._patched_limiters(monkeypatch)
        request = MagicMock()

        result = await dependencies.check_submit_rate_limit(request, credential=None)

        assert result == {"ok": True}
        anon_limiter.check.assert_awaited_once()
        assert anon_limiter.check.await_args.args == (request,)
        assert anon_limiter.check.await_args.kwargs == {}
        user_limiter.check.assert_not_awaited()


def test_get_service_galaxy_is_a_singleton_on_the_service_credential(monkeypatch):
    from app.core import dependencies

    monkeypatch.setenv("GALAXY_API_KEY", "k")
    dependencies.reset_all_services()
    a = dependencies.get_service_galaxy()
    b = dependencies.get_service_galaxy()
    assert a is b
    assert a.credential is not None and a.credential.kind == "service"
    dependencies.reset_all_services()
    assert dependencies.get_service_galaxy() is not a
