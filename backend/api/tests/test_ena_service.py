"""Tests for the ENA study lookup's request parameters.

ENA rejects the whole search with a 400 if any requested field is unknown, so
the study lookup is pinned against a snapshot of ENA's study return fields
rather than the live endpoint.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services import ena_service
from app.services.ena_service import ENAService

# From https://www.ebi.ac.uk/ena/portal/api/returnFields?result=study
# (fetched 2026-10-18). Refresh this if ENA adds or retires study fields.
ENA_STUDY_RETURN_FIELDS = frozenset(
    {
        "breed",
        "broker_name",
        "center_name",
        "cultivar",
        "datahub",
        "description",
        "first_public",
        "geo_accession",
        "isolate",
        "keywords",
        "last_updated",
        "parent_study_accession",
        "project_name",
        "scientific_name",
        "secondary_study_accession",
        "secondary_study_alias",
        "secondary_study_center_name",
        "status",
        "strain",
        "study_accession",
        "study_alias",
        "study_description",
        "study_name",
        "study_title",
        "submission_tool",
        "tag",
        "tax_division",
        "tax_id",
        "tax_lineage",
    }
)


@pytest.fixture()
def captured_params(monkeypatch):
    """Patch httpx so get_study_info's outgoing params are recorded."""
    captured = {}

    response = MagicMock()
    response.json.return_value = [{"study_accession": "PRJEB8667"}]
    response.raise_for_status.return_value = None

    async def fake_get(url, params=None):
        captured["url"] = url
        captured["params"] = params
        return response

    client = MagicMock()
    client.get = fake_get
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    monkeypatch.setattr(ena_service.httpx, "AsyncClient", lambda **_: client)
    return captured


@pytest.fixture()
def service():
    return ENAService(cache=MagicMock())


@pytest.mark.asyncio
async def test_study_lookup_requests_only_valid_ena_fields(service, captured_params):
    await service.get_study_info("PRJEB8667", use_cache=False)

    requested = captured_params["params"]["fields"].split(",")
    unknown = set(requested) - ENA_STUDY_RETURN_FIELDS
    assert not unknown, f"ENA would 400 on unknown study fields: {sorted(unknown)}"


@pytest.mark.asyncio
async def test_study_lookup_field_list(service, captured_params):
    await service.get_study_info("PRJEB8667", use_cache=False)

    assert captured_params["params"]["fields"].split(",") == [
        "study_accession",
        "study_title",
        "study_description",
        "center_name",
        "broker_name",
        "first_public",
        "last_updated",
    ]
    assert captured_params["params"]["result"] == "study"
    assert captured_params["params"]["query"] == "study_accession=PRJEB8667"
