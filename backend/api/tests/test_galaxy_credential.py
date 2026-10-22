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
    monkeypatch.setattr(galaxy_service, "_SERVICE_HISTORY_DAYS", {})
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


@pytest.mark.asyncio
async def test_a_passed_days_service_entries_are_dropped(monkeypatch):
    galaxy = FakeGalaxy()
    await _service(galaxy)._get_or_create_shared_history()
    user_history = await _service(
        galaxy, credential=USER
    )._get_or_create_shared_history()

    monkeypatch.setattr(galaxy_service, "_today", lambda: "2026-10-09")
    today = await _service(galaxy)._get_or_create_shared_history()

    assert sorted(galaxy_service._HISTORY_IDS.values()) == sorted([user_history, today])
    assert set(galaxy_service._HISTORY_LOCKS) == {
        "u1",
        ("service", "BRC ANALYTICS JOBS - 2026-10-09"),
    }
    # The bookkeeping itself doesn't grow either.
    assert set(galaxy_service._SERVICE_HISTORY_DAYS.values()) == {"2026-10-09"}
    assert len(galaxy_service._SERVICE_HISTORY_DAYS) == 2


@pytest.mark.asyncio
async def test_a_held_lock_from_a_passed_day_is_left_alone(monkeypatch):
    galaxy = FakeGalaxy()
    await _service(galaxy)._get_or_create_shared_history()
    old = ("service", SERVICE_HISTORY)
    lock = galaxy_service._HISTORY_LOCKS[old]
    await lock.acquire()
    monkeypatch.setattr(galaxy_service, "_today", lambda: "2026-10-09")

    await _service(galaxy)._get_or_create_shared_history()
    assert galaxy_service._HISTORY_LOCKS.get(old) is lock

    # Once it's free, the next submit takes it.
    lock.release()
    await _service(galaxy)._get_or_create_shared_history()
    assert old not in galaxy_service._HISTORY_LOCKS


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
async def test_an_unknown_index_is_refused_before_anything_is_sent():
    from app.models.galaxy import KmindexQuerySubmission
    from app.services.galaxy_service import KmindexUnknownIndex

    svc = _user_service()
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._request_kmindex_job = AsyncMock(return_value="tr1")
    submission = KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT", "NOT_AN_INDEX"],
    )

    with pytest.raises(KmindexUnknownIndex, match="NOT_AN_INDEX"):
        await svc.submit_kmindex_query(submission)
    svc._get_or_create_shared_history.assert_not_awaited()
    svc._request_kmindex_job.assert_not_awaited()


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
async def test_a_gone_history_is_re_resolved_and_the_request_retried():
    galaxy = FakeGalaxy([{"id": "stale", "name": SERVICE_HISTORY}])
    cache = FakeCache()
    svc = _service(galaxy, cache)
    assert await svc._get_or_create_shared_history() == "stale"
    # Someone deleted it by hand; the lookup only returns live histories.
    galaxy.histories.clear()

    def post(url, payload=None, **kwargs):
        if payload["history_id"] == "stale":
            raise _history_gone()
        return {"tool_request_id": "tr1"}

    galaxy.gi.make_post_request = MagicMock(side_effect=post)
    svc._job_for_tool_request = AsyncMock(return_value="job1")

    response = await svc.submit_kmindex_query(_submission())

    assert response.job_id == "job1"
    fresh = galaxy.gi.make_post_request.call_args.kwargs["payload"]["history_id"]
    assert fresh != "stale"
    assert list(galaxy_service._HISTORY_IDS.values()) == [fresh]
    assert list(cache.store.values()) == [fresh]


