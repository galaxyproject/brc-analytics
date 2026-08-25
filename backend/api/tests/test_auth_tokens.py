"""Tests for AuthService.get_valid_access_token -- the credential source for
per-user Galaxy calls. Refresh tokens are one-time-use on our realms
(revokeRefreshToken=true), so the refresh has to be single-flight per session:
a losing request must wait for the winner's rotation rather than spend the
token itself."""

import asyncio
import json
import time
from typing import Any
from unittest.mock import AsyncMock

import jwt
import pytest

from app.services.auth_service import (
    REFRESH_LOCK_PREFIX,
    SESSION_PREFIX,
    AuthService,
)

# Long enough that PyJWT doesn't warn about an insecure HMAC key.
SIGNING_KEY = "k" * 32


def make_token(exp_offset: int) -> str:
    return jwt.encode({"exp": int(time.time()) + exp_offset, "sub": "u1"}, SIGNING_KEY)


class FakeRedis:
    """Just enough Redis for the session and refresh-lock paths.

    A MagicMock can't express "the loser sees what the winner wrote", which is
    the entire point of the single-flight test, so keep a real dict.
    """

    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def setex(self, key: str, ttl: int, value: str) -> None:
        self.store[key] = value

    async def set(
        self, key: str, value: str, nx: bool = False, ex: int | None = None
    ) -> bool | None:
        if nx and key in self.store:
            return None
        self.store[key] = value
        return True

    async def delete(self, key: str) -> int:
        return 1 if self.store.pop(key, None) is not None else 0


@pytest.fixture()
def auth() -> AuthService:
    svc = AuthService.__new__(AuthService)  # skip __init__ (opens Redis)
    svc._redis = FakeRedis()
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


def seed_session(auth: AuthService, blob: str, session_id: str = "s1") -> None:
    auth._redis.store[f"{SESSION_PREFIX}{session_id}"] = blob


def stored_session(auth: AuthService, session_id: str = "s1") -> dict[str, Any]:
    return json.loads(auth._redis.store[f"{SESSION_PREFIX}{session_id}"])


@pytest.mark.asyncio
async def test_fresh_token_returned_without_refresh(auth):
    token = make_token(300)
    seed_session(auth, session_blob(token))
    auth.refresh_tokens = AsyncMock()
    assert await auth.get_valid_access_token("s1") == token
    auth.refresh_tokens.assert_not_called()


@pytest.mark.asyncio
async def test_expired_token_is_refreshed_and_stored(auth):
    old, new = make_token(-10), make_token(300)
    seed_session(auth, session_blob(old))
    auth.refresh_tokens = AsyncMock(
        return_value={"access_token": new, "refresh_token": "r2", "expires_in": 300}
    )
    assert await auth.get_valid_access_token("s1") == new
    assert stored_session(auth)["refresh_token"] == "r2"


@pytest.mark.asyncio
async def test_refresh_lock_is_released_after_a_refresh(auth):
    seed_session(auth, session_blob(make_token(-10)))
    auth.refresh_tokens = AsyncMock(
        return_value={"access_token": make_token(300), "expires_in": 300}
    )
    await auth.get_valid_access_token("s1")
    assert f"{REFRESH_LOCK_PREFIX}s1" not in auth._redis.store


@pytest.mark.asyncio
async def test_concurrent_refresh_is_single_flight(auth):
    old, new = make_token(-10), make_token(300)
    seed_session(auth, session_blob(old))
    payloads = [{"access_token": new, "refresh_token": "r2", "expires_in": 300}, None]

    async def refresh(_refresh_token: str) -> dict[str, Any] | None:
        # Yield so the second request reaches the lock while this one is
        # still in flight -- that's the race the lock exists for.
        await asyncio.sleep(0)
        return payloads.pop(0)

    auth.refresh_tokens = AsyncMock(side_effect=refresh)

    first, second = await asyncio.gather(
        auth.get_valid_access_token("s1"),
        auth.get_valid_access_token("s1"),
    )

    assert first == new
    assert second == new
    assert auth.refresh_tokens.await_count == 1


@pytest.mark.asyncio
async def test_lock_loser_gives_up_when_no_rotation_lands(auth):
    seed_session(auth, session_blob(make_token(-10)))
    auth._redis.store[f"{REFRESH_LOCK_PREFIX}s1"] = "1"
    auth.refresh_tokens = AsyncMock()

    assert await auth.get_valid_access_token("s1") is None
    auth.refresh_tokens.assert_not_called()


@pytest.mark.asyncio
async def test_no_session_returns_none(auth):
    assert await auth.get_valid_access_token("s1") is None


@pytest.mark.asyncio
async def test_failed_refresh_rereads_session_for_concurrent_rotation(auth):
    seed_session(auth, session_blob(make_token(-10)))
    rotated = make_token(300)

    async def refresh(_refresh_token: str) -> None:
        # Someone else rotated first, so our token is already spent -- but
        # theirs is in Redis by the time we look again.
        seed_session(auth, session_blob(rotated, refresh="r2"))
        return None

    auth.refresh_tokens = AsyncMock(side_effect=refresh)
    assert await auth.get_valid_access_token("s1") == rotated


@pytest.mark.asyncio
async def test_reread_of_a_nearly_expired_token_is_rejected(auth):
    seed_session(auth, session_blob(make_token(-10)))

    async def refresh(_refresh_token: str) -> None:
        # Inside TOKEN_EXPIRY_LEEWAY: valid right now, dead before a kmindex
        # submission finishes, so it must not be handed out.
        seed_session(auth, session_blob(make_token(5), refresh="r2"))
        return None

    auth.refresh_tokens = AsyncMock(side_effect=refresh)
    assert await auth.get_valid_access_token("s1") is None


@pytest.mark.asyncio
async def test_expired_with_failed_refresh_and_stale_reread_returns_none(auth):
    seed_session(auth, session_blob(make_token(-10)))
    auth.refresh_tokens = AsyncMock(return_value=None)
    assert await auth.get_valid_access_token("s1") is None


@pytest.mark.asyncio
async def test_expired_without_a_refresh_token_returns_none(auth):
    seed_session(auth, session_blob(make_token(-10), refresh=""))
    auth.refresh_tokens = AsyncMock()
    assert await auth.get_valid_access_token("s1") is None
    auth.refresh_tokens.assert_not_called()
