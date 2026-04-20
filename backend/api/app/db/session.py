from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def get_engine() -> AsyncEngine:
    global _engine, _session_factory

    if _engine is not None:
        return _engine

    settings = get_settings()
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")

    engine_kwargs: dict[str, object] = {
        "echo": settings.DATABASE_ECHO,
        "future": True,
    }
    if not _is_sqlite(settings.DATABASE_URL):
        engine_kwargs["max_overflow"] = settings.DATABASE_MAX_OVERFLOW
        engine_kwargs["pool_size"] = settings.DATABASE_POOL_SIZE

    _engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)
    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory

    if _session_factory is None:
        get_engine()
    if _session_factory is None:
        raise RuntimeError("Database session factory failed to initialize")
    return _session_factory


async def get_db_session() -> AsyncIterator[AsyncSession]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


async def init_db() -> None:
    settings = get_settings()
    if settings.DATABASE_URL:
        get_engine()


async def close_db() -> None:
    global _engine, _session_factory

    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
