"""Tests for AuthService.get_valid_access_token -- the credential source for
per-user Galaxy calls. Refresh tokens are one-time-use on our realms
(revokeRefreshToken=true), so the rotation-race fallback matters."""

import json
import time
from unittest.mock import AsyncMock, MagicMock

import jwt
import pytest

from app.services.auth_service import AuthService


def make_token(exp_offset: int) -> str:
    return jwt.encode({"exp": int(time.time()) + exp_offset, "sub": "u1"}, "k")


@pytest.fixture()
def auth(monkeypatch):
    svc = AuthService.__new__(AuthService)  # skip __init__ (opens Redis)
    svc._redis = MagicMock()
    svc._redis.get = AsyncMock(return_value=None)
    svc._redis.setex = AsyncMock()
    return svc


def session_blob(access: str, refresh: str = "r1") -> str:
    return json.dumps(
        {
            "access_token": access,
            "refresh_token": refresh,
            "id_token": "",
            "token_type": "Bearer",
            "expires_in": 300,
        }
    )


@pytest.mark.asyncio
async def test_fresh_token_returned_without_refresh(auth):
    token = make_token(300)
    auth._redis.get = AsyncMock(return_value=session_blob(token))
    auth.refresh_tokens = AsyncMock()
    assert await auth.get_valid_access_token("s1") == token
    auth.refresh_tokens.assert_not_called()


@pytest.mark.asyncio
async def test_expired_token_is_refreshed_and_stored(auth):
    old, new = make_token(-10), make_token(300)
    auth._redis.get = AsyncMock(return_value=session_blob(old))
    auth.refresh_tokens = AsyncMock(
        return_value={"access_token": new, "refresh_token": "r2", "expires_in": 300}
    )
    assert await auth.get_valid_access_token("s1") == new
    auth._redis.setex.assert_awaited_once()
    stored = json.loads(auth._redis.setex.await_args.args[2])
    assert stored["refresh_token"] == "r2"


@pytest.mark.asyncio
async def test_failed_refresh_rereads_session_for_concurrent_rotation(auth):
    old, rotated = make_token(-10), make_token(300)
    auth._redis.get = AsyncMock(side_effect=[session_blob(old), session_blob(rotated)])
    auth.refresh_tokens = AsyncMock(return_value=None)
    assert await auth.get_valid_access_token("s1") == rotated


@pytest.mark.asyncio
async def test_no_session_returns_none(auth):
    assert await auth.get_valid_access_token("s1") is None


@pytest.mark.asyncio
async def test_expired_with_failed_refresh_and_stale_reread_returns_none(auth):
    old = make_token(-10)
    auth._redis.get = AsyncMock(return_value=session_blob(old))
    auth.refresh_tokens = AsyncMock(return_value=None)
    assert await auth.get_valid_access_token("s1") is None
