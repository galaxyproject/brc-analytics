"""A job id Galaxy doesn't know is the caller's mistake, so it answers 404.

Before, every failure on these routes came back as a 500, which reads as our
outage and invites a retry loop from anything polling them.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.api.v1.galaxy import get_galaxy_service
from app.services.galaxy_service import GalaxyJobNotFound
from tests.test_galaxy_submit_ownership import app_client  # noqa: F401

JOB_ID = "0123456789abcdef"


def _missing_job_service():
    service = MagicMock()
    service.is_available.return_value = True
    missing = GalaxyJobNotFound(f"No Galaxy job {JOB_ID}")
    service.get_job_status = AsyncMock(side_effect=missing)
    service.get_kmindex_results = AsyncMock(side_effect=missing)
    service.get_job_results = AsyncMock(side_effect=missing)
    return service


def test_status_of_an_unknown_job_is_404(app_client):  # noqa: F811
    app, client = app_client
    app.dependency_overrides[get_galaxy_service] = _missing_job_service

    response = client.get(f"/api/v1/galaxy/jobs/{JOB_ID}/status")

    assert response.status_code == 404


def test_kmindex_results_of_an_unknown_job_is_404(app_client):  # noqa: F811
    app, client = app_client
    app.dependency_overrides[get_galaxy_service] = _missing_job_service

    response = client.get(f"/api/v1/galaxy/kmindex/jobs/{JOB_ID}/results")

    assert response.status_code == 404


def test_details_of_an_unknown_job_is_404(app_client):  # noqa: F811
    app, client = app_client
    app.dependency_overrides[get_galaxy_service] = _missing_job_service

    response = client.get(f"/api/v1/galaxy/jobs/{JOB_ID}")

    assert response.status_code == 404


def test_results_of_an_unknown_job_is_404(app_client):  # noqa: F811
    app, client = app_client
    app.dependency_overrides[get_galaxy_service] = _missing_job_service

    response = client.get(f"/api/v1/galaxy/jobs/{JOB_ID}/results")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_job_results_keeps_not_found_rather_than_wrapping_it():
    from app.services.galaxy_service import GalaxyService

    service = GalaxyService.__new__(GalaxyService)
    service.is_available = MagicMock(return_value=True)
    service.cache = MagicMock(get=AsyncMock(return_value=None))
    service.get_job_status = AsyncMock(side_effect=GalaxyJobNotFound("gone"))

    with pytest.raises(GalaxyJobNotFound):
        await service.get_job_results(JOB_ID)


# What bioblend logs, verbatim, on the last attempt of a GET Galaxy refused
# (BRC-ANALYTICS-DEV-6B). It logs this at ERROR itself before raising, so the
# 404 our route answers never stopped it reaching Sentry.
MALFORMED_ID_GET_ERROR = (
    'GET: error 400: b\'{"err_msg":"Wrong  id ( 5e1a0c77b2d94f31 ) specified, '
    'unable to decode.","err_code":400009}\', 0 attempts left'
)


def _bioblend_record(caplog, message):
    import logging

    caplog.clear()
    with caplog.at_level(logging.DEBUG, logger="bioblend"):
        logging.getLogger("bioblend").error(message)
    (record,) = [r for r in caplog.records if r.name == "bioblend"]
    return record


@pytest.mark.parametrize(
    "message",
    [
        MALFORMED_ID_GET_ERROR,
        'GET: error 404: b\'{"err_msg":"Job not found","err_code":404001}\', '
        "0 attempts left",
    ],
)
def test_bioblend_wrong_id_log_is_demoted_to_warning(caplog, message):
    import logging

    assert _bioblend_record(caplog, message).levelno == logging.WARNING


@pytest.mark.parametrize(
    "message",
    [
        # An outage still has to page.
        "GET: error 502: b'Bad Gateway', 0 attempts left",
        "HTTPSConnectionPool(host='usegalaxy.org', port=443): Read timed out., "
        "0 attempts left",
        # A 400 that isn't Galaxy's malformed-id error is Galaxy refusing
        # something else, not a wrong id.
        'GET: error 400: b\'{"err_msg":"Bad request","err_code":400008}\', '
        "0 attempts left",
        # A 404 that isn't Galaxy's own error body is a proxy or a wrong
        # GALAXY_URL, and on the polling path this log is the only trace of it.
        "GET: error 404: b'<html><body><h1>404 Not Found</h1></body></html>', "
        "0 attempts left",
    ],
)
def test_other_bioblend_errors_stay_errors(caplog, message):
    import logging

    assert _bioblend_record(caplog, message).levelno == logging.ERROR


def test_show_job_with_an_undecodable_id_logs_no_error(caplog):
    """End to end through bioblend's own GET, so a change in how it words the
    message shows up here rather than as a Sentry issue."""
    import logging

    import requests
    from bioblend import ConnectionError as BioblendConnectionError
    from bioblend.galaxy import GalaxyInstance

    from app.services.galaxy_service import is_missing_job_error

    gi = GalaxyInstance(url="http://galaxy.invalid", key="not-a-key")
    reply = requests.Response()
    reply.status_code = 400
    reply._content = (
        b'{"err_msg":"Wrong  id ( 5e1a0c77b2d94f31 ) specified, unable to '
        b'decode.","err_code":400009}'
    )
    gi.make_get_request = MagicMock(return_value=reply)

    with caplog.at_level(logging.DEBUG, logger="bioblend"):
        with pytest.raises(BioblendConnectionError) as raised:
            gi.jobs.show_job("5e1a0c77b2d94f31")

    assert is_missing_job_error(raised.value)
    assert not [r for r in caplog.records if r.levelno >= logging.ERROR]
