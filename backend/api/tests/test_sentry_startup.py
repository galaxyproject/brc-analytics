"""Regression tests for Sentry startup wiring."""

import json
import logging

import sentry_sdk
from sentry_sdk.transport import Transport

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


def test_sentry_events_carry_no_query_sequence(monkeypatch):
    """A partner submit error once put a user's whole query into Sentry via
    the frame's local variables (BRC-ANALYTICS-DEV-7J)."""
    events = []

    class _Capture(Transport):
        def capture_envelope(self, envelope):
            events.extend(i.payload.json for i in envelope.items if i.type == "event")

    real_init = sentry_sdk.init
    monkeypatch.setattr(
        sentry_sdk, "init", lambda **kw: real_init(transport=_Capture(), **kw)
    )
    monkeypatch.setenv(
        "SENTRY_DSN", "https://examplePublicKey@example.ingest.sentry.io/1"
    )
    get_settings.cache_clear()
    reset_all_services()
    create_app()
    try:
        sequence = "ACGTTGCA" * 40
        try:
            raise RuntimeError("submit failed")
        except RuntimeError:
            logging.getLogger("app.services.kmindex_submissions").exception(
                "Failed to record kmindex submission %s", "job1"
            )
        sentry_sdk.flush()
    finally:
        sentry_sdk.get_client().close()
        real_init()

    assert events
    assert sequence not in json.dumps(events)


def test_sentry_does_not_attach_request_bodies(monkeypatch):
    # The partner submit body is the query itself.
    monkeypatch.setenv(
        "SENTRY_DSN", "https://examplePublicKey@example.ingest.sentry.io/1"
    )
    get_settings.cache_clear()
    reset_all_services()

    create_app()

    assert sentry_sdk.get_client().options["max_request_body_size"] == "never"
