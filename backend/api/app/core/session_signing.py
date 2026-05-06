"""HMAC-based signing for assistant session IDs.

The session_id is a 128-bit random UUID, but it travels in the response
body and ends up in browser localStorage. To prevent a leaked session_id
from being usable on its own, we set an httpOnly Same-Site=Strict cookie
containing an HMAC of the session_id keyed by SESSION_COOKIE_SECRET. The
GET/DELETE session endpoints verify the cookie before returning data.
"""

from __future__ import annotations

import hashlib
import hmac


def sign_session_id(session_id: str, secret: str) -> str:
    """Return a hex-encoded HMAC-SHA256 of session_id keyed by secret."""
    mac = hmac.new(
        secret.encode("utf-8"),
        session_id.encode("utf-8"),
        hashlib.sha256,
    )
    return mac.hexdigest()


def verify_session_id(session_id: str, signature: str, secret: str) -> bool:
    """Verify a signature against a session_id in constant time."""
    if not signature or not session_id:
        return False
    expected = sign_session_id(session_id, secret)
    return hmac.compare_digest(expected, signature)
