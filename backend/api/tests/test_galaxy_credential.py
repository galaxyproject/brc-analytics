"""Credential resolution: user bearer wins, service key is the anonymous
fallback, and GalaxyService passes each to bioblend the right way."""

import asyncio
import json
import threading
import time
from collections import defaultdict
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.dependencies import get_galaxy_credential
from app.core.galaxy_credential import GalaxyCredential
from app.services import galaxy_service
from app.services.galaxy_service import GalaxyAccountNotLinkedError, GalaxyService
from app.services.galaxy_service import _today as real_today

# Verbatim from galaxy/lib/galaxy/authnz/managers.py -- the two 401s we have
# to tell apart.
UNLINKED_BODY = json.dumps(
    {
        "err_msg": (
            "Cannot locate user by access token. The user should log into "
            "Galaxy at least once with this OIDC provider."
        )
    }
)
INVALID_TOKEN_BODY = json.dumps({"err_msg": "Invalid access token."})


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


class FakeCache:
    """Just enough of CacheService for the history id to round-trip."""

    def __init__(self):
        self.store = {}

    def make_key(self, prefix, params):
        return f"{prefix}:{json.dumps(params, sort_keys=True)}"

    async def get(self, key):
        return self.store.get(key)

    async def set(self, key, value, ttl=3600):
        self.store[key] = value
        return True

    async def delete(self, key):
        return self.store.pop(key, None) is not None


class FakeGalaxy:
    """A Galaxy account's histories, behind the calls history resolution makes.

    get_histories is wired to fail, since it lists every history on the
    account before bioblend filters by name.
    """

    def __init__(self, histories=None, lookup_delay=0.0):
        self.histories = list(histories or [])
        self.lookup_delay = lookup_delay
        self.lookups = []
        self.gi = MagicMock()
        self.gi.url = "https://galaxy.example/api"
        self.gi.make_get_request = MagicMock(side_effect=self._get)
        self.gi.histories.get_histories = MagicMock(
            side_effect=AssertionError("listed every history")
        )
        self.gi.histories.create_history = MagicMock(side_effect=self._create)

    def _get(self, url, params=None, **kwargs):
        assert url == "https://galaxy.example/api/histories"
        filters = dict(zip(params["q"], params["qv"]))
        assert "name" in filters, "history lookup without a name filter"
        self.lookups.append(filters["name"])
        time.sleep(self.lookup_delay)
        response = MagicMock(status_code=200)
        response.json.return_value = [
            h for h in self.histories if h["name"] == filters["name"]
        ]
        return response

    def _create(self, name):
        history = {
            "id": f"h{len(self.histories)}",
            "name": name,
            "update_time": "2026-10-08T00:00:00",
        }
        self.histories.append(history)
        return history


TODAY = "2026-10-08"
SERVICE_HISTORY = f"BRC ANALYTICS JOBS - {TODAY}"


@pytest.fixture(autouse=True)
def _fresh_history_state(monkeypatch):
    monkeypatch.setattr(galaxy_service, "_HISTORY_LOCKS", defaultdict(asyncio.Lock))
    monkeypatch.setattr(galaxy_service, "_HISTORY_IDS", {})
    monkeypatch.setattr(galaxy_service, "_today", lambda: TODAY)


def _service(galaxy, cache=None, credential=None, history_name=None):
    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            cache or FakeCache(),
            credential=credential or GalaxyCredential(kind="service", secret="k"),
            history_name=history_name,
        )
    svc.gi = galaxy.gi
    return svc


USER = GalaxyCredential(kind="user", secret="tok", user_sub="u1")


@pytest.mark.asyncio
async def test_user_jobs_use_per_user_history_name():
    galaxy = FakeGalaxy()
    await _service(galaxy, credential=USER)._get_or_create_shared_history()
    galaxy.gi.histories.create_history.assert_called_once_with(name="BRC Logan Search")


@pytest.mark.asyncio
async def test_service_jobs_keep_shared_history_name():
    galaxy = FakeGalaxy()
    await _service(galaxy)._get_or_create_shared_history()
    galaxy.gi.histories.create_history.assert_called_once_with(name=SERVICE_HISTORY)


@pytest.mark.asyncio
async def test_a_named_service_history_replaces_the_shared_one():
    galaxy = FakeGalaxy([{"id": "shared", "name": SERVICE_HISTORY}])
    svc = _service(galaxy, history_name="BRC Logan Partner - logan")

    assert await svc._get_or_create_shared_history() == "h1"
    galaxy.gi.histories.create_history.assert_called_once_with(
        name=f"BRC Logan Partner - logan - {TODAY}"
    )


