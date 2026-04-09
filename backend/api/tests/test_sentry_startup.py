"""Regression tests for Sentry startup wiring."""

import importlib
import sys


def _reload_app_main():
    sys.modules.pop("app.main", None)
    sys.modules.pop("app.core.config", None)
    return importlib.import_module("app.main")


def test_import_app_main_with_sentry_dsn(monkeypatch):
    monkeypatch.setenv(
        "SENTRY_DSN", "https://examplePublicKey@example.ingest.sentry.io/1"
    )

    module = _reload_app_main()

    assert module.app.title == "BRC Analytics API"
