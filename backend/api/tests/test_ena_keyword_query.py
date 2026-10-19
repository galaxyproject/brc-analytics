from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import ena as ena_router
from app.services.ena_service import (
    ENAService,
    UnsupportedKeywordsError,
    build_keyword_query,
)


def test_organism_names_are_quoted():
    assert (
        build_keyword_query(["Escherichia coli"])
        == 'scientific_name="Escherichia coli"'
    )


def test_user_quotes_are_stripped_before_quoting():
    assert (
        build_keyword_query(['"Plasmodium falciparum"'])
        == 'scientific_name="Plasmodium falciparum"'
    )


def test_library_source_with_space_is_quoted():
    assert build_keyword_query(["viral rna"]) == 'library_source="VIRAL RNA"'


def test_mixed_supported_keywords_are_anded():
    query = build_keyword_query(["Escherichia coli", "WGS", "Illumina"])
    assert query == (
        'scientific_name="Escherichia coli" AND library_strategy="WGS"'
        " AND instrument_platform=ILLUMINA"
    )


def test_generic_keywords_are_skipped():
    assert build_keyword_query(["Candida auris", "sequencing", "data"]) == (
        'scientific_name="Candida auris"'
    )


@pytest.mark.parametrize(
    "keywords",
    [
        ["AMR Gene Detection"],
        ["Escherichia coli", "AMR Gene Detection"],
        ["complete genome"],
        ["Mycobacterium tuberculosis", "chromosome"],
    ],
)
def test_unsupported_keywords_raise(keywords):
    with pytest.raises(UnsupportedKeywordsError) as exc_info:
        build_keyword_query(keywords)
    message = str(exc_info.value)
    assert keywords[-1] in message
    assert "organism" in message


def test_only_generic_keywords_raise_instead_of_querying_everything():
    with pytest.raises(UnsupportedKeywordsError):
        build_keyword_query(["data", "sequencing", "  "])


@pytest.mark.asyncio
async def test_service_does_not_call_ena_for_unsupported_keywords():
    cache = MagicMock()
    service = ENAService(cache)
    with patch("app.services.ena_service.httpx.AsyncClient") as client_cls:
        with pytest.raises(UnsupportedKeywordsError):
            await service.search_by_keywords(["AMR Gene Detection"])
    client_cls.assert_not_called()


def test_search_endpoint_returns_400_for_unsupported_keywords():
    app = FastAPI()
    app.include_router(ena_router.router, prefix="/api/v1/ena")
    service = MagicMock()
    service.search_by_keywords = AsyncMock(
        side_effect=UnsupportedKeywordsError(["AMR Gene Detection"])
    )
    app.dependency_overrides[ena_router.get_ena_service] = lambda: service
    response = TestClient(app).get(
        "/api/v1/ena/search", params={"keywords": "AMR Gene Detection"}
    )
    assert response.status_code == 400
    assert "AMR Gene Detection" in response.json()["detail"]