@pytest.mark.asyncio
async def test_a_history_name_does_not_move_a_users_jobs():
    galaxy = FakeGalaxy()
    svc = _service(galaxy, credential=USER, history_name="BRC Logan Partner - logan")
    await svc._get_or_create_shared_history()
    galaxy.gi.histories.create_history.assert_called_once_with(name="BRC Logan Search")


@pytest.mark.asyncio
async def test_service_histories_carry_the_utc_date(monkeypatch):
    galaxy = FakeGalaxy()
    first = await _service(galaxy)._get_or_create_shared_history()
    assert await _service(galaxy)._get_or_create_shared_history() == first

    monkeypatch.setattr(galaxy_service, "_today", lambda: "2026-10-09")
    second = await _service(galaxy)._get_or_create_shared_history()

    assert second != first
    assert [h["name"] for h in galaxy.histories] == [
        SERVICE_HISTORY,
        "BRC ANALYTICS JOBS - 2026-10-09",
    ]


def test_the_date_is_the_utc_date(monkeypatch):
    from datetime import datetime, timezone

    class Clock:
        @staticmethod
        def now(tz=None):
            # Late evening in the Americas is already tomorrow in UTC.
            assert tz is timezone.utc
            return datetime(2026, 10, 9, 1, 30, tzinfo=timezone.utc)

    monkeypatch.setattr(galaxy_service, "datetime", Clock)
    assert real_today() == "2026-10-09"


@pytest.mark.asyncio
async def test_user_histories_do_not_rotate(monkeypatch):
    galaxy = FakeGalaxy()
    first = await _service(galaxy, credential=USER)._get_or_create_shared_history()
    monkeypatch.setattr(galaxy_service, "_today", lambda: "2026-10-09")
    monkeypatch.setattr(galaxy_service, "_HISTORY_IDS", {})

    svc = _service(galaxy, credential=USER)
    assert await svc._get_or_create_shared_history() == first
    assert [h["name"] for h in galaxy.histories] == ["BRC Logan Search"]


@pytest.mark.asyncio
async def test_lookup_filters_by_name_on_the_server():
    # The 2026-10-08 timeout was an unfiltered list of every history on the
    # account; FakeGalaxy fails get_histories and any lookup without q=name.
    galaxy = FakeGalaxy()
    await _service(galaxy)._get_or_create_shared_history()
    params = galaxy.gi.make_get_request.call_args.kwargs["params"]
    assert dict(zip(params["q"], params["qv"])) == {
        "deleted": "False",
        "name": SERVICE_HISTORY,
    }
    galaxy.gi.histories.get_histories.assert_not_called()


@pytest.mark.asyncio
async def test_lookup_takes_the_most_recently_updated_match():
    galaxy = FakeGalaxy(
        [
            {"id": "old", "name": SERVICE_HISTORY, "update_time": "2026-01-01"},
            {"id": "new", "name": SERVICE_HISTORY, "update_time": "2026-10-01"},
        ]
    )
    assert await _service(galaxy)._get_or_create_shared_history() == "new"
    galaxy.gi.histories.create_history.assert_not_called()


@pytest.mark.asyncio
async def test_a_second_submit_in_the_process_asks_galaxy_nothing():
    galaxy = FakeGalaxy()
    first = await _service(galaxy)._get_or_create_shared_history()
    # A new service per request, as the router builds them, and a cold Redis.
    assert await _service(galaxy)._get_or_create_shared_history() == first
    assert len(galaxy.lookups) == 1


@pytest.mark.asyncio
async def test_a_warm_redis_answers_a_fresh_process(monkeypatch):
    galaxy = FakeGalaxy()
    cache = FakeCache()
    first = await _service(galaxy, cache)._get_or_create_shared_history()

    # A restart, or another worker: nothing in process, Redis still warm.
    monkeypatch.setattr(galaxy_service, "_HISTORY_IDS", {})
    assert await _service(galaxy, cache)._get_or_create_shared_history() == first
    assert len(galaxy.lookups) == 1


@pytest.mark.asyncio
async def test_users_do_not_share_a_cached_history():
    galaxy = FakeGalaxy()
    cache = FakeCache()
    other = GalaxyCredential(kind="user", secret="tok2", user_sub="u2")
    await _service(galaxy, cache, credential=USER)._get_or_create_shared_history()
    await _service(galaxy, cache, credential=other)._get_or_create_shared_history()
    assert len(galaxy.lookups) == 2


@pytest.mark.asyncio
async def test_named_service_histories_do_not_share_a_lock(monkeypatch):
    locks = defaultdict(asyncio.Lock)
    monkeypatch.setattr(galaxy_service, "_HISTORY_LOCKS", locks)

    for name in (None, "BRC Logan Partner - logan"):
        await _service(FakeGalaxy(), history_name=name)._get_or_create_shared_history()

    assert set(locks) == {
        ("service", SERVICE_HISTORY),
        ("service", f"BRC Logan Partner - logan - {TODAY}"),
    }


