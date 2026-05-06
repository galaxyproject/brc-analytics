"""Tests for HMAC-based session-id signing helpers."""

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
