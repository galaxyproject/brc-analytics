import base64
import hashlib
import json
import logging
import secrets
import time
from typing import Any, Dict, Optional

import httpx
import jwt
import redis.asyncio as redis

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SESSION_PREFIX = "auth:session:"
SESSION_TTL = 3600  # 1 hour, matches refresh token lifetime
COOKIE_NAME = "brc_session"


class AuthService:
    """Handles OIDC authentication with Keycloak using the BFF pattern.

    Tokens are stored server-side in Redis. Only an opaque session ID
    is sent to the browser as an httpOnly cookie.
    """

    def __init__(self, redis_url: str):
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._oidc_config: Optional[Dict[str, Any]] = None
        self._http_client = httpx.AsyncClient(timeout=10.0)
        self._settings = get_settings()

    @property
    def _issuer_url(self) -> str:
        return self._settings.KEYCLOAK_ISSUER_URL

    @property
    def _client_id(self) -> str:
        return self._settings.KEYCLOAK_CLIENT_ID

    @property
    def _client_secret(self) -> str:
        return self._settings.KEYCLOAK_CLIENT_SECRET

    @property
    def _redirect_uri(self) -> str:
        return self._settings.KEYCLOAK_REDIRECT_URI

    async def get_oidc_config(self) -> Dict[str, Any]:
        """Fetch and cache the OIDC discovery document."""
        if self._oidc_config is not None:
            return self._oidc_config

        url = f"{self._issuer_url}/.well-known/openid-configuration"
        resp = await self._http_client.get(url)
        resp.raise_for_status()
        self._oidc_config = resp.json()
        logger.info("Fetched OIDC discovery document from %s", url)
        return self._oidc_config

    def generate_pkce(self) -> tuple[str, str]:
        """Generate a PKCE code verifier and its S256 challenge."""
        verifier = secrets.token_urlsafe(64)
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
        return verifier, challenge

    async def build_authorization_url(self) -> tuple[str, str]:
        """Build the Keycloak authorization URL with PKCE.

        Returns (authorization_url, code_verifier) so the verifier can be
        stored temporarily for the callback.
        """
        oidc = await self.get_oidc_config()
        auth_endpoint = oidc["authorization_endpoint"]
        verifier, challenge = self.generate_pkce()

        state = secrets.token_urlsafe(32)

        params = {
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }

        # Store the verifier and state in Redis temporarily (5 min TTL)
        await self._redis.setex(
            f"auth:pkce:{state}",
            300,
            json.dumps({"code_verifier": verifier}),
        )

        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{auth_endpoint}?{query}", state

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        """Exchange an authorization code for tokens.

        Validates the state parameter and uses the stored PKCE verifier.
        """
        # Retrieve and delete the PKCE data
        pkce_key = f"auth:pkce:{state}"
        pkce_data_raw = await self._redis.get(pkce_key)
        if not pkce_data_raw:
            raise ValueError("Invalid or expired state parameter")

        await self._redis.delete(pkce_key)
        pkce_data = json.loads(pkce_data_raw)
        code_verifier = pkce_data["code_verifier"]

        oidc = await self.get_oidc_config()
        token_endpoint = oidc["token_endpoint"]

        data = {
            "grant_type": "authorization_code",
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "redirect_uri": self._redirect_uri,
            "code": code,
            "code_verifier": code_verifier,
        }

        resp = await self._http_client.post(token_endpoint, data=data)
        resp.raise_for_status()
        return resp.json()

    async def refresh_tokens(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Use a refresh token to get new access/refresh tokens."""
        try:
            oidc = await self.get_oidc_config()
            token_endpoint = oidc["token_endpoint"]

            data = {
                "grant_type": "refresh_token",
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "refresh_token": refresh_token,
            }

            resp = await self._http_client.post(token_endpoint, data=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.warning("Token refresh failed: %s", e.response.status_code)
            return None

    async def create_session(self, token_response: Dict[str, Any]) -> str:
        """Store tokens in Redis and return an opaque session ID."""
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "access_token": token_response["access_token"],
            "refresh_token": token_response.get("refresh_token", ""),
            "id_token": token_response.get("id_token", ""),
            "token_type": token_response.get("token_type", "Bearer"),
            "expires_in": token_response.get("expires_in", 300),
        }

        await self._redis.setex(
            f"{SESSION_PREFIX}{session_id}",
            SESSION_TTL,
            json.dumps(session_data),
        )
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data from Redis."""
        raw = await self._redis.get(f"{SESSION_PREFIX}{session_id}")
        if not raw:
            return None
        return json.loads(raw)

    async def delete_session(self, session_id: str) -> bool:
        """Remove a session from Redis."""
        result = await self._redis.delete(f"{SESSION_PREFIX}{session_id}")
        return result > 0

    def decode_token_claims(self, token: str) -> Dict[str, Any]:
        """Decode a JWT without signature verification.

        We skip verification here because the token was obtained directly
        from Keycloak via the token endpoint (server-to-server), so its
        authenticity is already established.
        """
        try:
            claims = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["RS256"],
            )
            return claims
        except jwt.DecodeError as e:
            logger.error("Failed to decode token: %s", e)
            return {}

    async def get_user_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Extract user info from the session's access token.

        If the access token is expired, attempts a refresh first.
        """
        session = await self.get_session(session_id)
        if not session:
            return None

        claims = self.decode_token_claims(session["access_token"])

        # If the token looks expired and we have a refresh token, try refreshing
        if claims.get("exp", 0) < time.time() and session.get("refresh_token"):
            refreshed = await self.refresh_tokens(session["refresh_token"])
            if refreshed:
                await self._redis.setex(
                    f"{SESSION_PREFIX}{session_id}",
                    SESSION_TTL,
                    json.dumps(
                        {
                            "access_token": refreshed["access_token"],
                            "refresh_token": refreshed.get(
                                "refresh_token", session["refresh_token"]
                            ),
                            "id_token": refreshed.get("id_token", ""),
                            "token_type": refreshed.get("token_type", "Bearer"),
                            "expires_in": refreshed.get("expires_in", 300),
                        }
                    ),
                )
                claims = self.decode_token_claims(refreshed["access_token"])
            else:
                # Refresh failed, session is effectively dead
                await self.delete_session(session_id)
                return None

        return {
            "sub": claims.get("sub"),
            "email": claims.get("email"),
            "name": claims.get("name"),
            "preferred_username": claims.get("preferred_username"),
            "given_name": claims.get("given_name"),
            "family_name": claims.get("family_name"),
            "email_verified": claims.get("email_verified"),
            "realm_roles": claims.get("realm_access", {}).get("roles", []),
        }

    async def close(self):
        """Clean up connections."""
        await self._http_client.aclose()
        await self._redis.close()
