import asyncio
import json
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import SESSION_COOKIE_NAME, get_settings
from app.core.session_signing import sign_session_id
from app.db.crud import (
    get_user_by_keycloak_sub,
    repoint_saved_analysis_session,
    upsert_favorite,
    upsert_saved_analysis,
    upsert_user_from_claims,
)
from app.db.models import Base, User
from app.db.session import get_db_session
from app.models.assistant import (
    AnalysisSchema,
    ChatMessage,
    ChatResponse,
    MessageRole,
    SessionState,
    TurnTelemetry,
)
from app.models.user_data import UserMeResponse
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


class FakeSessionService:
    def __init__(self):
        self.sessions: dict[str, SessionState] = {}
        self.get_session_calls = 0

    async def require_session(
        self, session_id: str, owner_keycloak_sub: str | None
    ) -> SessionState:
        state = self.sessions.get(session_id)
        if state is None:
            raise KeyError(session_id)
        if state.owner_keycloak_sub != owner_keycloak_sub:
            raise PermissionError(session_id)
        return state

    async def claim_session(
        self, session_id: str, owner_keycloak_sub: str
    ) -> SessionState:
        state = self.sessions.get(session_id)
        if state is None:
            raise KeyError(session_id)
        if state.owner_keycloak_sub is None:
            state.owner_keycloak_sub = owner_keycloak_sub
        elif state.owner_keycloak_sub != owner_keycloak_sub:
            raise PermissionError(session_id)
        return state

    async def get_session(self, session_id: str) -> SessionState | None:
        self.get_session_calls += 1
        return self.sessions.get(session_id)

    async def save_session(self, state: SessionState) -> None:
        self.sessions[state.session_id] = state


class FakeAssistantAgent:
    def __init__(self):
        self.session_service = FakeSessionService()

    def is_available(self) -> bool:
        return True

    # The three the restore endpoint calls to re-derive state from the stored
    # schema. Nothing here is testing that derivation, so they pass it through.
    def reconcile_schema(self, schema_state: AnalysisSchema) -> AnalysisSchema:
        return schema_state

    def _derive_suggestions(self, schema_state: AnalysisSchema) -> list:
        return []

    def compute_handoff(self, schema_state, *, session_id: str):
        return False, None

    async def chat_with_telemetry(
        self,
        message: str,
        session_id: str | None,
        owner_keycloak_sub: str | None,
        *,
        turn_id=None,
        on_turn=None,
    ) -> tuple[ChatResponse, TurnTelemetry, SessionState]:
        """Stub a turn, handing back the state auto-save writes from."""
        state = self.session_service.sessions.get(session_id or "")
        if state is None:
            state = SessionState(session_id=uuid4().hex)
        if owner_keycloak_sub is not None:
            state.owner_keycloak_sub = owner_keycloak_sub
        state.messages.append(ChatMessage(role=MessageRole.USER, content=message))
        state.messages.append(ChatMessage(role=MessageRole.ASSISTANT, content="ok"))
        await self.session_service.save_session(state)
        return (
            ChatResponse(
                reply="ok",
                schema_state=state.schema_state,
                session_id=state.session_id,
            ),
            TurnTelemetry(session_id=state.session_id, user_message=message),
            state,
        )

    async def restore_saved_session(
        self,
        *,
        agent_message_history: list | None = None,
        owner_keycloak_sub: str,
        saved_analysis_id: str,
        schema_state: AnalysisSchema,
        messages: list[ChatMessage],
    ) -> SessionState:
        session_id = uuid4().hex
        state = SessionState(
            session_id=session_id,
            owner_keycloak_sub=owner_keycloak_sub,
            saved_analysis_id=saved_analysis_id,
            schema_state=schema_state,
            messages=messages,
            agent_message_history=agent_message_history or [],
        )
        self.session_service.sessions[session_id] = state
        return state


def _write_catalog(tmp_path: Path) -> None:
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))


async def _create_schema(database_url: str) -> None:
    engine = create_async_engine(database_url)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await engine.dispose()


