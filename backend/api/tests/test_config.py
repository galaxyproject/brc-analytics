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
        monkeypatch.setenv("SESSION_COOKIE_SECRET", "x")
        s = Settings()
        assert "*" not in s.CORS_ORIGINS

    def test_wildcard_in_one_of_many_origins_in_prod_raises(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "https://brc-analytics.org,*")
        monkeypatch.setenv("ENVIRONMENT", "prod")
        with pytest.raises(ValueError, match=r"CORS_ORIGINS=\*"):
            Settings()


class TestSessionCookieSecretValidation:
    def test_empty_secret_in_prod_raises(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "prod")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        with pytest.raises(ValueError, match=r"SESSION_COOKIE_SECRET"):
            Settings()

    def test_empty_secret_in_local_is_allowed(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "local")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        # Should not raise -- legacy unbound mode is fine in dev.
        Settings()

    def test_empty_secret_in_development_is_allowed(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "development")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        # Should not raise -- "development" is the default ENVIRONMENT value.
        Settings()

    def test_secret_set_in_prod_is_allowed(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "prod")
        monkeypatch.setenv("SESSION_COOKIE_SECRET", "some-secret")
        s = Settings()
        assert s.SESSION_COOKIE_SECRET == "some-secret"
