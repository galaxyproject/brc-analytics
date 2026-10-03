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