@pytest.mark.asyncio
async def test_concurrent_cold_misses_make_one_lookup_and_one_history():
    # Neither cache has the id until the first resolve finishes, so without
    # the lock both would find nothing and both would create the history.
    galaxy = FakeGalaxy(lookup_delay=0.05)
    services = [_service(galaxy, FakeCache()) for _ in range(3)]

    ids = await asyncio.gather(*(s._get_or_create_shared_history() for s in services))

    assert len(set(ids)) == 1
    assert len(galaxy.lookups) == 1
    assert len(galaxy.histories) == 1


@pytest.mark.asyncio
async def test_one_account_stuck_on_galaxy_does_not_hold_up_another():
    # A hung lookup can hold its lock for the whole request timeout; that has
    # to stay one account's problem.
    release = threading.Event()
    stuck_galaxy = FakeGalaxy()
    stuck_galaxy.gi.make_get_request = MagicMock(
        side_effect=lambda *a, **k: release.wait(5) and None
    )
    stuck = _service(stuck_galaxy, credential=USER)
    free = _service(
        FakeGalaxy(),
        credential=GalaxyCredential(kind="user", secret="tok", user_sub="u2"),
    )

    stuck_task = asyncio.create_task(stuck._get_or_create_shared_history())
    # Let the stuck lookup take its lock before the other one asks.
    await asyncio.sleep(0.05)
    try:
        assert await asyncio.wait_for(free._get_or_create_shared_history(), 1) == "h0"
    finally:
        release.set()
        with pytest.raises(Exception):
            await stuck_task


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


@pytest.fixture(autouse=True)
def _known_indexes():
    """Submits check index names first; these tests are about what comes after."""
    from app.services.kmindex_indexes import FALLBACK_INDEX_NAMES

    with patch.object(
        GalaxyService,
        "list_kmindex_indexes",
        AsyncMock(return_value=list(FALLBACK_INDEX_NAMES)),
    ):
        yield


@pytest.mark.asyncio
async def test_an_unknown_index_is_refused_before_anything_is_uploaded():
    from app.models.galaxy import KmindexQuerySubmission
    from app.services.galaxy_service import KmindexUnknownIndex

    svc = _user_service()
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._upload_fasta = AsyncMock(return_value="d1")
    submission = KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT", "NOT_AN_INDEX"],
    )

    with pytest.raises(KmindexUnknownIndex, match="NOT_AN_INDEX"):
        await svc.submit_kmindex_query(submission)
    svc._get_or_create_shared_history.assert_not_awaited()
    svc._upload_fasta.assert_not_awaited()


def _user_service() -> GalaxyService:
    with patch("app.services.galaxy_service.GalaxyInstance"):
        return GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="user", secret="t")
        )


def _submission():
    from app.models.galaxy import KmindexQuerySubmission

    return KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT"],
    )


@pytest.mark.asyncio
async def test_unlinked_401_becomes_account_not_linked_error():
    from bioblend import ConnectionError as BioblendConnectionError

    svc = _user_service()
    err = BioblendConnectionError("401", body=UNLINKED_BODY, status_code=401)
    svc._get_or_create_shared_history = AsyncMock(side_effect=err)

    with pytest.raises(GalaxyAccountNotLinkedError):
        await svc.submit_kmindex_query(_submission())


@pytest.mark.asyncio
async def test_invalid_token_401_is_not_a_connect_prompt():
    """A rejected token means bad audience/scope/signature -- connecting the
    account would not fix it, so it must not masquerade as a link prompt."""
    from bioblend import ConnectionError as BioblendConnectionError

    svc = _user_service()
    err = BioblendConnectionError("401", body=INVALID_TOKEN_BODY, status_code=401)
    svc._get_or_create_shared_history = AsyncMock(side_effect=err)

    with pytest.raises(Exception) as excinfo:
        await svc.submit_kmindex_query(_submission())
    assert not isinstance(excinfo.value, GalaxyAccountNotLinkedError)


@pytest.mark.asyncio
@pytest.mark.parametrize("credential", [USER, None])
async def test_a_history_failure_raises_and_creates_nothing(credential):
    # The service account used to fall back to a "<name> - <timestamp>"
    # history, which on 2026-10-08 timed out too and would only have added
    # another history to the list whose length caused the timeout.
    galaxy = FakeGalaxy()
    galaxy.gi.make_get_request = MagicMock(side_effect=RuntimeError("timed out"))
    svc = _service(galaxy, credential=credential)

    with pytest.raises(RuntimeError):
        await svc._get_or_create_shared_history()
    galaxy.gi.histories.create_history.assert_not_called()


