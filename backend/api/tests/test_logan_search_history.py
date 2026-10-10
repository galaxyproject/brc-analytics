"""GET /api/v1/user/logan_searches: a signed-in user's own searches, newest first.

The rows are the kmindex_submissions analytics table, so the properties that
matter are whose rows come back, in what order, and that a server without a
database says so plainly instead of 500ing.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1 import user as user_routes
from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.db.crud import create_kmindex_submission, upsert_user_from_claims
from app.db.models import Base
from app.models.user_data import UserMeResponse
from tests.test_galaxy_submit_ownership import app_client  # noqa: F401

BASE_TIME = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)


async def _seed(factory) -> None:
    async with factory() as session:
        alice = await upsert_user_from_claims(
            session, {"sub": "alice", "email": "a@example.org"}
        )
        bob = await upsert_user_from_claims(
            session, {"sub": "bob", "email": "b@example.org"}
        )
        for i in range(5):
            row = await create_kmindex_submission(
                session,
                galaxy_job_id=f"alice{i:011d}",
                identity="user",
                indexes=["GENOMIC_INV", f"IDX_{i}"],
                query_bases=500 + i,
                source="native",
                threshold=0.5,
                user_id=alice.id,
                zvalue=6,
            )
            row.created_at = BASE_TIME + timedelta(minutes=i)
        await create_kmindex_submission(
            session,
            galaxy_job_id="bob0000000000000",
            identity="user",
            indexes=["GENOMIC_BCT"],
            query_bases=100,
            source="native",
            threshold=0.75,
            user_id=bob.id,
            zvalue=6,
        )
        # Anonymous: nobody's history.
        await create_kmindex_submission(
            session,
            galaxy_job_id="anon000000000000",
            identity="service",
            indexes=["GENOMIC_BCT"],
            query_bases=100,
            source="native",
            threshold=0.5,
            zvalue=6,
        )
        await session.commit()


@pytest.fixture()
def history_client(app_client, monkeypatch, tmp_path):  # noqa: F811
    app, client = app_client
    database_url = f"sqlite+aiosqlite:///{tmp_path / 'history.db'}"
    engine = create_async_engine(database_url)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def create() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await _seed(factory)

    asyncio.run(create())

    @asynccontextmanager
    async def fake_db_session():
        async with factory() as session:
            yield session

    monkeypatch.setattr(user_routes, "db_session", fake_db_session)
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()

    current = {"sub": "alice"}
    app.dependency_overrides[get_current_user] = lambda: UserMeResponse(
        sub=current["sub"]
    )
    yield client, current
    get_settings.cache_clear()
    asyncio.run(engine.dispose())


def test_lists_only_the_callers_searches_newest_first(history_client):
    client, _ = history_client

    response = client.get("/api/v1/user/logan_searches")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 5
    assert [s["job_id"] for s in body["searches"]] == [
        f"alice{i:011d}" for i in (4, 3, 2, 1, 0)
    ]
    first = body["searches"][0]
    assert first["indexes"] == ["GENOMIC_INV", "IDX_4"]
    assert first["query_bases"] == 504
    assert first["threshold"] == 0.5


def test_pages(history_client):
    client, _ = history_client

    body = client.get("/api/v1/user/logan_searches?limit=2&offset=2").json()

    assert body["total"] == 5
    assert body["limit"] == 2
    assert body["offset"] == 2
    assert [s["job_id"] for s in body["searches"]] == [
        "alice00000000002",
        "alice00000000001",
    ]


def test_another_user_sees_their_own(history_client):
    client, current = history_client
    current["sub"] = "bob"

    body = client.get("/api/v1/user/logan_searches").json()

    assert [s["job_id"] for s in body["searches"]] == ["bob0000000000000"]


def test_an_unprovisioned_user_has_an_empty_history(history_client):
    client, current = history_client
    current["sub"] = "nobody"

    response = client.get("/api/v1/user/logan_searches")

    assert response.status_code == 200
    assert response.json()["searches"] == []
    assert response.json()["total"] == 0


def test_rejects_an_out_of_range_limit(history_client):
    client, _ = history_client

    assert client.get("/api/v1/user/logan_searches?limit=0").status_code == 422
    assert client.get("/api/v1/user/logan_searches?limit=101").status_code == 422


def test_without_a_database_says_so(app_client, monkeypatch):  # noqa: F811
    app, client = app_client
    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()
    app.dependency_overrides[get_current_user] = lambda: UserMeResponse(sub="alice")

    response = client.get("/api/v1/user/logan_searches")

    assert response.status_code == 503
    get_settings.cache_clear()


def test_requires_sign_in(app_client):  # noqa: F811
    _, client = app_client

    response = client.get("/api/v1/user/logan_searches")

    assert response.status_code == 401
