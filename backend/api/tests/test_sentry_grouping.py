"""One Galaxy outage should land in Sentry as a handful of issues, not one per
job id that happened to be polled during it."""

import logging
from unittest.mock import MagicMock

import pytest

from app.api.v1 import partner
from app.core.sentry import before_send


def _bioblend_event(job_id: str, address: str) -> dict:
    message = (
        "HTTPSConnectionPool(host='test.galaxyproject.org', port=443): Max "
        f"retries exceeded with url: /api/jobs/{job_id} (Caused by "
        f"ConnectTimeoutError(<HTTPSConnection(...) at {address}>)), "
        "0 attempts left"
    )
    return {"logentry": {"message": message}, "logger": "bioblend"}


def test_one_bioblend_failure_on_different_jobs_shares_a_fingerprint():
    a = before_send(_bioblend_event("402e163c2525c29b", "0x7f122ac65820"), {})
    b = before_send(_bioblend_event("13a18a936f206650", "0x7f116febf5c0"), {})

    assert a["fingerprint"] == b["fingerprint"]


def test_different_bioblend_failures_keep_different_fingerprints():
    timeout = before_send(_bioblend_event("402e163c2525c29b", "0x7f1"), {})
    bad_gateway = before_send(
        {"logentry": {"message": "GET: error 502: b'...'"}, "logger": "bioblend"},
        {},
    )

    assert timeout["fingerprint"] != bad_gateway["fingerprint"]


def test_other_loggers_keep_sentry_default_grouping():
    event = before_send({"logentry": {"message": "x"}, "logger": "app.foo"}, {})

    assert "fingerprint" not in event


@pytest.mark.asyncio
async def test_partner_status_failure_logs_a_warning_not_an_error(caplog):
    # The 502 it raises already reaches Sentry; an error log here was a second
    # issue per job id for the same failure.
    galaxy = MagicMock()
    galaxy.is_available.return_value = True
    galaxy.get_job_status.side_effect = Exception("Galaxy down")

    with caplog.at_level(logging.WARNING, logger="app.api.v1.partner"):
        with pytest.raises(partner.HTTPException) as excinfo:
            await partner.job_status(
                response=MagicMock(), job_id="402e163c2525c29b", galaxy=galaxy
            )

    assert excinfo.value.status_code == 502
    records = [r for r in caplog.records if r.name == "app.api.v1.partner"]
    assert records and all(r.levelno == logging.WARNING for r in records)