@pytest.fixture()
def persistence_app(tmp_path, monkeypatch):
    _write_catalog(tmp_path)
    database_url = f"sqlite+aiosqlite:///{tmp_path / 'app.db'}"

    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("DATABASE_URL", database_url)

    from app.core import dependencies

    get_settings.cache_clear()
    dependencies.reset_all_services()

    fake_cache = MagicMock()
    fake_cache.clear_caches = AsyncMock(return_value=0)
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()

    get_cache_service = MagicMock(return_value=fake_cache)
    get_cache_service.cache_clear = MagicMock()
    get_auth_service = MagicMock(return_value=fake_auth)
    get_auth_service.cache_clear = MagicMock()

    monkeypatch.setattr(dependencies, "get_cache_service", get_cache_service)
    monkeypatch.setattr(dependencies, "get_auth_service", get_auth_service)

    asyncio.run(_create_schema(database_url))

    from app.db.session import close_db, get_session_factory
    from app.main import create_app

    app = create_app()
    session_factory = get_session_factory()
    current_sub = {"value": "user-a"}
    agent = FakeAssistantAgent()

    async def override_get_db_session():
        async with session_factory() as session:
            yield session

    async def override_get_current_user_db():
        async with session_factory() as session:
            user = await get_user_by_keycloak_sub(session, current_sub["value"])
            if user is None:
                raise AssertionError(f"Missing test user for {current_sub['value']}")
            return user

    async def override_get_optional_current_user():
        return UserMeResponse(sub=current_sub["value"])

    async def override_check_rate_limit():
        return {"limit": 100, "remaining": 100, "reset": 60}

    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[dependencies.get_current_user_db] = (
        override_get_current_user_db
    )
    app.dependency_overrides[dependencies.get_optional_current_user] = (
        override_get_optional_current_user
    )
    app.dependency_overrides[dependencies.check_rate_limit] = override_check_rate_limit
    app.dependency_overrides[dependencies.get_assistant_agent] = lambda: agent

    yield app, session_factory, current_sub, agent

    # Dispose the global engine the fixture created. Client-based tests get
    # this via the app lifespan shutdown, but persistence_app used directly
    # (e.g. the concurrent-insert race test) would otherwise leak the cached
    # engine/session factory into the next test.
    asyncio.run(close_db())


@pytest.fixture()
def persistence_client(persistence_app):
    app, session_factory, current_sub, agent = persistence_app

    async def seed_users() -> None:
        async with session_factory() as session:
            await upsert_user_from_claims(
                session,
                {"sub": "user-a", "email": "a@example.com", "name": "User A"},
            )
            await upsert_user_from_claims(
                session,
                {"sub": "user-b", "email": "b@example.com", "name": "User B"},
            )

    asyncio.run(seed_users())

    with TestClient(app) as client:
        yield client, session_factory, current_sub, agent


def test_favorites_are_scoped_to_current_user(persistence_client):
    client, session_factory, current_sub, _agent = persistence_client

    async def seed_favorite() -> None:
        async with session_factory() as session:
            user_a = await get_user_by_keycloak_sub(session, "user-a")
            assert user_a is not None
            await upsert_favorite(session, user_a, "assembly", "GCF_000001405.40")

    asyncio.run(seed_favorite())

    current_sub["value"] = "user-b"
    response = client.get("/api/v1/favorites")

    assert response.status_code == 200
    assert response.json() == []

    delete_response = client.delete("/api/v1/favorites/assembly/GCF_000001405.40")
    assert delete_response.status_code == 404


def test_saved_analyses_are_scoped_to_current_user(persistence_client):
    client, session_factory, current_sub, _agent = persistence_client

    async def seed_saved_analysis() -> str:
        async with session_factory() as session:
            user_a = await get_user_by_keycloak_sub(session, "user-a")
            assert user_a is not None
            saved_analysis = await upsert_saved_analysis(
                session,
                user_a.id,
                agent_message_history=[],
                messages=[
                    ChatMessage(
                        role=MessageRole.USER, content="analyze plasmodium"
                    ).model_dump(mode="json")
                ],
                schema=AnalysisSchema().model_dump(mode="json"),
                source_session="session-a",
                title="User A analysis",
            )
            return str(saved_analysis.id)

    saved_analysis_id = asyncio.run(seed_saved_analysis())

    current_sub["value"] = "user-b"

    detail_response = client.get(f"/api/v1/saved_analyses/{saved_analysis_id}")
    open_response = client.post(f"/api/v1/saved_analyses/{saved_analysis_id}/open")
    delete_response = client.delete(f"/api/v1/saved_analyses/{saved_analysis_id}")

    assert detail_response.status_code == 404
    assert open_response.status_code == 404
    assert delete_response.status_code == 404