@pytest.mark.asyncio
async def test_a_refused_request_is_known_not_to_have_started():
    # Galaxy answered with a 4xx, so it queued nothing, and the cached history
    # wasn't the problem.
    from bioblend import ConnectionError as BioblendConnectionError

    from app.services.galaxy_service import GalaxySubmitNotStarted

    galaxy = FakeGalaxy([{"id": "h", "name": SERVICE_HISTORY}])
    svc = _service(galaxy)
    galaxy.gi.make_post_request = MagicMock(
        side_effect=BioblendConnectionError("400", body="bad", status_code=400)
    )

    with pytest.raises(GalaxySubmitNotStarted):
        await svc.submit_kmindex_query(_submission())
    assert galaxy.gi.make_post_request.call_count == 1
    assert list(galaxy_service._HISTORY_IDS.values()) == ["h"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "answer",
    ["502", "504", "200 with a body that won't decode", "200 with no id"],
)
async def test_an_answer_that_doesnt_say_it_was_refused_is_ambiguous(answer):
    # A 5xx can come from a proxy after Galaxy queued the request, and a 200
    # means it was taken whatever the body says.
    from bioblend import ConnectionError as BioblendConnectionError

    from app.services.galaxy_service import GalaxySubmitNotStarted

    galaxy = FakeGalaxy([{"id": "h", "name": SERVICE_HISTORY}])
    svc = _service(galaxy)
    if answer == "200 with no id":
        galaxy.gi.make_post_request = MagicMock(return_value={"task_result": {}})
    else:
        code = int(answer[:3])
        galaxy.gi.make_post_request = MagicMock(
            side_effect=BioblendConnectionError(answer, body="", status_code=code)
        )

    with pytest.raises(Exception) as excinfo:
        await svc.submit_kmindex_query(_submission())
    assert not isinstance(excinfo.value, GalaxySubmitNotStarted)


@pytest.mark.asyncio
async def test_a_request_whose_answer_never_came_is_ambiguous():
    # It went out; Galaxy may have queued it and lost the reply.
    from app.services.galaxy_service import GalaxySubmitNotStarted

    galaxy = FakeGalaxy([{"id": "h", "name": SERVICE_HISTORY}])
    svc = _service(galaxy)
    galaxy.gi.make_post_request = MagicMock(side_effect=RuntimeError("timed out"))

    with pytest.raises(Exception) as excinfo:
        await svc.submit_kmindex_query(_submission())
    assert not isinstance(excinfo.value, GalaxySubmitNotStarted)
    assert galaxy.gi.make_post_request.call_count == 1


@pytest.mark.asyncio
async def test_submit_response_carries_credential_identity():
    from app.models.galaxy import KmindexQuerySubmission

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(),
            credential=GalaxyCredential(kind="user", secret="t", user_sub="u1"),
        )
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._request_kmindex_job = AsyncMock(return_value="tr1")
    svc._job_for_tool_request = AsyncMock(return_value="job1")

    submission = KmindexQuerySubmission(
        sequence=">q\nACGTACGTACGTACGTACGTACGTACGTACGT",
        indexes=["GENOMIC_BCT"],
    )
    response = await svc.submit_kmindex_query(submission)

    assert response.identity == "user"
    assert response.job_id == "job1"


@pytest.mark.asyncio
async def test_a_history_failure_is_known_not_to_have_started():
    # Nothing was sent to Galaxy, so no job can exist and the partner API is
    # free to release the caller's Idempotency-Key.
    from app.services.galaxy_service import GalaxySubmitNotStarted

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="service", secret="k")
        )
    svc._get_or_create_shared_history = AsyncMock(side_effect=RuntimeError("boom"))
    svc._request_kmindex_job = AsyncMock()

    with pytest.raises(GalaxySubmitNotStarted):
        await svc.submit_kmindex_query(_submission())
    svc._request_kmindex_job.assert_not_awaited()


@pytest.mark.asyncio
async def test_no_job_after_an_accepted_request_is_ambiguous():
    # The request is queued; it may still become a job.
    from app.services.galaxy_service import GalaxySubmitNotStarted

    with patch("app.services.galaxy_service.GalaxyInstance"):
        svc = GalaxyService(
            MagicMock(), credential=GalaxyCredential(kind="service", secret="k")
        )
    svc._get_or_create_shared_history = AsyncMock(return_value="h1")
    svc._request_kmindex_job = AsyncMock(return_value="tr1")
    svc._job_for_tool_request = AsyncMock(side_effect=RuntimeError("no job yet"))

    with pytest.raises(Exception) as excinfo:
        await svc.submit_kmindex_query(_submission())
    assert not isinstance(excinfo.value, GalaxySubmitNotStarted)


@pytest.mark.asyncio
async def test_a_failed_tool_request_is_known_not_to_have_started():
    from app.services.galaxy_service import GalaxySubmitNotStarted

    galaxy = FakeGalaxy()
    galaxy.gi.make_get_request = MagicMock(
        return_value=MagicMock(
            status_code=200,
            json=MagicMock(
                return_value={
                    "jobs": [],
                    "state": "failed",
                    "state_message": {"err_msg": "bad input"},
                }
            ),
        )
    )
    svc = _service(galaxy)

    with pytest.raises(GalaxySubmitNotStarted, match="bad input"):
        await svc._job_for_tool_request("tr1")


