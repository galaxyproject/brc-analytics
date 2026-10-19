"""Tests for HMAC-based session-id signing helpers."""

import pytest
from fastapi import HTTPException

from app.core import session_signing
from app.core.config import Settings
from app.core.session_signing import sign_session_id, verify_session_id

SECRET = "test-secret-32-bytes-min-aaaaaaaa"


class TestSessionSigning:
    def test_sign_then_verify_round_trip(self):
        sig = sign_session_id("abc123", SECRET)
        assert verify_session_id("abc123", sig, SECRET) is True

    def test_verify_fails_with_different_session(self):
        sig = sign_session_id("abc123", SECRET)
        assert verify_session_id("xyz789", sig, SECRET) is False

    def test_verify_fails_with_different_secret(self):
        sig = sign_session_id("abc123", SECRET)
        assert verify_session_id("abc123", sig, "other-secret") is False

    def test_verify_handles_invalid_signature(self):
        assert verify_session_id("abc123", "not-a-valid-sig", SECRET) is False

    def test_verify_handles_empty_signature(self):
        assert verify_session_id("abc123", "", SECRET) is False

    def test_signatures_are_deterministic(self):
        # Same inputs produce same signature; constant-time comparison happens
        # in verify_session_id via hmac.compare_digest.
        assert sign_session_id("abc", SECRET) == sign_session_id("abc", SECRET)


class TestUnconfiguredSecret:
    """Binding used to switch off entirely when the secret was unset, so a
    deploy that inherited ENVIRONMENT=development ran with it off."""

    def test_missing_cookie_is_rejected_without_a_configured_secret(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "development")
        monkeypatch.delenv("SESSION_COOKIE_SECRET", raising=False)
        monkeypatch.setattr(session_signing, "get_settings", lambda: Settings())
        with pytest.raises(HTTPException) as exc:
            session_signing.require_session_cookie("abc123", None)
        assert exc.value.status_code == 403