def test_preferences_payload_is_bounded(persistence_client):
    client, _session_factory, current_sub, _agent = persistence_client

    current_sub["value"] = "user-a"
    response = client.put(
        "/api/v1/user/preferences",
        json={"blob": "x" * (20 * 1024)},
    )

    assert response.status_code == 413


def test_upsert_user_recovers_from_concurrent_insert_race(persistence_app, monkeypatch):
    """A second concurrent first-login for the same sub must not 500.

    Two OIDC callbacks for a brand-new user can both miss the SELECT and
    both INSERT; the loser trips the unique keycloak_sub constraint. The
    upsert must recover (rollback, refetch, apply claims) the way
    upsert_favorite does, instead of letting the IntegrityError surface.
    """
    _app, session_factory, _current_sub, _agent = persistence_app

    from app.db import crud

    real_lookup = crud.get_user_by_keycloak_sub
    lookup_calls = {"count": 0}

    async def lookup_missing_first(session, keycloak_sub):
        # Simulate losing the race: the first SELECT runs before the other
        # transaction commits, so it sees no existing row.
        lookup_calls["count"] += 1
        if lookup_calls["count"] == 1:
            return None
        return await real_lookup(session, keycloak_sub)

    async def scenario() -> None:
        # First login lands the row normally (real lookup, not patched yet).
        async with session_factory() as session:
            await upsert_user_from_claims(
                session,
                {"sub": "racer", "email": "racer@example.com", "name": "Racer"},
            )

        # Second concurrent login: forced SELECT-miss -> INSERT -> row already
        # exists -> IntegrityError -> must recover instead of raising.
        monkeypatch.setattr(crud, "get_user_by_keycloak_sub", lookup_missing_first)
        async with session_factory() as session:
            user = await upsert_user_from_claims(
                session,
                {"sub": "racer", "email": "updated@example.com", "name": "Racer Two"},
            )
        assert user is not None
        assert user.keycloak_sub == "racer"

        # Exactly one row, and the recovering call applied its field updates.
        monkeypatch.setattr(crud, "get_user_by_keycloak_sub", real_lookup)
        async with session_factory() as session:
            rows = await session.execute(
                select(User).where(User.keycloak_sub == "racer")
            )
            users = list(rows.scalars().all())
        assert len(users) == 1
        assert users[0].email == "updated@example.com"

    asyncio.run(scenario())


def test_favorites_returns_every_entity_type_by_default(persistence_client):
    """The workspace lists both types, so one call must return both."""
    client, _session_factory, _current_sub, _agent = persistence_client
    client.post(
        "/api/v1/favorites",
        json={"entity_id": "GCF_000001405.40", "entity_type": "assembly"},
    )
    client.post(
        "/api/v1/favorites",
        json={"entity_id": "5833", "entity_type": "organism"},
    )

    listed = client.get("/api/v1/favorites").json()

    assert {favorite["entity_type"] for favorite in listed} == {
        "assembly",
        "organism",
    }


