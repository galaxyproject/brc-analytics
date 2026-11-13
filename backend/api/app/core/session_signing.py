"""Binding assistant sessions to the browsers that hold them.

A session_id travels in URLs and localStorage, so knowing it must not be
enough to use it. Each browser gets one random, httpOnly id cookie, issued once
and only refreshed after; each session it may use is recorded as a binding (an
HMAC of that id) in a Redis key of its own. No response rewrites another
session's binding, so one landing late can't lock the browser out.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from collections.abc import Mapping

from fastapi import HTTPException, Response

from app.core.config import BROWSER_COOKIE_NAME, DEV_ENVIRONMENTS, get_settings
from app.services.session_service import SessionService

# Long enough to outlive any session left idle; it vouches for nothing alone.
BROWSER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60


async def bind_session(
    session_service: SessionService,
    cookies: Mapping[str, str],
    response: Response,
    session_id: str,
) -> None:
    """Bind the session to this browser, issuing its id cookie if it has none yet."""
    browser_id = cookies.get(browser_cookie_name()) or secrets.token_urlsafe(32)
    response.set_cookie(
        key=browser_cookie_name(),
        value=browser_id,
        max_age=BROWSER_COOKIE_MAX_AGE,
        # Required of a __Host- cookie, along with no Domain.
        path="/",
        httponly=True,
        samesite="strict",
        secure=_is_secure(),
    )
    await session_service.bind_browser(session_id, sign_browser_id(browser_id))


def browser_cookie_name() -> str:
    """The browser id cookie's name.

    Where cookies are Secure it carries the __Host- prefix, so the browser
    refuses one planted from a subdomain or over HTTP -- a planted id would
    let whoever chose it use the sessions it gets bound to.
    """
    return f"__Host-{BROWSER_COOKIE_NAME}" if _is_secure() else BROWSER_COOKIE_NAME


def clear_browser_cookie(response: Response) -> None:
    """Expire this browser's id cookie."""
    response.delete_cookie(
        browser_cookie_name(),
        path="/",
        secure=_is_secure(),
        httponly=True,
        samesite="strict",
    )


async def forget_browser(
    session_service: SessionService, cookies: Mapping[str, str], response: Response
) -> None:
    """Unbind this browser from every session and expire its id cookie.

    The bindings go too, not just the cookie: a response already in flight
    re-issues the id from its request, and would otherwise bring back every
    conversation the browser held rather than only its own.
    """
    browser_id = cookies.get(browser_cookie_name())
    if browser_id:
        await session_service.unbind_browser(sign_browser_id(browser_id))
    clear_browser_cookie(response)


async def require_bound(
    session_service: SessionService, cookies: Mapping[str, str], session_id: str
) -> None:
    """Raise 403 unless this browser is bound to the session."""
    browser_id = cookies.get(browser_cookie_name())
    if not browser_id or not await session_service.is_browser_bound(
        session_id, sign_browser_id(browser_id)
    ):
        raise HTTPException(
            status_code=403, detail="This browser is not bound to that session"
        )


def sign_browser_id(browser_id: str) -> str:
    """Hex HMAC-SHA256 of browser_id, so Redis never holds the cookie value."""
    secret = get_settings().SESSION_COOKIE_SECRET
    return hmac.new(
        secret.encode("utf-8"), browser_id.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _is_secure() -> bool:
    """Whether cookies are Secure: everywhere but DEV_ENVIRONMENTS (maybe HTTP)."""
    return get_settings().ENVIRONMENT.lower() not in DEV_ENVIRONMENTS