@pytest.mark.asyncio
async def test_a_failed_lookup_status_raises_a_bioblend_error():
    # A bioblend ConnectionError, so an unlinked user's 401 still reaches the
    # connect-prompt mapping.
    from bioblend import ConnectionError as BioblendConnectionError

    galaxy = FakeGalaxy()
    galaxy.gi.make_get_request = MagicMock(
        return_value=MagicMock(status_code=401, text=UNLINKED_BODY)
    )
    svc = _service(galaxy, credential=USER)

    with pytest.raises(GalaxyAccountNotLinkedError):
        await svc.submit_kmindex_query(_submission())
    with pytest.raises(BioblendConnectionError):
        await svc._get_or_create_shared_history()
    galaxy.gi.histories.create_history.assert_not_called()


def _history_gone():
    from bioblend import ConnectionError as BioblendConnectionError

    return BioblendConnectionError(
        "404",
        body=json.dumps({"err_msg": "History not found"}),
        status_code=404,
    )


@pytest.mark.asyncio
async def test_a_gone_history_is_re_resolved_and_the_upload_retried():
    galaxy = FakeGalaxy([{"id": "stale", "name": SERVICE_HISTORY}])
    cache = FakeCache()
    svc = _service(galaxy, cache)
    assert await svc._get_or_create_shared_history() == "stale"
    # Someone deleted it by hand; the lookup only returns live histories.
    galaxy.histories.clear()

    def paste_content(history_id, **kwargs):
        if history_id == "stale":
            raise _history_gone()
        return {"outputs": [{"id": "d1"}]}

    galaxy.gi.tools.paste_content = MagicMock(side_effect=paste_content)
    svc._run_kmindex_query = AsyncMock(return_value="job1")

    response = await svc.submit_kmindex_query(_submission())

    assert response.job_id == "job1"
    fresh = svc._run_kmindex_query.await_args.args[2]
    assert fresh != "stale"
    assert list(galaxy_service._HISTORY_IDS.values()) == [fresh]
    assert list(cache.store.values()) == [fresh]


@pytest.mark.asyncio
async def test_a_gone_history_at_run_tool_clears_the_cache_without_a_retry():
    galaxy = FakeGalaxy([{"id": "stale", "name": SERVICE_HISTORY}])
    cache = FakeCache()
    svc = _service(galaxy, cache)
    svc._upload_fasta = AsyncMock(return_value="d1")
    galaxy.gi.tools.run_tool = MagicMock(side_effect=_history_gone())

    with pytest.raises(Exception):
        await svc.submit_kmindex_query(_submission())

    assert galaxy.gi.tools.run_tool.call_count == 1
    assert galaxy_service._HISTORY_IDS == {}
    assert cache.store == {}


@pytest.mark.asyncio
async def test_an_unrelated_upload_failure_keeps_the_cached_history():
    from app.services.galaxy_service import GalaxySubmitNotStarted

    galaxy = FakeGalaxy([{"id": "h", "name": SERVICE_HISTORY}])
    svc = _service(galaxy)
    galaxy.gi.tools.paste_content = MagicMock(side_effect=RuntimeError("timed out"))

    with pytest.raises(GalaxySubmitNotStarted):
        await svc.submit_kmindex_query(_submission())
    assert galaxy.gi.tools.paste_content.call_count == 1
    assert list(galaxy_service._HISTORY_IDS.values()) == ["h"]


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


@pytest.mark.asyncio
@pytest.mark.parametrize("step", ["history", "upload"])
async def test_a_failure_before_run_tool_is_known_not_to_have_started(step):
    # Nothing asked Galaxy to run the tool, so no job can exist and the partner
    # API is free to release the caller's Idempotency-Key.
    from app.services.galaxy_service import GalaxySubmitNotStarted

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="service", secret="k")
        )
    svc._get_or_create_shared_history = AsyncMock(
        side_effect=RuntimeError("boom") if step == "history" else None,
        return_value="h1",
    )
    svc._upload_fasta = AsyncMock(side_effect=RuntimeError("boom"))
    svc._run_kmindex_query = AsyncMock()

    with pytest.raises(GalaxySubmitNotStarted):
        await svc.submit_kmindex_query(_submission())
    svc._run_kmindex_query.assert_not_awaited()


@pytest.mark.asyncio
async def test_a_failure_from_run_tool_on_is_ambiguous():
    # Galaxy may have queued the job and lost the reply.
    from app.services.galaxy_service import GalaxySubmitNotStarted

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="service", secret="k")
        )
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._upload_fasta = AsyncMock(return_value="ds1")
    svc._run_kmindex_query = AsyncMock(side_effect=RuntimeError("read timed out"))

    with pytest.raises(Exception) as excinfo:
        await svc.submit_kmindex_query(_submission())
    assert not isinstance(excinfo.value, GalaxySubmitNotStarted)