def test_favorites_still_filters_when_asked(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client
    client.post(
        "/api/v1/favorites",
        json={"entity_id": "GCF_000001405.40", "entity_type": "assembly"},
    )
    client.post(
        "/api/v1/favorites",
        json={"entity_id": "5833", "entity_type": "organism"},
    )

    listed = client.get("/api/v1/favorites", params={"entity_type": "organism"}).json()

    assert len(listed) == 1
    assert listed[0]["entity_id"] == "5833"


def test_chat_autosaves_for_an_authenticated_user(persistence_client):
    """A turn by a signed-in user persists the conversation with no Save call."""
    client, _session_factory, _current_sub, _agent = persistence_client

    response = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    assert response.status_code == 200, response.text

    listed = client.get("/api/v1/saved_analyses")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_repeated_turns_do_not_duplicate_the_analysis(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client

    first = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = first.json()["session_id"]
    client.post(
        "/api/v1/assistant/chat",
        json={"message": "and again", "session_id": session_id},
    )

    listed = client.get("/api/v1/saved_analyses")
    assert len(listed.json()) == 1


def test_anonymous_turns_are_not_persisted(persistence_client):
    """No owner means no row -- there is nobody to file it under yet."""
    client, _session_factory, _current_sub, _agent = persistence_client

    from app.core import dependencies

    client.app.dependency_overrides[dependencies.get_optional_current_user] = (
        lambda: None
    )
    try:
        client.post("/api/v1/assistant/chat", json={"message": "hello"})
    finally:
        client.app.dependency_overrides.pop(dependencies.get_optional_current_user)

    assert client.get("/api/v1/saved_analyses").json() == []


def test_manual_save_endpoint_is_gone(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client

    response = client.post("/api/v1/saved_analyses", json={"session_id": "x"})

    assert response.status_code == 405


def test_open_reuses_the_live_session(persistence_client):
    """Minting a second session for a conversation that already has a live one
    strands whoever still holds the first -- their next turn would find no row
    for it and start a second copy of the analysis."""
    client, _session_factory, _current_sub, _agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]

    opened = client.post(f"/api/v1/saved_analyses/{analysis_id}/open")
    assert opened.status_code == 200, opened.text
    assert opened.json()["session_id"] == session_id

    listed = client.get("/api/v1/saved_analyses").json()
    assert len(listed) == 1
    assert listed[0]["source_session"] == session_id


def test_autosave_carries_the_analysis_id_onto_the_session(persistence_client):
    """The session id is a mutable pointer; the analysis id is the durable one.

    A session that does not know its own analysis cannot answer "am I already
    saved?" on restore, which leaves the client saving it again every mount to
    find out.
    """
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]

    assert agent.session_service.sessions[session_id].saved_analysis_id == analysis_id


def test_open_carries_the_analysis_id_onto_the_live_session(persistence_client):
    """A session saved before the stamp existed still doesn't know its own
    analysis id, so opening it has to teach it -- otherwise a later reopen
    elsewhere orphans the row."""
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]
    agent.session_service.sessions[session_id].saved_analysis_id = None

    client.post(f"/api/v1/saved_analyses/{analysis_id}/open")

    assert agent.session_service.sessions[session_id].saved_analysis_id == analysis_id


def test_open_repoints_the_analysis_when_the_session_expired(persistence_client):
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]
    # Two-hour TTL elapses; the conversation outlives its session.
    del agent.session_service.sessions[chat.json()["session_id"]]

    opened = client.post(f"/api/v1/saved_analyses/{analysis_id}/open")
    assert opened.status_code == 200, opened.text
    new_session_id = opened.json()["session_id"]
    assert new_session_id != chat.json()["session_id"]

    listed = client.get("/api/v1/saved_analyses").json()
    assert len(listed) == 1
    assert listed[0]["id"] == analysis_id
    assert listed[0]["source_session"] == new_session_id


def test_a_second_device_opening_does_not_split_the_analysis(persistence_client):
    """The row can only point at one live session. A device still holding the
    other one must land back on the same row rather than starting a rival copy
    of the conversation."""
    client, session_factory, _current_sub, _agent = persistence_client

    client.post("/api/v1/assistant/chat", json={"message": "hello"})
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]
    device_a = client.post(f"/api/v1/saved_analyses/{analysis_id}/open").json()[
        "session_id"
    ]

    # Device B opens the same analysis and the row follows it. Forced directly:
    # the reuse above deliberately hands both devices the one live session, so
    # the split state is only reachable when B minted a session of its own.
    asyncio.run(
        _repoint_analysis(session_factory, analysis_id, "session-held-by-device-b")
    )

    client.post(
        "/api/v1/assistant/chat",
        json={"message": "still here", "session_id": device_a},
    )

    listed = client.get("/api/v1/saved_analyses").json()
    assert len(listed) == 1
    assert listed[0]["id"] == analysis_id


async def _repoint_analysis(session_factory, analysis_id: str, source_session: str):
    async with session_factory() as session:
        user = await get_user_by_keycloak_sub(session, "user-a")
        await repoint_saved_analysis_session(session, user, analysis_id, source_session)


