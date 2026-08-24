import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.crud import (
    create_workflow_run,
    delete_favorite,
    delete_saved_analysis,
    get_saved_analysis,
    get_user_by_keycloak_sub,
    list_favorites_for_user,
    list_saved_analyses_for_user,
    list_workflow_runs_for_user,
    repoint_saved_analysis_session,
    upsert_favorite,
    upsert_saved_analysis,
    upsert_user_from_claims,
)
from app.db.models import Base


async def _create_session() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return session_factory()


@pytest_asyncio.fixture()
async def db_session_factory(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest.mark.asyncio
async def test_upsert_user_from_claims_creates_and_updates_user():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-123",
                "email": "first@example.com",
                "name": "First User",
            },
        )

        assert user.keycloak_sub == "kc-123"
        assert user.email == "first@example.com"
        assert user.name == "First User"

        updated_user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-123",
                "email": "updated@example.com",
                "name": "Updated User",
            },
        )

        fetched = await get_user_by_keycloak_sub(session, "kc-123")

        assert fetched is not None
        assert updated_user.id == user.id
        assert fetched.email == "updated@example.com"
        assert fetched.name == "Updated User"


@pytest.mark.asyncio
async def test_favorite_crud_round_trip():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-456",
                "email": "fav@example.com",
                "name": "Favorite User",
            },
        )

        favorite = await upsert_favorite(session, user, "assembly", "GCF_000001405.40")
        favorites = await list_favorites_for_user(session, user)

        assert favorite.entity_id == "GCF_000001405.40"
        assert [item.entity_id for item in favorites] == ["GCF_000001405.40"]

        deleted = await delete_favorite(session, user, "assembly", "GCF_000001405.40")
        favorites_after_delete = await list_favorites_for_user(session, user)

        assert deleted is True
        assert favorites_after_delete == []


@pytest.mark.asyncio
async def test_saved_analysis_crud_round_trip():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-789",
                "email": "saved@example.com",
                "name": "Saved User",
            },
        )

        saved_analysis = await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[],
            messages=[{"role": "user", "content": "Help me analyze influenza"}],
            schema={
                "organism": {"status": "filled", "value": "Influenza A", "detail": None}
            },
            source_session="session-123",
            title="Saved analysis title",
        )
        saved_analyses = await list_saved_analyses_for_user(session, user)
        fetched = await get_saved_analysis(session, user, str(saved_analysis.id))

        assert len(saved_analyses) == 1
        assert fetched is not None
        assert fetched.title == "Saved analysis title"

        deleted = await delete_saved_analysis(session, user, str(saved_analysis.id))
        saved_analyses_after_delete = await list_saved_analyses_for_user(session, user)

        assert deleted is True
        assert saved_analyses_after_delete == []


@pytest.mark.asyncio
async def test_workflow_run_round_trip_with_and_without_user():
    async with await _create_session() as session:
        user = await upsert_user_from_claims(
            session,
            {
                "sub": "kc-999",
                "email": "runs@example.com",
                "name": "Workflow Runner",
            },
        )

        anonymous_run = await create_workflow_run(
            session,
            None,
            workflow_trs_id="#workflow/github.com/iwc/rnaseq-pe/main",
            workflow_id=None,
            galaxy_instance_url="https://usegalaxy.org",
            handoff_url="https://usegalaxy.org/workflow_landings/anonymous",
            assembly_accession="GCF_000001405.40",
            launch_source="site",
            assistant_session_id=None,
            parameters={"reference_assembly": "GCF_000001405.40"},
        )
        user_run = await create_workflow_run(
            session,
            user,
            workflow_trs_id="#workflow/github.com/iwc/varcall-haploid/main",
            workflow_id=None,
            galaxy_instance_url="https://usegalaxy.org",
            handoff_url="https://usegalaxy.org/workflow_landings/user",
            assembly_accession="GCF_000001405.40",
            launch_source="assistant",
            assistant_session_id="assistant-session-1",
            parameters={"read_runs_single": ["SRR000001"]},
        )

        workflow_runs = await list_workflow_runs_for_user(session, user)

        assert anonymous_run.user_id is None
        assert user_run.user_id == user.id
        assert len(workflow_runs) == 1
        assert workflow_runs[0].assistant_session_id == "assistant-session-1"
        assert workflow_runs[0].workflow_trs_id.endswith("varcall-haploid/main")


@pytest.mark.asyncio
async def test_upsert_saved_analysis_updates_in_place(db_session_factory):
    """A second write for the same live session must update, not duplicate."""
    async with db_session_factory() as session:
        user = await upsert_user_from_claims(
            session, {"email": "a@example.org", "sub": "sub-upsert"}
        )

        first = await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[{"kind": "request"}],
            messages=[{"content": "hi", "role": "user"}],
            schema={},
            source_session="sess-1",
            title="First",
        )
        second = await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[{"kind": "request"}, {"kind": "response"}],
            messages=[
                {"content": "hi", "role": "user"},
                {"content": "hello", "role": "assistant"},
            ],
            schema={"organism": "x"},
            source_session="sess-1",
            title="First",
        )

        assert first.id == second.id
        assert len(second.messages) == 2
        assert len(second.agent_message_history) == 2

        rows = await list_saved_analyses_for_user(session, user)
        assert len(rows) == 1


@pytest.mark.asyncio
async def test_upsert_saved_analysis_separates_distinct_sessions(db_session_factory):
    async with db_session_factory() as session:
        user = await upsert_user_from_claims(
            session, {"email": "b@example.org", "sub": "sub-two-sessions"}
        )

        await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[],
            messages=[],
            schema={},
            source_session="sess-a",
            title="A",
        )
        await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[],
            messages=[],
            schema={},
            source_session="sess-b",
            title="B",
        )

        rows = await list_saved_analyses_for_user(session, user)
        assert len(rows) == 2


@pytest.mark.asyncio
async def test_repoint_saved_analysis_session(db_session_factory):
    """Opening an analysis rehydrates Redis under a new id; the row follows."""
    async with db_session_factory() as session:
        user = await upsert_user_from_claims(
            session, {"email": "c@example.org", "sub": "sub-repoint"}
        )
        analysis = await upsert_saved_analysis(
            session,
            user,
            agent_message_history=[],
            messages=[],
            schema={},
            source_session="old-session",
            title="Repoint me",
        )

        await repoint_saved_analysis_session(
            session, user, str(analysis.id), "new-session"
        )

        rows = await list_saved_analyses_for_user(session, user)
        assert len(rows) == 1
        assert rows[0].source_session == "new-session"
