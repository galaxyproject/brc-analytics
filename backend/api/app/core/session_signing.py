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
from typing import Optional

from fastapi import HTTPException, Response

from app.core.config import DEV_ENVIRONMENTS, SESSION_COOKIE_NAME, get_settings


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


def require_session_cookie(session_id: str, cookie_value: Optional[str]) -> None:
    """Raise 403 unless the cookie's HMAC matches session_id.

    If no SESSION_COOKIE_SECRET is configured (legacy/local-dev mode), all
    requests are allowed -- the binding is opt-in via env var.
    """
    settings = get_settings()
    if not settings.SESSION_COOKIE_SECRET:
        return
    if not verify_session_id(
        session_id, cookie_value or "", settings.SESSION_COOKIE_SECRET
    ):
        raise HTTPException(status_code=403, detail="Invalid session cookie")


def set_session_cookie(response: Response, session_id: str) -> None:
    """Issue an httpOnly Same-Site=Strict cookie binding the session to this client."""
    settings = get_settings()
    if not settings.SESSION_COOKIE_SECRET:
        return
    # Only allow plain-HTTP cookies in DEV_ENVIRONMENTS. Anywhere else
    # (staging, prod, anything that could ever see a non-TLS hop) must
    # mark the cookie Secure so the browser refuses to send it over HTTP.
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=sign_session_id(session_id, settings.SESSION_COOKIE_SECRET),
        max_age=settings.SESSION_COOKIE_TTL,
        httponly=True,
        samesite="strict",
        secure=settings.ENVIRONMENT.lower() not in DEV_ENVIRONMENTS,
    )
