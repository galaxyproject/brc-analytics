"""The migrations have to actually run.

Every other DB test builds its schema from Base.metadata.create_all, which
means a migration could be malformed -- a bad server_default, a constraint the
dialect refuses -- and nothing would notice until a deploy ran
`alembic upgrade head` on startup. This runs the real chain against a throwaway
sqlite file, the same way app.db.session._run_migrations_sync does.
"""

import logging
from contextlib import contextmanager

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from app.core.config import get_settings
from app.db.session import _alembic_ini_path

GALAXY_JOBS_COLUMNS = {
    "created_at",
    "galaxy_instance_url",
    "galaxy_job_id",
    "id",
    "params",
    "tool",
    "user_id",
}


@contextmanager
def _logging_restored():
    """Undo alembic env.py's logging.fileConfig side effects.

    fileConfig defaults to disable_existing_loggers=True, so running a
    migration switches off every logger the ini doesn't name -- which silently
    empties caplog for whatever test runs next.
    """
    before = {
        name: logger.disabled
        for name, logger in logging.root.manager.loggerDict.items()
        if isinstance(logger, logging.Logger)
    }
    try:
        yield
    finally:
        for name, was_disabled in before.items():
            logger = logging.root.manager.loggerDict.get(name)
            if isinstance(logger, logging.Logger):
                logger.disabled = was_disabled


@pytest.fixture()
def migrated_db(tmp_path, monkeypatch):
    """Apply every migration to a fresh sqlite file, return its sync URL."""
    db_path = tmp_path / "migrations.db"
    # env.py reads the URL from settings, not from the Config, so the env var
    # is what actually steers this -- and it needs the async driver.
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
    get_settings.cache_clear()

    cfg = Config(str(_alembic_ini_path()))
    cfg.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")
    with _logging_restored():
        command.upgrade(cfg, "head")

    yield f"sqlite:///{db_path}"
    get_settings.cache_clear()


def test_upgrade_head_creates_galaxy_jobs(migrated_db):
    engine = create_engine(migrated_db)
    try:
        inspector = inspect(engine)
        assert "galaxy_jobs" in inspector.get_table_names()

        columns = {c["name"] for c in inspector.get_columns("galaxy_jobs")}
        assert columns == GALAXY_JOBS_COLUMNS
    finally:
        engine.dispose()


def test_galaxy_jobs_indexes_and_constraints_are_named(migrated_db):
    engine = create_engine(migrated_db)
    try:
        inspector = inspect(engine)
        index_names = {i["name"] for i in inspector.get_indexes("galaxy_jobs")}
        assert "ix_galaxy_jobs_user_id" in index_names

        unique_names = {
            u["name"] for u in inspector.get_unique_constraints("galaxy_jobs")
        }
        assert "uq_galaxy_jobs_galaxy_job_id" in unique_names
    finally:
        engine.dispose()


def test_galaxy_jobs_params_defaults_to_an_empty_object(migrated_db):
    engine = create_engine(migrated_db)
    try:
        params = next(
            c
            for c in inspect(engine).get_columns("galaxy_jobs")
            if c["name"] == "params"
        )
        assert params["default"] is not None
        assert "{}" in str(params["default"])
    finally:
        engine.dispose()
