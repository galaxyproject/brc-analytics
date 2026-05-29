import asyncio
import json
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
    create_saved_analysis,
    get_user_by_keycloak_sub,
    upsert_favorite,
    upsert_user_from_claims,
)
from app.db.models import Base, User
from app.db.session import get_db_session
from app.models.assistant import AnalysisSchema, ChatMessage, MessageRole, SessionState
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


class FakeAssistantAgent:
    def __init__(self):
        self.session_service = FakeSessionService()

    async def restore_saved_session(
        self,
        *,
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
    fake_cache.flush_all = AsyncMock()
    fake_cache.close = AsyncMock()
    fake_auth = MagicMock()
    fake_auth.close = AsyncMock()
    fake_llm = MagicMock()

    get_cache_service = MagicMock(return_value=fake_cache)
    get_cache_service.cache_clear = MagicMock()
    get_auth_service = MagicMock(return_value=fake_auth)
    get_auth_service.cache_clear = MagicMock()
    get_llm_service = MagicMock(return_value=fake_llm)
    get_llm_service.cache_clear = MagicMock()

    monkeypatch.setattr(dependencies, "get_cache_service", get_cache_service)
    monkeypatch.setattr(dependencies, "get_auth_service", get_auth_service)
    monkeypatch.setattr(dependencies, "get_llm_service", get_llm_service)

    asyncio.run(_create_schema(database_url))

    from app.db.session import get_session_factory
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

    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[dependencies.get_current_user_db] = (
        override_get_current_user_db
    )
    app.dependency_overrides[dependencies.get_assistant_agent] = lambda: agent

    yield app, session_factory, current_sub, agent


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
            saved_analysis = await create_saved_analysis(
                session,
                user_a,
                title="User A analysis",
                schema=AnalysisSchema().model_dump(mode="json"),
                messages=[
                    ChatMessage(
                        role=MessageRole.USER, content="analyze plasmodium"
                    ).model_dump(mode="json")
                ],
                source_session="session-a",
            )
            return str(saved_analysis.id)

    saved_analysis_id = asyncio.run(seed_saved_analysis())

    current_sub["value"] = "user-b"

    detail_response = client.get(f"/api/v1/saved_analyses/{saved_analysis_id}")
    restore_response = client.post(
        f"/api/v1/saved_analyses/{saved_analysis_id}/restore"
    )
    delete_response = client.delete(f"/api/v1/saved_analyses/{saved_analysis_id}")

    assert detail_response.status_code == 404
    assert restore_response.status_code == 404
    assert delete_response.status_code == 404


def test_saved_analysis_snapshot_rejects_cross_user_session(persistence_client):
    client, _session_factory, current_sub, agent = persistence_client

    agent.session_service.sessions["session-user-a"] = SessionState(
        session_id="session-user-a",
        owner_keycloak_sub="user-a",
        messages=[ChatMessage(role=MessageRole.USER, content="save me")],
        schema_state=AnalysisSchema(),
    )

    current_sub["value"] = "user-b"
    response = client.post(
        "/api/v1/saved_analyses",
        json={"session_id": "session-user-a"},
    )

    assert response.status_code == 403


def test_saved_analysis_snapshot_claims_anonymous_session(persistence_client):
    """An authenticated user can save an anonymous session they started.

    Mirrors the chat flow where someone starts a session logged out, then
    signs in before saving. The save endpoint claims the session for them.
    """
    client, _session_factory, current_sub, agent = persistence_client

    agent.session_service.sessions["session-anon"] = SessionState(
        session_id="session-anon",
        owner_keycloak_sub=None,
        messages=[ChatMessage(role=MessageRole.USER, content="hello")],
        schema_state=AnalysisSchema(),
    )

    current_sub["value"] = "user-a"
    response = client.post(
        "/api/v1/saved_analyses",
        json={"session_id": "session-anon"},
    )

    assert response.status_code == 200
    # Session should now be owned by user-a.
    assert agent.session_service.sessions["session-anon"].owner_keycloak_sub == "user-a"


def test_preferences_payload_is_bounded(persistence_client):
    client, _session_factory, current_sub, _agent = persistence_client

    current_sub["value"] = "user-a"
    response = client.put(
        "/api/v1/user/preferences",
        json={"blob": "x" * (20 * 1024)},
    )

    assert response.status_code == 413


def test_saved_analysis_snapshot_enforces_session_cookie_when_secret_set(
    persistence_client, monkeypatch
):
    """With SESSION_COOKIE_SECRET configured, saving an anonymous session
    requires a valid signed cookie -- knowing the session_id is not enough.

    The companion test (test_saved_analysis_snapshot_claims_anonymous_session)
    succeeds cookieless only because its fixture leaves the secret unset; this
    one pins the gate so it can't be silently dropped from the save endpoint.
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

    # No cookie -> rejected, session stays anonymous (gate runs before claim).
    missing = client.post("/api/v1/saved_analyses", json={"session_id": "session-anon"})
    assert missing.status_code == 403
    assert agent.session_service.sessions["session-anon"].owner_keycloak_sub is None

    # Wrong signature -> rejected.
    client.cookies.set(SESSION_COOKIE_NAME, "not-a-valid-signature")
    wrong = client.post("/api/v1/saved_analyses", json={"session_id": "session-anon"})
    assert wrong.status_code == 403
    client.cookies.clear()

    # Valid signed cookie -> the session is claimed and saved.
    client.cookies.set(SESSION_COOKIE_NAME, sign_session_id("session-anon", secret))
    ok = client.post("/api/v1/saved_analyses", json={"session_id": "session-anon"})
    assert ok.status_code == 200
    assert agent.session_service.sessions["session-anon"].owner_keycloak_sub == "user-a"


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
