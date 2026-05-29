"""Tests for service dependency wiring."""

from unittest.mock import MagicMock

from app.core import dependencies


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
