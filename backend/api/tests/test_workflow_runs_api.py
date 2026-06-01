import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.db.crud import get_user_by_keycloak_sub, upsert_user_from_claims
from app.db.models import Base
from app.db.session import get_db_session
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


def _write_catalog(tmp_path: Path) -> None:
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))


async def _create_schema(database_url: str) -> None:
    engine = create_async_engine(database_url)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await engine.dispose()


@pytest.fixture()
def workflow_runs_client(tmp_path, monkeypatch):
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

    # Mock the agent so the workflow_runs endpoint's assistant-session
    # validation has a controllable session_service. Each test reconfigures
    # fake_session_service.get_session as needed.
    fake_session_service = MagicMock()
    fake_session_service.get_session = AsyncMock(return_value=None)
    fake_agent = MagicMock()
    fake_agent.session_service = fake_session_service

    asyncio.run(_create_schema(database_url))

    from app.db.session import get_session_factory
    from app.main import create_app

    app = create_app()
    session_factory = get_session_factory()
    current_sub = {"value": None}

    async def override_get_db_session():
        async with session_factory() as session:
            yield session

    async def override_get_current_user_db():
        if current_sub["value"] is None:
            raise AssertionError("Authenticated user requested without a current_sub")
        async with session_factory() as session:
            user = await get_user_by_keycloak_sub(session, current_sub["value"])
            if user is None:
                raise AssertionError(f"Missing test user for {current_sub['value']}")
            return user

    async def override_get_optional_current_user_db():
        if current_sub["value"] is None:
            return None
        return await override_get_current_user_db()

    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[dependencies.get_current_user_db] = (
        override_get_current_user_db
    )
    app.dependency_overrides[dependencies.get_optional_current_user_db] = (
        override_get_optional_current_user_db
    )
    app.dependency_overrides[dependencies.get_assistant_agent] = lambda: fake_agent

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
        yield client, current_sub, fake_session_service


def _make_session_state(session_id: str, owner_sub: str | None):
    from app.models.assistant import SessionState

    return SessionState(session_id=session_id, owner_keycloak_sub=owner_sub)


def test_workflow_run_creation_allows_anonymous_tracking(workflow_runs_client):
    client, current_sub, _session_service = workflow_runs_client
    current_sub["value"] = None

    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "galaxy_instance_url": "https://usegalaxy.org",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc123",
            "assembly_accession": "GCF_000001405.40",
            "launch_source": "site",
            "parameters": {"read_runs_single": ["SRR000001"]},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["launch_source"] == "site"
    assert body["assistant_session_id"] is None
    assert body["status"] == "handoff_created"


def test_workflow_runs_are_scoped_to_current_user(workflow_runs_client):
    client, current_sub, _session_service = workflow_runs_client

    current_sub["value"] = "user-a"
    create_response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/varcall-haploid/main",
            "galaxy_instance_url": "https://usegalaxy.org",
            "handoff_url": "https://usegalaxy.org/workflow_landings/user-a",
            "assembly_accession": "GCF_000001405.40",
            "launch_source": "site",
            "parameters": {"reference_assembly": "GCF_000001405.40"},
        },
    )
    assert create_response.status_code == 200

    current_sub["value"] = "user-b"
    list_response = client.get("/api/v1/workflow_runs")

    assert list_response.status_code == 200
    assert list_response.json() == []


def test_workflow_run_rejects_unknown_assistant_session(workflow_runs_client):
    client, current_sub, session_service = workflow_runs_client
    current_sub["value"] = "user-a"
    session_service.get_session = AsyncMock(return_value=None)

    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "galaxy_instance_url": "https://usegalaxy.org",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc",
            "assembly_accession": "GCF_000001405.40",
            "launch_source": "assistant",
            "assistant_session_id": "no-such-session",
            "parameters": {},
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Assistant session not found"


def test_workflow_run_rejects_session_owned_by_other_user(workflow_runs_client):
    client, current_sub, session_service = workflow_runs_client
    current_sub["value"] = "user-b"
    session_service.get_session = AsyncMock(
        return_value=_make_session_state("session-x", owner_sub="user-a")
    )

    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "galaxy_instance_url": "https://usegalaxy.org",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc",
            "assembly_accession": "GCF_000001405.40",
            "launch_source": "assistant",
            "assistant_session_id": "session-x",
            "parameters": {},
        },
    )

    assert response.status_code == 403
    assert "another user" in response.json()["detail"]


def test_workflow_run_rejects_oversized_parameters(workflow_runs_client):
    """An unauthenticated client can POST workflow runs, so we cap the
    parameters dict to keep one request from forcing a huge JSON parse +
    DB write."""
    client, _current_sub, _session_service = workflow_runs_client
    # ~100KB of junk inside parameters; cap is 64KB.
    blob = "x" * (100 * 1024)
    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc",
            "launch_source": "site",
            "parameters": {"blob": blob},
        },
    )
    assert response.status_code == 413


def test_workflow_run_accepts_anonymous_assistant_session(workflow_runs_client):
    client, current_sub, session_service = workflow_runs_client
    current_sub["value"] = "user-a"
    # Anonymous assistant session (owner_keycloak_sub is None) is allowed
    # to be claimed by any authenticated user -- mirrors the chat flow
    # where an unauth user starts a session, then logs in mid-conversation.
    session_service.get_session = AsyncMock(
        return_value=_make_session_state("session-anon", owner_sub=None)
    )

    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "galaxy_instance_url": "https://usegalaxy.org",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc",
            "assembly_accession": "GCF_000001405.40",
            "launch_source": "assistant",
            "assistant_session_id": "session-anon",
            "parameters": {},
        },
    )

    assert response.status_code == 200
    assert response.json()["assistant_session_id"] == "session-anon"


def test_workflow_run_corrects_mislabeled_launch_source(workflow_runs_client):
    # A hand-crafted request claims launch_source="assistant" but sends no
    # assistant_session_id. The server derives launch_source from the (absent)
    # session, so it's stored as "site" instead of polluting assistant analytics.
    client, current_sub, _session_service = workflow_runs_client
    current_sub["value"] = None

    response = client.post(
        "/api/v1/workflow_runs",
        json={
            "workflow_trs_id": "#workflow/github.com/iwc/rnaseq-pe/main",
            "handoff_url": "https://usegalaxy.org/workflow_landings/abc",
            "launch_source": "assistant",
            "parameters": {},
        },
    )

    assert response.status_code == 200
    assert response.json()["launch_source"] == "site"