@contextmanager
def _signed_out(client):
    """Run a block with nobody signed in, then put the test user back.

    Restores the fixture's override rather than popping the key -- popping
    falls through to the real cookie-reading dependency, and every
    authenticated call after the block 401s.
    """
    from app.core import dependencies

    overrides = client.app.dependency_overrides
    previous = overrides[dependencies.get_optional_current_user]
    overrides[dependencies.get_optional_current_user] = lambda: None
    try:
        yield
    finally:
        overrides[dependencies.get_optional_current_user] = previous


def test_chat_reports_whether_the_turn_was_saved(persistence_client):
    """The UI says "Saved to your account" on this flag, so it has to mean it."""
    client, _session_factory, _current_sub, _agent = persistence_client

    authenticated = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    assert authenticated.json()["saved"] is True

    with _signed_out(client):
        anonymous = client.post("/api/v1/assistant/chat", json={"message": "hello"})

    assert anonymous.json()["saved"] is False


def test_signing_in_saves_the_conversation_without_another_turn(persistence_client):
    """We offer to keep an anonymous conversation if the user signs in. Auto-save
    rides on chat turns, so without this endpoint that promise waits on a turn
    the user may never send -- and the session dies with its Redis TTL."""
    client, _session_factory, _current_sub, _agent = persistence_client

    with _signed_out(client):
        anonymous = client.post("/api/v1/assistant/chat", json={"message": "hello"})

    session_id = anonymous.json()["session_id"]
    assert client.get("/api/v1/saved_analyses").json() == []

    saved = client.post(f"/api/v1/assistant/session/{session_id}/save")
    assert saved.status_code == 200, saved.text

    listed = client.get("/api/v1/saved_analyses").json()
    assert len(listed) == 1
    assert saved.json()["saved_analysis_id"] == listed[0]["id"]


def test_restore_reports_whether_the_conversation_is_already_saved(
    persistence_client,
):
    """Otherwise the client has to save it again to find out -- on every mount
    of every signed-in session, against a deployment that may have no database
    to save to."""
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]

    saved = client.get(f"/api/v1/assistant/session/{session_id}")
    assert saved.json()["saved"] is True

    unsaved_id = uuid4().hex
    agent.session_service.sessions[unsaved_id] = SessionState(
        session_id=unsaved_id,
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
    )

    unsaved = client.get(f"/api/v1/assistant/session/{unsaved_id}")
    assert unsaved.json()["saved"] is False


def test_autosave_writes_from_the_turn_rather_than_rereading_redis(
    persistence_client,
):
    """The agent hands back the state it just stored. Re-reading it here was a
    third Redis round trip and a full re-validation of the message history on
    every signed-in turn."""
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})

    assert chat.json()["saved"] is True
    assert agent.session_service.get_session_calls == 0


def test_saving_twice_keeps_one_analysis(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]

    client.post(f"/api/v1/assistant/session/{session_id}/save")
    client.post(f"/api/v1/assistant/session/{session_id}/save")

    assert len(client.get("/api/v1/saved_analyses").json()) == 1


def test_saving_enforces_the_session_cookie_when_secret_set(
    persistence_client, monkeypatch
):
    """With SESSION_COOKIE_SECRET configured, saving an anonymous session
    requires a valid signed cookie -- knowing the session_id is not enough.

    The other save tests here succeed cookieless only because the fixture
    leaves the secret unset; this one pins the gate so it cannot be silently
    dropped. Without it, any authenticated user who learns an anonymous
    session id could claim and persist someone else's conversation.
    """
    client, _session_factory, current_sub, agent = persistence_client

    secret = "test-cookie-secret"
    monkeypatch.setenv("SESSION_COOKIE_SECRET", secret)
    get_settings.cache_clear()

    agent.session_service.sessions["session-anon"] = SessionState(
        session_id="session-anon",
        owner_keycloak_sub=None,
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
        schema_state=AnalysisSchema(),
    )
    current_sub["value"] = "user-a"
    save_url = "/api/v1/assistant/session/session-anon/save"

    # No cookie -> rejected, session stays anonymous (gate runs before claim).
    missing = client.post(save_url)
    assert missing.status_code == 403
    assert agent.session_service.sessions["session-anon"].owner_keycloak_sub is None

    # Wrong signature -> rejected.
    client.cookies.set(SESSION_COOKIE_NAME, "not-a-valid-signature")
    wrong = client.post(save_url)
    assert wrong.status_code == 403
    client.cookies.clear()

    # Valid signed cookie -> the session is claimed and saved.
    client.cookies.set(SESSION_COOKIE_NAME, sign_session_id("session-anon", secret))
    ok = client.post(save_url)
    assert ok.status_code == 200, ok.text
    assert agent.session_service.sessions["session-anon"].owner_keycloak_sub == "user-a"
    assert len(client.get("/api/v1/saved_analyses").json()) == 1


