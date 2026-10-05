"""Galaxy failures reach the search page as a sentence, not an HTML page.

bioblend's ConnectionError stringifies with the whole response body, so a
proxy's 502 page in front of Galaxy used to become the error detail verbatim.
"""

from unittest.mock import AsyncMock, MagicMock

from bioblend import ConnectionError as BioblendConnectionError

from app.api.v1.galaxy import MAX_ERROR_DETAIL_CHARS, error_detail, get_galaxy_service
from app.services.galaxy_service import ShardFetchError
from tests.test_galaxy_submit_ownership import app_client  # noqa: F401

HTML_PAGE = (
    "<!DOCTYPE html><html><head><title>502 Bad Gateway</title></head>"
    "<body><h1>Galaxy is down</h1>" + "x" * 5000 + "</body></html>"
)


def _wrapped_bioblend(status):
    # Shaped like galaxy_service.get_job_status, which re-raises bioblend's
    # error inside a plain Exception carrying its str().
    cause = BioblendConnectionError(
        "Unexpected HTTP status code: %d" % status, body=HTML_PAGE, status_code=status
    )
    try:
        raise Exception(f"Failed to get job status using BioBLEND: {cause}") from cause
    except Exception as e:
        return e


def test_a_galaxy_5xx_becomes_a_short_retry_hint():
    detail = error_detail("Failed to get job status", _wrapped_bioblend(502))

    assert detail == (
        "Failed to get job status: Galaxy answered HTTP 502. It may be busy or "
        "restarting -- try again in a few minutes."
    )


def test_a_galaxy_4xx_names_the_status_only():
    detail = error_detail("Failed to get job status", _wrapped_bioblend(403))

    assert detail == "Failed to get job status: Galaxy answered HTTP 403."


def test_a_shard_fetch_error_uses_its_status():
    detail = error_detail(
        "Failed to get kmindex results", ShardFetchError(503, HTML_PAGE[:200])
    )

    assert "HTTP 503" in detail
    assert "<" not in detail


def test_html_without_a_status_is_dropped():
    assert error_detail("Failed", RuntimeError(HTML_PAGE)) == "Failed."


def test_plain_text_is_kept_and_bounded():
    assert error_detail("Failed", ValueError("bad index")) == "Failed: bad index"
    long = error_detail("Failed", ValueError("y" * 1000))
    assert len(long) <= len("Failed: ") + MAX_ERROR_DETAIL_CHARS + 3


def test_job_status_route_does_not_relay_the_html(app_client):  # noqa: F811
    app, client = app_client
    service = MagicMock()
    service.is_available.return_value = True
    service.get_job_status = AsyncMock(side_effect=_wrapped_bioblend(502))
    app.dependency_overrides[get_galaxy_service] = lambda: service

    response = client.get("/api/v1/galaxy/jobs/dee9dc267ca2a401/status")

    assert response.status_code == 500
    detail = response.json()["detail"]
    assert "<" not in detail
    assert "HTTP 502" in detail
