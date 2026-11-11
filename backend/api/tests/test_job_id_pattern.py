"""Galaxy job ids come in two lengths, and every Logan entry point takes both.

An encoded id is one or two Blowfish blocks: 16 hex characters for a database
id up to eight digits (Galaxy Test), 32 above that (usegalaxy.org).
"""

import json
import re
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.core.sentry import _VOLATILE
from app.models.galaxy import GalaxyJobState, GalaxyJobStatus
from app.models.logan import JOB_ID_PATTERN, LoganSessionRequest
from app.services.tools.catalog_tools import AssistantDeps
from app.services.tools.logan_tools import logan_job_status
from tests.test_partner_api import BASE, HEADERS, partner_env  # noqa: F401

TEST_JOB = "0123456789abcdef"
MAIN_JOB = "bbd44e69cb8906b58abb1bc0bf72e0ce"
VALID = [TEST_JOB, MAIN_JOB]
INVALID = [
    "0123456789abcde",  # 15
    "0123456789abcdef0",  # 17
    MAIN_JOB + "0",  # 33
    MAIN_JOB[:24],  # 24, between the two block sizes
    "0123456789ABCDEF",
    MAIN_JOB.upper(),
    "",
]


@pytest.mark.parametrize("job_id", VALID)
def test_the_pattern_takes_both_lengths(job_id):
    assert re.match(JOB_ID_PATTERN, job_id)


@pytest.mark.parametrize("job_id", INVALID)
def test_the_pattern_refuses_anything_else(job_id):
    assert not re.match(JOB_ID_PATTERN, job_id)


@pytest.mark.parametrize("job_id", VALID)
def test_a_logan_session_takes_either_length(job_id):
    assert LoganSessionRequest(logan_job_id=job_id).logan_job_id == job_id


@pytest.mark.parametrize("job_id", INVALID)
def test_a_logan_session_refuses_a_malformed_id(job_id):
    with pytest.raises(ValidationError):
        LoganSessionRequest(logan_job_id=job_id)


def _status(job_id):
    return GalaxyJobStatus(
        job_id=job_id,
        state=GalaxyJobState.OK,
        created_time="t",
        updated_time="t",
        is_complete=True,
        is_successful=True,
    )


def _galaxy(job_id):
    g = MagicMock()
    g.is_available.return_value = True
    g.get_job_status = AsyncMock(return_value=_status(job_id))
    return g


@pytest.mark.asyncio
@pytest.mark.parametrize("job_id", VALID)
async def test_the_mcp_status_tool_takes_either_length(job_id):
    g = _galaxy(job_id)
    out = json.loads(
        await logan_job_status(AssistantDeps(catalog=MagicMock(), galaxy=g), job_id)
    )
    assert out["job_id"] == job_id
    g.get_job_status.assert_awaited_once_with(job_id)


@pytest.mark.asyncio
@pytest.mark.parametrize("job_id", [*INVALID, TEST_JOB + "\n"])
async def test_the_mcp_status_tool_refuses_a_malformed_id(job_id):
    g = _galaxy(job_id)
    out = json.loads(
        await logan_job_status(AssistantDeps(catalog=MagicMock(), galaxy=g), job_id)
    )
    assert out["error"].startswith("Invalid job id")
    assert "16 or 32" in out["error"]
    g.get_job_status.assert_not_called()


@pytest.mark.parametrize("job_id", VALID)
def test_the_partner_status_route_takes_either_length(partner_env, job_id):  # noqa: F811
    client, galaxy, _ = partner_env
    galaxy.get_job_status = AsyncMock(return_value=_status(job_id))

    response = client.get(f"{BASE}/jobs/{job_id}", headers=HEADERS)

    assert response.status_code == 200, response.text
    assert response.json()["job_id"] == job_id


@pytest.mark.parametrize("job_id", [j for j in INVALID if j])
def test_the_partner_status_route_refuses_a_malformed_id(partner_env, job_id):  # noqa: F811
    client, galaxy, _ = partner_env
    galaxy.get_job_status = AsyncMock(side_effect=AssertionError("reached Galaxy"))

    assert client.get(f"{BASE}/jobs/{job_id}", headers=HEADERS).status_code == 422


@pytest.mark.parametrize("job_id", VALID)
def test_sentry_grouping_masks_either_length(job_id):
    assert _VOLATILE.sub("<id>", f"/api/jobs/{job_id} failed") == (
        "/api/jobs/<id> failed"
    )