def test_saving_an_empty_session_is_not_reported_as_saved(persistence_client):
    """Better a refusal than a "saved" the account page contradicts."""
    client, _session_factory, _current_sub, agent = persistence_client

    session_id = uuid4().hex
    agent.session_service.sessions[session_id] = SessionState(session_id=session_id)

    response = client.post(f"/api/v1/assistant/session/{session_id}/save")

    assert response.status_code == 409
    assert client.get("/api/v1/saved_analyses").json() == []


def test_saving_without_a_user_row_is_not_reported_as_nothing_to_save(
    persistence_client,
):
    """Both used to return None from persist() and land on 409 "Nothing to
    save yet" -- which reads as "your conversation is empty" to a user whose
    account row is simply gone."""
    client, _session_factory, current_sub, agent = persistence_client

    session_id = uuid4().hex
    agent.session_service.sessions[session_id] = SessionState(
        session_id=session_id,
        owner_keycloak_sub="user-gone",
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
    )
    # Authenticated as the session's own owner -- the JWT is valid, the users
    # row it names is not there.
    current_sub["value"] = "user-gone"

    response = client.post(f"/api/v1/assistant/session/{session_id}/save")

    assert response.status_code == 503
    assert "not provisioned" in response.json()["detail"]


def test_saving_an_expired_session_is_a_404(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client

    response = client.post(f"/api/v1/assistant/session/{uuid4().hex}/save")

    assert response.status_code == 404


def test_saving_another_users_session_is_refused(persistence_client):
    client, _session_factory, _current_sub, agent = persistence_client

    session_id = uuid4().hex
    agent.session_service.sessions[session_id] = SessionState(
        session_id=session_id,
        owner_keycloak_sub="user-b",
        messages=[ChatMessage(role=MessageRole.USER, content="theirs")],
    )

    response = client.post(f"/api/v1/assistant/session/{session_id}/save")

    assert response.status_code == 403
    assert client.get("/api/v1/saved_analyses").json() == []


def test_open_rehydrates_the_agent_history(persistence_client):
    """A resumed conversation keeps its tool calls, or it re-derives them."""
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]
    agent.session_service.sessions[session_id].agent_message_history = [
        {"kind": "request"}
    ]
    client.post(
        "/api/v1/assistant/chat",
        json={"message": "and again", "session_id": session_id},
    )
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]

    opened = client.post(f"/api/v1/saved_analyses/{analysis_id}/open")

    restored = agent.session_service.sessions[opened.json()["session_id"]]
    assert restored.agent_message_history == [{"kind": "request"}]


def test_a_session_read_failure_does_not_cost_the_reply(persistence_client):
    """get_session reads Redis strictly and raises on a blip -- the turn has
    already succeeded by then, so it must not become a 500."""
    client, _session_factory, _current_sub, agent = persistence_client

    async def unavailable(session_id: str):
        raise RuntimeError("redis is down")

    agent.session_service.get_session = unavailable

    response = client.post("/api/v1/assistant/chat", json={"message": "hello"})

    assert response.status_code == 200, response.text
    assert response.json()["reply"] == "ok"


def test_detail_does_not_ship_the_agent_transcript(persistence_client):
    """The raw pydantic-ai history is server-side only -- nothing reads it in
    the browser and it carries every tool call and return."""
    client, _session_factory, _current_sub, agent = persistence_client

    chat = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    session_id = chat.json()["session_id"]
    agent.session_service.sessions[session_id].agent_message_history = [
        {"kind": "request"}
    ]
    client.post(
        "/api/v1/assistant/chat",
        json={"message": "and again", "session_id": session_id},
    )
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]

    detail = client.get(f"/api/v1/saved_analyses/{analysis_id}")

    assert detail.status_code == 200, detail.text
    assert "agent_message_history" not in detail.json()
