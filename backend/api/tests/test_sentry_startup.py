"""Regression tests for Sentry startup wiring."""

import json
import logging

import pytest
import sentry_sdk
from sentry_sdk.transport import Transport

from app.core.config import get_settings
from app.core.dependencies import reset_all_services
from app.core.sentry import before_send
from app.main import create_app


class _CapturingTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.events = []

    def capture_envelope(self, envelope):
        for item in envelope.items:
            if item.type == "event":
                self.events.append(item.payload.json)


@pytest.fixture()
def sentry_events(monkeypatch):
    """Turn on Sentry for create_app with a real-looking DSN, but deliver
    events to memory so a test run never reaches the network."""
    transport = _CapturingTransport()
    real_init = sentry_sdk.init
    monkeypatch.setattr(
        sentry_sdk,
        "init",
        lambda *args, **kwargs: real_init(*args, transport=transport, **kwargs),
    )
    monkeypatch.setenv(
        "SENTRY_DSN", "https://examplePublicKey@example.ingest.sentry.io/1"
    )
    get_settings.cache_clear()
    reset_all_services()
    yield transport.events
    sentry_sdk.get_client().close()
    # init() falls back to SENTRY_DSN from the environment, so drop it first
    # or the reset builds a live client of its own.
    monkeypatch.delenv("SENTRY_DSN")
    get_settings.cache_clear()
    real_init()


def test_create_app_with_sentry_dsn(sentry_events):
    app = create_app()

    assert app.title == "BRC Analytics API"
    # Without the filter, caller-input MCP errors flood Sentry as errors.
    assert sentry_sdk.get_client().options["before_send"] is before_send


def test_sentry_events_carry_no_query_sequence(sentry_events):
    """A partner submit error once put a user's whole query into Sentry via
    the frame's local variables (BRC-ANALYTICS-DEV-7J)."""
    create_app()
    sequence = "ACGTTGCA" * 40
    try:
        raise RuntimeError("submit failed")
    except RuntimeError:
        logging.getLogger("app.services.kmindex_submissions").exception(
            "Failed to record kmindex submission %s", "job1"
        )
    sentry_sdk.flush()

    assert sentry_events
    assert sequence not in json.dumps(sentry_events)


def test_sentry_does_not_attach_request_bodies(sentry_events):
    # The partner submit body is the query itself.
    create_app()

    assert sentry_sdk.get_client().options["max_request_body_size"] == "never"
