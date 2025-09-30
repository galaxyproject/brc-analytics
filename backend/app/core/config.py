import os
from functools import lru_cache
from typing import List


class Settings:
    """Application settings loaded from environment variables"""

    # Application
    APP_VERSION: str = os.getenv("APP_VERSION", "0.15.0")

    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Database settings (for future use)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Galaxy API settings
    GALAXY_API_URL: str = os.getenv("GALAXY_API_URL", "https://test.galaxyproject.org/api")
    GALAXY_API_KEY: str = os.getenv("GALAXY_API_KEY", "")

    # Galaxy Tool IDs
    GALAXY_UPLOAD_TOOL_ID: str = os.getenv("GALAXY_UPLOAD_TOOL_ID", "upload1")
    GALAXY_RANDOM_LINES_TOOL_ID: str = os.getenv("GALAXY_RANDOM_LINES_TOOL_ID", "random_lines1")

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


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
