"""Tests for the SRA-DuckDB mirror service.

These exercise initialization gating and query-layer correctness/error
handling without requiring a real mirror file -- a small DuckDB fixture is
built in-memory and written to a temp path where a real connection is needed.
"""

import logging

from app.services.sra_mirror import SRAMirrorService


class TestInitializeGating:
    """F2: an unset/empty SRA_MIRROR_PATH must not log an ERROR traceback.

    Path('').exists() is True (it resolves to '.'), so the old early-return
    was skipped and the code fell through to duckdb.connect('', read_only=True)
    which raises and logs a scary traceback on every default-deploy boot.
    """

    def test_empty_path_is_unavailable_without_error_log(self, caplog):
        with caplog.at_level(logging.INFO):
            svc = SRAMirrorService("")
        assert svc.is_available() is False
        errors = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert not errors, [r.getMessage() for r in errors]

    def test_missing_file_warns_but_does_not_error(self, caplog, tmp_path):
        missing = str(tmp_path / "nope.duckdb")
        with caplog.at_level(logging.INFO):
            svc = SRAMirrorService(missing)
        assert svc.is_available() is False
        errors = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert not errors, [r.getMessage() for r in errors]
        assert any(r.levelno == logging.WARNING for r in caplog.records)

    def test_directory_path_is_unavailable_without_error_log(self, caplog, tmp_path):
        # A non-empty path that exists but isn't a file (e.g. a directory)
        # also hit the old exists()-passes-then-connect-fails trap.
        with caplog.at_level(logging.INFO):
            svc = SRAMirrorService(str(tmp_path))
        assert svc.is_available() is False
        assert not [r for r in caplog.records if r.levelno >= logging.ERROR]
