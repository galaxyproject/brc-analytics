import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment names that count as "developer machine" -- looser defaults
# (CORS wildcards allowed, Secure cookie flag off, etc.). Anything else is
# treated as deployed and must opt into the safe behavior.
DEV_ENVIRONMENTS = frozenset({"local", "dev", "development"})

# Assistant session cookie name. Module-level constant (not env-driven)
# so importing it doesn't drag the full Settings instantiation along.
SESSION_COOKIE_NAME = "brc_assistant_session"


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        # Application
        self.APP_VERSION: str = os.getenv("APP_VERSION", "0.19.0")

        # Redis settings
        self.REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        # AI/LLM settings (OpenAI or compatible APIs)
        self.AI_API_KEY: str = os.getenv("AI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
        self.AI_PRIMARY_MODEL: str = os.getenv(
            "AI_PRIMARY_MODEL", "gpt-4-turbo-preview"
        )
        self.AI_SECONDARY_MODEL: str = os.getenv(
            "AI_SECONDARY_MODEL",
            os.getenv("AI_PRIMARY_MODEL", "gpt-4-turbo-preview"),
        )
        self.AI_API_BASE_URL: str = os.getenv("AI_API_BASE_URL", "")
        self.AI_SKIP_SSL_VERIFY: bool = (
            os.getenv("AI_SKIP_SSL_VERIFY", "false").lower() == "true"
        )

        # Database settings (for future use)
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "")

        # ENA API settings
        self.ENA_API_BASE: str = os.getenv(
            "ENA_API_BASE", "https://www.ebi.ac.uk/ena/portal/api"
        )

        # CORS settings
        self.CORS_ORIGINS: List[str] = os.getenv(
            "CORS_ORIGINS", "http://localhost:3000"
        ).split(",")
        # Reject CORS wildcards outside local/dev. With unauthenticated
        # endpoints, allow_origins=* lets any site initiate chats from a
        # victim's IP. DEV_ENVIRONMENTS tolerates wildcards for ergonomics.
        if any(o.strip() == "*" for o in self.CORS_ORIGINS):
            env = os.getenv("ENVIRONMENT", "development").lower()
            if env not in DEV_ENVIRONMENTS:
                raise ValueError(
                    f"CORS_ORIGINS=* is not allowed in ENVIRONMENT={env!r}; "
                    "set explicit origins instead."
                )

        # Sentry
        self.SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

        # Logging
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

        # Environment
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

        # Rate limiting
        self.RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
        self.RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

        # Trust X-Forwarded-For for client identification (rate limiting,
        # etc.). Only enable when behind a proxy that strips/rewrites the
        # header itself -- otherwise clients can spoof IPs.
        self.TRUST_PROXY_HEADERS: bool = os.getenv(
            "TRUST_PROXY_HEADERS", "false"
        ).lower() in ("1", "true", "yes")

        # Assistant session cookie. When SESSION_COOKIE_SECRET is set, /chat
        # issues an httpOnly Same-Site=Strict cookie binding the session_id
        # to the browser; GET/DELETE /session endpoints require the cookie.
        # Empty secret = legacy unbound mode (any caller with the session_id
        # can read/delete) -- fine for local dev, must be set in prod.
        self.SESSION_COOKIE_SECRET: str = os.getenv("SESSION_COOKIE_SECRET", "")
        self.SESSION_COOKIE_TTL: int = 7200  # match SESSION_TTL in session_service

        # Refuse to silently boot with session-cookie binding disabled in
        # deployed environments -- empty secret falls back to legacy unbound
        # mode where any caller with the session_id can read/delete. Mirrors
        # the CORS wildcard guard above.
        if (
            not self.SESSION_COOKIE_SECRET
            and self.ENVIRONMENT.lower() not in DEV_ENVIRONMENTS
        ):
            raise ValueError(
                f"SESSION_COOKIE_SECRET must be set when ENVIRONMENT={self.ENVIRONMENT!r}; "
                "empty secret disables session-cookie binding."
            )

        # Catalog path
        self.CATALOG_PATH: str = os.getenv("CATALOG_PATH", "/catalog/output")

        # Keycloak / OIDC settings
        self.KEYCLOAK_ISSUER_URL: str = os.getenv(
            "KEYCLOAK_ISSUER_URL",
            "http://localhost:8180/realms/galaxy",
        )
        self.KEYCLOAK_CLIENT_ID: str = os.getenv("KEYCLOAK_CLIENT_ID", "brc-analytics")
        self.KEYCLOAK_CLIENT_SECRET: str = os.getenv(
            "KEYCLOAK_CLIENT_SECRET", "brc-analytics-dev-secret"
        )
        self.KEYCLOAK_REDIRECT_URI: str = os.getenv(
            "KEYCLOAK_REDIRECT_URI",
            "http://localhost:8000/api/v1/auth/callback",
        )

        # Frontend URL for post-auth redirect
        self.FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
