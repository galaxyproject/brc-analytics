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
        # How the state EXTRACTOR emits its structured output. The reply is a
        # separate plain-text call; a focused second call extracts the tracker
        # snapshot.
        # The eval showed MiniMax on TACC only post-hoc-validates json_schema
        # (drifts to prose -> 400) but follows a prompted JSON instruction, while
        # Anthropic honors tool output -- so the mode is provider-dependent.
        #   auto (default): prompted for OpenAI-compatible endpoints, tool for
        #                   Anthropic.
        #   native | tool | prompted: force a specific pydantic-ai output mode.
        self.ASSISTANT_OUTPUT_MODE: str = os.getenv(
            "ASSISTANT_OUTPUT_MODE", "auto"
        ).lower()

        # Database settings -- required for persistent user data (favorites,
        # saved analyses, workflow runs). Anonymous / non-persistent flows
        # don't touch the DB.
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "")
        self.DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "false").lower() == "true"
        self.DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "5"))
        self.DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))
        # Off by default so prod deploys retain explicit migration control.
        # Enable for local/dev/CI where a one-shot upgrade-on-startup is convenient.
        self.RUN_MIGRATIONS_ON_STARTUP: bool = (
            os.getenv("RUN_MIGRATIONS_ON_STARTUP", "false").lower() == "true"
        )

        # Durable per-turn assistant logging (#1294). Requires DATABASE_URL --
        # without it there is no sink and the write is skipped.
        self.ASSISTANT_TURN_LOGGING_ENABLED: bool = (
            os.getenv("ASSISTANT_TURN_LOGGING_ENABLED", "true").lower() == "true"
        )
        self.ASSISTANT_TURN_LOG_RETENTION_DAYS: int = int(
            os.getenv("ASSISTANT_TURN_LOG_RETENTION_DAYS", "90")
        )
        # The sweep runs in-app so the 90-day deletion the UI promises doesn't
        # depend on someone installing a cron job. Disabling it is an explicit
        # choice to stop honouring that notice, and it warns when you do.
        self.ASSISTANT_TURN_LOG_PURGE_ENABLED: bool = (
            os.getenv("ASSISTANT_TURN_LOG_PURGE_ENABLED", "true").lower() == "true"
        )
        self.ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS: float = float(
            os.getenv("ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS", "6")
        )
        # The write is awaited in the request, so this is the cap on what a
        # slow database can add to a turn. Kept low for that reason.
        self.ASSISTANT_TURN_LOG_TIMEOUT_SECONDS: float = float(
            os.getenv("ASSISTANT_TURN_LOG_TIMEOUT_SECONDS", "2.0")
        )
        # Tool returns are unbounded -- a broad query_catalog call can serialize
        # to a lot of JSON. Cap the stored transcript so one row can't bloat the
        # table, WAL, and backups; transcript_truncated records when it bit.
        self.ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES: int = int(
            os.getenv("ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES", "65536")
        )

        # ENA API settings
        self.ENA_API_BASE: str = os.getenv(
            "ENA_API_BASE", "https://www.ebi.ac.uk/ena/portal/api"
        )

        # CORS settings. Strip per-entry so "https://a.com, https://b.com"
        # (with a space after the comma) doesn't end up handing CORSMiddleware
        # " https://b.com", which wouldn't match a real Origin header.
        self.CORS_ORIGINS: List[str] = [
            o.strip()
            for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
            if o.strip()
        ]
        # Reject CORS wildcards outside local/dev. With unauthenticated
        # endpoints, allow_origins=* lets any site initiate chats from a
        # victim's IP. DEV_ENVIRONMENTS tolerates wildcards for ergonomics.
        if any(o == "*" for o in self.CORS_ORIGINS):
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

        # SRA-DuckDB mirror. Empty path disables the assistant's SRA tools.
        self.SRA_MIRROR_PATH: str = os.getenv("SRA_MIRROR_PATH", "")

        # Galaxy job execution. Empty API key disables the Galaxy endpoints --
        # the key is a service account, so jobs land in one shared account
        # rather than the visitor's own Galaxy session.
        self.GALAXY_API_URL: str = os.getenv(
            "GALAXY_API_URL", "https://test.galaxyproject.org/api"
        )
        self.GALAXY_API_KEY: str = os.getenv("GALAXY_API_KEY", "")

        # Galaxy tool IDs
        self.GALAXY_UPLOAD_TOOL_ID: str = os.getenv("GALAXY_UPLOAD_TOOL_ID", "upload1")
        self.GALAXY_RANDOM_LINES_TOOL_ID: str = os.getenv(
            "GALAXY_RANDOM_LINES_TOOL_ID", "random_lines1"
        )
        # Versioned rather than short id: kmindex_query's parameter shape has
        # changed across releases, so pinning keeps tool_inputs valid.
        self.GALAXY_KMINDEX_TOOL_ID: str = os.getenv(
            "GALAXY_KMINDEX_TOOL_ID",
            "toolshed.g2.bx.psu.edu/repos/iuc/kmindex/kmindex_query/0.6.1+galaxy3",
        )

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
