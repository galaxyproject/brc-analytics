"""Every kmindex search leaves an analytics row saying where it came from.

The load-bearing property is the same as the turn log's: the Galaxy job exists
before this runs, so a missing database, a failed write or a stalled one must
all still hand the caller their job id.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.galaxy import get_galaxy_service
from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.db.crud import create_kmindex_submission, upsert_user_from_claims
from app.db.models import Base, KmindexSubmission
from app.models.galaxy import KmindexQuerySubmission, query_bases
from app.services import kmindex_submissions
from tests.test_galaxy_submit_ownership import (  # noqa: F401
    SUBMISSION_PAYLOAD,
    _stub_service,
    app_client,
)

SEQUENCE = ">q\nACGTACGTAC\nGGCC\n"


def _submission():
    return KmindexQuerySubmission(
        indexes=["GENOMIC_BCT", "METAGENOMIC_ENV"],
        sequence=SEQUENCE,
        threshold=0.5,
        zvalue=4,
    )


@pytest_asyncio.fixture()
async def session_factory(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    @asynccontextmanager
    async def fake_db_session():
        async with factory() as session:
            yield session

    monkeypatch.setattr(kmindex_submissions, "db_session", fake_db_session)
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()
    yield factory
    get_settings.cache_clear()
    await engine.dispose()


async def _rows(factory):
    async with factory() as session:
        return (await session.execute(select(KmindexSubmission))).scalars().all()


def test_query_bases_ignores_headers_and_whitespace():
    assert query_bases(SEQUENCE) == 14


@pytest.mark.asyncio
async def test_an_anonymous_native_search_is_recorded(session_factory):
    await kmindex_submissions.record_submission(
        credential=GalaxyCredential(kind="service", secret="k"),
        galaxy_job_id="job1",
        source="native",
        submission=_submission(),
    )

    [row] = await _rows(session_factory)
    assert row.source == "native"
    assert row.identity == "service"
    assert row.partner_id is None
    assert row.user_id is None
    assert row.indexes == ["GENOMIC_BCT", "METAGENOMIC_ENV"]
    assert row.query_bases == 14
    assert row.threshold == 0.5
    assert row.zvalue == 4


@pytest.mark.asyncio
async def test_a_partner_search_is_tagged_with_the_partner(session_factory):
    await kmindex_submissions.record_submission(
        credential=GalaxyCredential(kind="service", secret="k"),
        galaxy_job_id="job2",
        partner_id="example-partner",
        source="partner",
        submission=_submission(),
    )

    [row] = await _rows(session_factory)
    assert (row.source, row.partner_id) == ("partner", "example-partner")


@pytest.mark.asyncio
async def test_a_signed_in_search_is_attributed_to_the_user(session_factory):
    async with session_factory() as session:
        user = await upsert_user_from_claims(
            session, {"sub": "sub-1", "email": "u@example.org"}
        )
        await session.commit()

    await kmindex_submissions.record_submission(
        credential=GalaxyCredential(kind="user", secret="t", user_sub="sub-1"),
        galaxy_job_id="job3",
        source="native",
        submission=_submission(),
    )

    [row] = await _rows(session_factory)
    assert (row.identity, row.user_id) == ("user", user.id)


@pytest.mark.asyncio
async def test_a_job_is_counted_once(session_factory):
    async with session_factory() as session:
        kwargs = dict(
            galaxy_job_id="job4",
            identity="service",
            indexes=["A"],
            query_bases=10,
            source="native",
            threshold=0.0,
            zvalue=6,
        )
        await create_kmindex_submission(session, **kwargs)
        await session.commit()
        with pytest.raises(IntegrityError):
            await create_kmindex_submission(session, **kwargs)
        await session.rollback()

    [row] = await _rows(session_factory)
    assert row.galaxy_job_id == "job4"


@pytest.mark.asyncio
async def test_no_database_means_no_write(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    get_settings.cache_clear()
    write = AsyncMock()
    monkeypatch.setattr(kmindex_submissions, "_write", write)

    await kmindex_submissions.record_submission(
        credential=None,
        galaxy_job_id="job5",
        source="native",
        submission=_submission(),
    )

    write.assert_not_awaited()
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_a_failing_write_never_raises(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()
    write = AsyncMock(side_effect=RuntimeError("db down"))
    monkeypatch.setattr(kmindex_submissions, "_write", write)

    await kmindex_submissions.record_submission(
        credential=None,
        galaxy_job_id="job6",
        source="native",
        submission=_submission(),
    )

    write.assert_awaited_once()
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_a_stalled_write_is_cut_off_at_the_timeout(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()
    monkeypatch.setattr(kmindex_submissions, "WRITE_TIMEOUT_SECONDS", 0.05)
    events = []

    async def _write(*_args):
        events.append("entered")
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            events.append("cancelled")
            raise

    monkeypatch.setattr(kmindex_submissions, "_write", _write)

    started = time.monotonic()
    await kmindex_submissions.record_submission(
        credential=None,
        galaxy_job_id="job6",
        source="native",
        submission=_submission(),
    )

    assert events == ["entered", "cancelled"]
    assert time.monotonic() - started < 1
    get_settings.cache_clear()


def test_the_native_submit_route_records_the_search(app_client, monkeypatch):  # noqa: F811
    app, client = app_client
    credential = GalaxyCredential(kind="service", secret="k")
    app.dependency_overrides[get_galaxy_service] = lambda: _stub_service(credential)
    record = AsyncMock()
    from app.api.v1 import galaxy as galaxy_module

    monkeypatch.setattr(galaxy_module, "record_submission", record)

    response = client.post("/api/v1/galaxy/kmindex/submit", json=SUBMISSION_PAYLOAD)

    assert response.status_code == 200
    record.assert_awaited_once()
    kwargs = record.await_args.kwargs
    assert (kwargs["galaxy_job_id"], kwargs["source"]) == ("job1", "native")
    assert kwargs["credential"] is credential
