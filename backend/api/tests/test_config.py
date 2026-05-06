"""Tests for config validation."""

import pytest

from app.core.config import Settings


class TestCorsValidation:
    def test_wildcard_cors_in_prod_raises(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "*")
        monkeypatch.setenv("ENVIRONMENT", "prod")
        with pytest.raises(ValueError, match=r"CORS_ORIGINS=\*"):
            Settings()

    def test_wildcard_cors_in_local_is_allowed(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "*")
        monkeypatch.setenv("ENVIRONMENT", "local")
        # Should not raise
        Settings()

    def test_wildcard_cors_in_development_is_allowed(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "*")
        monkeypatch.setenv("ENVIRONMENT", "development")
        # Should not raise -- "development" is the default ENVIRONMENT value.
        Settings()

    def test_explicit_origins_in_prod_is_allowed(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "https://brc-analytics.org")
        monkeypatch.setenv("ENVIRONMENT", "prod")
        s = Settings()
        assert "*" not in s.CORS_ORIGINS

    def test_wildcard_in_one_of_many_origins_in_prod_raises(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "https://brc-analytics.org,*")
        monkeypatch.setenv("ENVIRONMENT", "prod")
        with pytest.raises(ValueError, match=r"CORS_ORIGINS=\*"):
            Settings()
