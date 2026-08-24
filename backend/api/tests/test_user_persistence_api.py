import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.crud import (
    get_user_by_keycloak_sub,
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
        return self.sessions.get(session_id)

    async def save_session(self, state: SessionState) -> None:
        self.sessions[state.session_id] = state


class FakeAssistantAgent:
    def __init__(self):
        self.session_service = FakeSessionService()

    def is_available(self) -> bool:
        return True

    async def chat_with_telemetry(
        self,
        message: str,
        session_id: str | None,
        owner_keycloak_sub: str | None,
        *,
        turn_id=None,
        on_turn=None,
    ) -> tuple[ChatResponse, TurnTelemetry]:
        """Stub a turn, leaving behind the session state auto-save reads back."""
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
        )

    async def restore_saved_session(
        self,
        *,
        agent_message_history: list | None = None,
        owner_keycloak_sub: str,
        schema_state: AnalysisSchema,
        messages: list[ChatMessage],
    ) -> SessionState:
        session_id = uuid4().hex
        state = SessionState(
            session_id=session_id,
            owner_keycloak_sub=owner_keycloak_sub,
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
                user_a,
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


def test_open_repoints_the_analysis_at_the_new_session(persistence_client):
    client, _session_factory, _current_sub, _agent = persistence_client

    client.post("/api/v1/assistant/chat", json={"message": "hello"})
    analysis_id = client.get("/api/v1/saved_analyses").json()[0]["id"]

    opened = client.post(f"/api/v1/saved_analyses/{analysis_id}/open")
    assert opened.status_code == 200, opened.text
    new_session_id = opened.json()["session_id"]

    listed = client.get("/api/v1/saved_analyses").json()
    assert len(listed) == 1
    assert listed[0]["id"] == analysis_id
    assert listed[0]["source_session"] == new_session_id


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
