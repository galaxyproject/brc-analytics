"""Regression tests for Sentry startup wiring."""

import base64
import json
import logging

import pytest
import sentry_sdk
from sentry_sdk.transport import Transport

from app.core.config import get_settings
from app.core.dependencies import reset_all_services
from app.core.sentry import before_send, before_send_transaction
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
    # The MCP integration records tool arguments, a query sequence among them.
    assert (
        sentry_sdk.get_client().options["before_send_transaction"]
        is before_send_transaction
    )


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


def test_sentry_events_carry_no_query_url(sentry_events):
    """Galaxy's error bodies echo the submitted base64:// query URL, and
    bioblend's str(e) carries the body into logs and exception values."""
    create_app()
    sentry_events.clear()  # startup's own catalog errors
    encoded = base64.b64encode(b">q\n" + b"ACGTTGCA" * 40).decode("ascii")
    body = f'{{"err_msg": "bad request", "url": "base64://{encoded}"}}'
    log = logging.getLogger("app.services.galaxy_service")
    log.warning("Galaxy said: %s", body)  # becomes a breadcrumb
    log.error(f"Failed to submit kmindex query: {body}")
    log.error("Failed to submit kmindex query: %s", body)
    try:
        raise RuntimeError(f"kmindex query submission failed: {body}")
    except RuntimeError:
        log.exception("submit failed")
    sentry_sdk.capture_message(f"submit failed: {body}")
    sentry_sdk.flush()

    assert len(sentry_events) == 4
    dumped = json.dumps(sentry_events)
    assert encoded not in dumped
    assert "base64://[Filtered]" in dumped
