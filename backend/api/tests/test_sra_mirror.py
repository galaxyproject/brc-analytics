"""Tests for the SRA-DuckDB mirror service.

These exercise initialization gating and query-layer correctness/error
handling without requiring a real mirror file -- a small DuckDB fixture is
built at a temp path so the service's real read-only queries run against it.
"""

import logging

import duckdb
import pytest

from app.services.sra_mirror import SRAMirrorService


def _build_mirror(path: str) -> None:
    """Create a minimal but representative mirror at `path`.

    Tables mirror the production schema's used columns. Rows cover the
    scenarios F4-F9 exercise: a BioProject lookup, case/synonym country
    matches, an ambiguous name (one name -> two taxids), and a resolvable
    organism that has zero runs.
    """
    con = duckdb.connect(path)
    con.execute("CREATE TABLE mirror_meta (key VARCHAR, value VARCHAR)")
    con.execute(
        "INSERT INTO mirror_meta VALUES ('mirror_built_at', '2026-05-20'), "
        "('taxdump_version', '2026-05-01')"
    )
    con.execute("CREATE TABLE taxid_names (taxid INTEGER, name VARCHAR)")
    con.execute(
        """
        INSERT INTO taxid_names VALUES
            (5833, 'Plasmodium falciparum'),
            (5833, 'Plasmodium falciparum 3D7'),
            (1773, 'Mycobacterium tuberculosis'),
            (777, 'Duplicatus exampleus'),
            (778, 'Duplicatus exampleus')
        """
    )
    con.execute(
        """
        CREATE TABLE runs (
            acc VARCHAR, sra_study VARCHAR, bioproject VARCHAR, organism VARCHAR,
            assay_type VARCHAR, platform VARCHAR, instrument VARCHAR,
            librarylayout VARCHAR, releasedate DATE,
            geo_loc_name_country_calc VARCHAR, mbases INTEGER
        )
        """
    )
    con.execute(
        """
        INSERT INTO runs VALUES
            ('SRR001','SRP001','PRJNA12345','Plasmodium falciparum','WGS',
             'ILLUMINA','HiSeq','PAIRED', DATE '2020-06-01','Kenya', 100),
            ('SRR002','SRP001','PRJNA12345','Plasmodium falciparum','WGS',
             'OXFORD_NANOPORE','MinION','SINGLE', DATE '2021-06-01',
             'United Kingdom', 200),
            ('SRR003','SRP002','PRJNA99999','Mycobacterium tuberculosis','WGS',
             'ILLUMINA','NovaSeq','PAIRED', DATE '2019-01-01','USA', 300)
        """
    )
    con.close()


@pytest.fixture()
def mirror(tmp_path):
    path = str(tmp_path / "test-mirror.duckdb")
    _build_mirror(path)
    svc = SRAMirrorService(path)
    assert svc.is_available()
    return svc


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


class TestGetStudyRunsPrefix:
    """F4: BioProject lookup must normalize the accession before the PRJ
    prefix test -- 'prjna12345' or ' PRJNA12345 ' should hit the bioproject
    column, not fall through to sra_study and return nothing."""

    def test_uppercase_prj_matches_bioproject(self, mirror):
        result = mirror.get_study_runs("PRJNA12345")
        assert result["matched_column"] == "bioproject"
        assert result["n_returned"] == 2

    def test_lowercase_prj_matches_bioproject(self, mirror):
        result = mirror.get_study_runs("prjna12345")
        assert result["matched_column"] == "bioproject"
        assert result["n_returned"] == 2

    def test_whitespace_padded_prj_matches_bioproject(self, mirror):
        result = mirror.get_study_runs("  PRJNA12345  ")
        assert result["matched_column"] == "bioproject"
        assert result["n_returned"] == 2

    def test_study_accession_still_matches_sra_study(self, mirror):
        result = mirror.get_study_runs("SRP001")
        assert result["matched_column"] == "sra_study"
        assert result["n_returned"] == 2


class TestOrganismResolution:
    """F5/F6: resolution must be deterministic for ambiguous names, and a
    summary must distinguish an unrecognized term (likely a typo) from a
    real organism that simply has no runs."""

    def test_ambiguous_name_resolves_to_min_taxid(self, mirror):
        # 'Duplicatus exampleus' maps to taxids 777 and 778. Without a
        # deterministic ORDER BY, different runs could pick either.
        taxid, _ = mirror._resolve_organism("Duplicatus exampleus")
        assert taxid == 777

    def test_summary_flags_unrecognized_organism(self, mirror):
        result = mirror.summary_for_organism("Notarealorganism xyzzy")
        assert result["n_runs"] == 0
        assert result["resolved"] is False

    def test_summary_resolved_but_zero_runs_is_not_unresolved(self, mirror):
        # Resolves to a real taxid (777) but has no runs -- distinct from a typo.
        result = mirror.summary_for_organism("Duplicatus exampleus")
        assert result["n_runs"] == 0
        assert result["resolved"] is True


class TestSinceValidation:
    """F7: a malformed `since` must come back as a polite message, not crash
    the tool turn with a DuckDB conversion/binder error."""

    def test_garbage_since_returns_error_not_exception(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", since="last year")
        assert "error" in result
        assert "since" in result["error"].lower()

    def test_valid_since_filters_runs(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", since="2021-01-01")
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR002"

    def test_year_only_since_is_coerced(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", since="2021")
        assert "error" not in result
        assert result["n_returned"] == 1

    def test_no_since_returns_all(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum")
        assert result["n_returned"] == 2


class TestCountryMatching:
    """F8: country filter was exact-match, so 'kenya' (case) and 'UK'
    (synonym of 'United Kingdom') silently returned nothing."""

    def test_case_insensitive_country(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", country="kenya")
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR001"

    def test_uk_synonym_matches_united_kingdom(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", country="UK")
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR002"

    def test_exact_country_still_matches(self, mirror):
        result = mirror.search_runs(
            "Plasmodium falciparum", country="United Kingdom"
        )
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR002"
