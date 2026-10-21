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


class TestCorsOriginNormalization:
    def test_strips_whitespace_around_entries(self, monkeypatch):
        monkeypatch.setenv(
            "CORS_ORIGINS", "https://a.com, https://b.com ,  https://c.com"
        )
        monkeypatch.setenv("ENVIRONMENT", "development")
        s = Settings()
        assert s.CORS_ORIGINS == [
            "https://a.com",
            "https://b.com",
            "https://c.com",
        ]

    def test_drops_empty_entries(self, monkeypatch):
        monkeypatch.setenv("CORS_ORIGINS", "https://a.com,,  ,https://b.com")
        monkeypatch.setenv("ENVIRONMENT", "development")
        s = Settings()
        assert s.CORS_ORIGINS == ["https://a.com", "https://b.com"]


class TestSessionCookieSecretValidation:
    def test_empty_secret_in_prod_raises(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "prod")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        with pytest.raises(ValueError, match=r"SESSION_COOKIE_SECRET"):
            Settings()

    def test_empty_secret_in_local_is_allowed(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "local")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        # Should not raise -- dev gets an ephemeral secret instead.
        Settings()

    def test_empty_secret_in_dev_generates_ephemeral_one(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "development")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        s = Settings()
        # Never empty, so session binding can't be switched off by omission.
        assert len(s.SESSION_COOKIE_SECRET) >= 32
        assert s.SESSION_COOKIE_SECRET_EPHEMERAL is True
        assert Settings().SESSION_COOKIE_SECRET != s.SESSION_COOKIE_SECRET

    def test_configured_secret_is_not_ephemeral(self, monkeypatch):
        monkeypatch.setenv("SESSION_COOKIE_SECRET", "some-secret")
        assert Settings().SESSION_COOKIE_SECRET_EPHEMERAL is False

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
