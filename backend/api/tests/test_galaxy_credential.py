"""Credential resolution: user bearer wins, service key is the anonymous
fallback, and GalaxyService passes each to bioblend the right way."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.dependencies import get_galaxy_credential
from app.core.galaxy_credential import GalaxyCredential
from app.services.galaxy_service import GalaxyAccountNotLinkedError, GalaxyService


def make_auth(token: str | None, sub: str | None = "u1") -> MagicMock:
    auth = MagicMock()
    auth.get_valid_access_token = AsyncMock(return_value=token)
    auth.decode_token_claims = MagicMock(
        return_value={"preferred_username": "dan", "sub": sub} if sub else {}
    )
    return auth


@pytest.mark.asyncio
async def test_session_with_valid_token_yields_user_credential(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    cred = await get_galaxy_credential(brc_session="s1", auth=make_auth("tok"))
    assert cred == GalaxyCredential(
        kind="user", secret="tok", preferred_username="dan", user_sub="u1"
    )
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_no_session_falls_back_to_service_key(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    cred = await get_galaxy_credential(brc_session=None, auth=make_auth(None))
    assert cred == GalaxyCredential(kind="service", secret="svc-key")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_dead_session_falls_back_to_service_key(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    cred = await get_galaxy_credential(brc_session="s1", auth=make_auth(None))
    assert cred == GalaxyCredential(kind="service", secret="svc-key")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_token_without_sub_falls_back_to_service_key(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    cred = await get_galaxy_credential(
        brc_session="s1", auth=make_auth("tok", sub=None)
    )
    assert cred == GalaxyCredential(kind="service", secret="svc-key")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_session_lookup_error_falls_back_to_service_key(monkeypatch):
    monkeypatch.setenv("GALAXY_API_KEY", "svc-key")
    from app.core.config import get_settings

    get_settings.cache_clear()
    auth = make_auth("tok")
    auth.get_valid_access_token = AsyncMock(side_effect=RuntimeError("redis down"))
    cred = await get_galaxy_credential(brc_session="s1", auth=auth)
    assert cred == GalaxyCredential(kind="service", secret="svc-key")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_nothing_configured_yields_none(monkeypatch):
    monkeypatch.delenv("GALAXY_API_KEY", raising=False)
    from app.core.config import get_settings

    get_settings.cache_clear()
    cred = await get_galaxy_credential(brc_session=None, auth=make_auth(None))
    assert cred is None
    get_settings.cache_clear()


def test_service_credential_builds_bioblend_with_key():
    cache = MagicMock()
    with patch("app.services.galaxy_service.GalaxyInstance") as gi:
        svc = GalaxyService(
            cache, credential=GalaxyCredential(kind="service", secret="svc-key")
        )
    gi.assert_called_once()
    assert gi.call_args.kwargs["key"] == "svc-key"
    assert svc.is_available()


def test_user_credential_builds_bioblend_with_bearer_token():
    cache = MagicMock()
    with patch("app.services.galaxy_service.GalaxyInstance") as gi:
        svc = GalaxyService(
            cache,
            credential=GalaxyCredential(kind="user", secret="tok", user_sub="u1"),
        )
    gi.assert_called_once()
    assert gi.call_args.kwargs["token"] == "tok"
    assert "key" not in gi.call_args.kwargs
    assert svc.is_available()


def test_no_credential_and_no_key_disables_service(monkeypatch):
    monkeypatch.delenv("GALAXY_API_KEY", raising=False)
    from app.core.config import get_settings

    get_settings.cache_clear()
    svc = GalaxyService(MagicMock(), credential=None)
    assert not svc.is_available()
    assert svc.gi is None
    get_settings.cache_clear()


def test_secret_is_not_in_repr():
    cred = GalaxyCredential(kind="user", secret="tok", user_sub="u1")
    assert "tok" not in repr(cred)


@pytest.mark.asyncio
async def test_user_jobs_use_per_user_history_name():
    cache = MagicMock()
    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            cache,
            credential=GalaxyCredential(kind="user", secret="tok", user_sub="u1"),
        )
    svc.gi = MagicMock()
    svc.gi.histories.get_histories = MagicMock(return_value=[])
    svc.gi.histories.create_history = MagicMock(return_value={"id": "h1"})
    await svc._get_or_create_shared_history()
    svc.gi.histories.create_history.assert_called_once_with(name="BRC Logan Search")


@pytest.mark.asyncio
async def test_service_jobs_keep_shared_history_name():
    cache = MagicMock()
    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            cache, credential=GalaxyCredential(kind="service", secret="k")
        )
    svc.gi = MagicMock()
    svc.gi.histories.get_histories = MagicMock(return_value=[])
    svc.gi.histories.create_history = MagicMock(return_value={"id": "h2"})
    await svc._get_or_create_shared_history()
    svc.gi.histories.create_history.assert_called_once_with(name="BRC ANALYTICS JOBS")


def test_galaxy_login_url_derives_from_api_url(monkeypatch):
    monkeypatch.setenv("GALAXY_API_URL", "https://test.galaxyproject.org/api")
    from app.core.config import get_settings

    get_settings.cache_clear()
    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="user", secret="t")
        )
    assert svc.galaxy_login_url() == (
        "https://test.galaxyproject.org/authnz/keycloak/login?redirect=true"
    )
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_unlinked_401_becomes_account_not_linked_error():
    from bioblend import ConnectionError as BioblendConnectionError

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="user", secret="t")
        )
    err = BioblendConnectionError("401", body="", status_code=401)
    svc._get_or_create_shared_history = AsyncMock(side_effect=err)
    from app.models.galaxy import KmindexQuerySubmission

    submission = KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT"],
    )
    with pytest.raises(GalaxyAccountNotLinkedError):
        await svc.submit_kmindex_query(submission)


@pytest.mark.asyncio
async def test_submit_response_carries_credential_identity():
    from app.models.galaxy import KmindexQuerySubmission

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(),
            credential=GalaxyCredential(kind="user", secret="t", user_sub="u1"),
        )
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._upload_fasta = AsyncMock(return_value="d1")
    svc._run_kmindex_query = AsyncMock(return_value="job1")

    submission = KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT"],
    )
    response = await svc.submit_kmindex_query(submission)

    assert response.identity == "user"
    assert response.job_id == "job1"