@pytest.mark.asyncio
async def test_the_job_is_read_off_the_tool_request_once_it_exists():
    galaxy = FakeGalaxy()
    answers = iter(
        [
            {"jobs": [], "state": "new"},
            {"jobs": [{"id": "job9", "src": "job"}], "state": "submitted"},
        ]
    )
    galaxy.gi.make_get_request = MagicMock(
        side_effect=lambda url, **kw: MagicMock(
            status_code=200, json=MagicMock(return_value=next(answers))
        )
    )
    svc = _service(galaxy)

    with patch.object(galaxy_service, "KMINDEX_TOOL_REQUEST_POLL", 0):
        assert await svc._job_for_tool_request("tr1") == "job9"
    assert galaxy.gi.make_get_request.call_args.args[0].endswith("/tool_requests/tr1")


@pytest.mark.asyncio
async def test_a_tool_request_that_never_makes_a_job_gives_up():
    galaxy = FakeGalaxy()
    galaxy.gi.make_get_request = MagicMock(
        return_value=MagicMock(
            status_code=200, json=MagicMock(return_value={"jobs": [], "state": "new"})
        )
    )
    svc = _service(galaxy)

    with (
        patch.object(galaxy_service, "KMINDEX_TOOL_REQUEST_POLL", 0),
        patch.object(galaxy_service, "KMINDEX_TOOL_REQUEST_TIMEOUT", 0.05),
        pytest.raises(Exception, match="created no job"),
    ):
        await svc._job_for_tool_request("tr1")


@pytest.mark.asyncio
@pytest.mark.parametrize("use_cached", [True, False])
async def test_the_query_goes_to_galaxy_as_a_hashed_url(monkeypatch, use_cached):
    import base64
    import hashlib

    from app.core.config import get_settings
    from app.models.galaxy import KmindexQuerySubmission

    monkeypatch.setenv("KMINDEX_USE_CACHED_JOBS", "true" if use_cached else "false")
    get_settings.cache_clear()
    try:
        galaxy = FakeGalaxy()
        galaxy.gi.make_post_request = MagicMock(return_value={"tool_request_id": "tr1"})
        svc = _service(galaxy)
        sequence = ">q\nACGTACGTACGTACGTACGTACGTACGTACGT"
        submission = KmindexQuerySubmission(
            sequence=sequence, indexes=["GENOMIC_INV", "GENOMIC_BCT"]
        )

        assert await svc._request_kmindex_job(submission, "h1") == "tr1"
    finally:
        get_settings.cache_clear()

    url = galaxy.gi.make_post_request.call_args.args[0]
    payload = galaxy.gi.make_post_request.call_args.kwargs["payload"]
    assert url == "https://galaxy.example/api/jobs"
    assert payload["history_id"] == "h1"
    assert payload["use_cached_jobs"] is use_cached
    inputs = payload["inputs"]
    # Sorted, so the order a caller lists them in can't cause a cache miss.
    assert inputs["db_opts"] == {
        "db_opts_selector": "db",
        "kmindex": ["GENOMIC_BCT", "GENOMIC_INV"],
    }
    fastx = inputs["fastx"]
    assert fastx["src"] == "url"
    sent = sequence + "\n"
    assert base64.b64decode(fastx["url"].removeprefix("base64://")).decode() == sent
    assert fastx["hashes"] == [
        {
            "hash_function": "SHA-256",
            "hash_value": hashlib.sha256(sent.encode()).hexdigest(),
        }
    ]
    # The job cache also matches on the input's name.
    assert fastx["name"] == "query.fasta"
    assert inputs["threshold"] == submission.threshold
    assert inputs["zvalue"] == submission.zvalue


@pytest.mark.asyncio
async def test_pastes_that_differ_only_in_line_endings_send_the_same_bytes():
    from app.models.galaxy import KmindexQuerySubmission

    galaxy = FakeGalaxy()
    galaxy.gi.make_post_request = MagicMock(return_value={"tool_request_id": "tr1"})
    svc = _service(galaxy)
    sent = []
    for sequence, filename in [
        (">q\nACGTACGTACGTACGTACGTACGTACGTACGT", "a.fa"),
        (">q \r\nACGTACGTACGTACGTACGTACGTACGTACGT\r\n\r\n", "b.fasta"),
    ]:
        submission = KmindexQuerySubmission(
            sequence=sequence, indexes=["GENOMIC_BCT"], filename=filename
        )
        await svc._request_kmindex_job(submission, "h1")
        sent.append(galaxy.gi.make_post_request.call_args.kwargs["payload"]["inputs"])

    assert sent[0]["fastx"] == sent[1]["fastx"]
