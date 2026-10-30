"""Regression tests for Sentry startup wiring."""

import sentry_sdk

from app.core.config import get_settings
from app.core.dependencies import reset_all_services
from app.core.sentry import before_send
from app.main import create_app


def test_create_app_with_sentry_dsn(monkeypatch):
    monkeypatch.setenv(
        "SENTRY_DSN", "https://examplePublicKey@example.ingest.sentry.io/1"
    )
    get_settings.cache_clear()
    reset_all_services()

    app = create_app()

    assert app.title == "BRC Analytics API"
    # Without the filter, caller-input MCP errors flood Sentry as errors.
    assert sentry_sdk.get_client().options["before_send"] is before_send
