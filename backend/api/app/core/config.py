import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables"""

    # Application
    APP_VERSION: str = os.getenv("APP_VERSION", "0.19.0")

    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # AI/LLM settings (OpenAI or compatible APIs)
    AI_API_KEY: str = os.getenv(
        "AI_API_KEY", os.getenv("OPENAI_API_KEY", "")
    )  # Fallback to OPENAI_API_KEY for backwards compatibility
    AI_PRIMARY_MODEL: str = os.getenv("AI_PRIMARY_MODEL", "gpt-4-turbo-preview")
    AI_SECONDARY_MODEL: str = os.getenv(
        "AI_SECONDARY_MODEL", os.getenv("AI_PRIMARY_MODEL", "gpt-4-turbo-preview")
    )  # Falls back to primary if not set
    AI_API_BASE_URL: str = os.getenv(
        "AI_API_BASE_URL", ""
    )  # Empty means use OpenAI default; set for custom endpoints
    AI_SKIP_SSL_VERIFY: bool = (
        os.getenv("AI_SKIP_SSL_VERIFY", "false").lower() == "true"
    )  # Skip SSL verification for self-signed certs

    # Database settings (for future use)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # ENA API settings
    ENA_API_BASE: str = os.getenv(
        "ENA_API_BASE", "https://www.ebi.ac.uk/ena/portal/api"
    )

    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(
        ","
    )

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

    # Catalog path
    CATALOG_PATH: str = os.getenv("CATALOG_PATH", "/catalog/output")

    # Keycloak / OIDC settings
    KEYCLOAK_ISSUER_URL: str = os.getenv(
        "KEYCLOAK_ISSUER_URL",
        "http://localhost:8180/realms/galaxy",
    )
    KEYCLOAK_CLIENT_ID: str = os.getenv("KEYCLOAK_CLIENT_ID", "brc-analytics")
    KEYCLOAK_CLIENT_SECRET: str = os.getenv(
        "KEYCLOAK_CLIENT_SECRET", "brc-analytics-dev-secret"
    )
    KEYCLOAK_REDIRECT_URI: str = os.getenv(
        "KEYCLOAK_REDIRECT_URI",
        "http://localhost:8000/api/v1/auth/callback",
    )

    # Frontend URL for post-auth redirect
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
