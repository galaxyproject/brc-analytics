import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


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

        # Sentry
        self.SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

        # Logging
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

        # Environment
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

        # Rate limiting
        self.RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
        self.RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

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
