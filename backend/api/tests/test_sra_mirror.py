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
            (778, 'Duplicatus exampleus'),
            (42, 'Sameday organism')
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
             'ILLUMINA','NovaSeq','PAIRED', DATE '2019-01-01','USA', 300),
            -- Three runs with an identical releasedate, inserted ascending by
            -- accession, so an ORDER BY without a tiebreaker is ambiguous.
            ('SRRA','SRP9','PRJNA9','Sameday organism','WGS','ILLUMINA','X',
             'PAIRED', DATE '2022-01-01','Kenya', 1),
            ('SRRB','SRP9','PRJNA9','Sameday organism','WGS','ILLUMINA','X',
             'PAIRED', DATE '2022-01-01','Kenya', 2),
            ('SRRC','SRP9','PRJNA9','Sameday organism','WGS','ILLUMINA','X',
             'PAIRED', DATE '2022-01-01','Kenya', 3)
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


class TestResolvedFlagAcrossOutputs:
    """F6 follow-up: the `resolved` flag belongs on every organism-based
    output, not just summary -- top_bioprojects is offered for cohort
    questions, so a typo there shouldn't read as an authoritative empty set."""

    def test_search_runs_flags_unrecognized(self, mirror):
        result = mirror.search_runs("Notarealorganism xyzzy")
        assert result["resolved"] is False
        assert result["n_returned"] == 0

    def test_search_runs_resolved_true_when_found(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum")
        assert result["resolved"] is True

    def test_top_bioprojects_flags_unrecognized(self, mirror):
        result = mirror.top_bioprojects_for_organism("Notarealorganism xyzzy")
        assert result["resolved"] is False

    def test_top_bioprojects_resolved_true_when_found(self, mirror):
        result = mirror.top_bioprojects_for_organism("Plasmodium falciparum")
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
        result = mirror.search_runs("Plasmodium falciparum", country="United Kingdom")
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR002"


class TestCacheHygiene:
    """F10/F12/F13: the in-process TTL cache must stay bounded, hand back
    copies (not shared references), and key on a normalized organism so
    casing/whitespace variants don't each trigger a fresh aggregate."""

    def test_cache_is_bounded(self, mirror):
        from app.services.sra_mirror import _CACHE_MAX_ENTRIES

        for i in range(_CACHE_MAX_ENTRIES + 50):
            mirror.summary_for_organism(f"unknown organism {i}")
        assert len(mirror._cache) <= _CACHE_MAX_ENTRIES

    def test_cached_result_not_mutated_by_caller(self, mirror):
        r1 = mirror.summary_for_organism("Plasmodium falciparum")
        r1["n_runs"] = -999
        r1["top_platforms"].append({"platform": "BOGUS", "n_runs": 1})
        r2 = mirror.summary_for_organism("Plasmodium falciparum")
        assert r2["n_runs"] != -999
        assert all(p["platform"] != "BOGUS" for p in r2["top_platforms"])

    def test_organism_cache_key_is_normalized(self, mirror):
        mirror.summary_for_organism("Plasmodium falciparum")
        n_after_first = len(mirror._cache)
        # Casing + extra whitespace should hit the same cache entry.
        mirror.summary_for_organism("  plasmodium   falciparum ")
        assert len(mirror._cache) == n_after_first


class TestLimitClamp:
    """F14: the service must clamp limit itself, not rely on the tool layer --
    a non-tool caller shouldn't be able to request unbounded rows."""

    def test_search_limit_clamped_high(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", limit=10_000)
        assert result["limit"] == 200

    def test_search_limit_floored(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", limit=0)
        assert result["limit"] == 1

    def test_study_runs_limit_clamped_high(self, mirror):
        result = mirror.get_study_runs("PRJNA12345", limit=10_000)
        assert result["limit"] == 500


class TestStableOrdering:
    """F15: same-day batches are common and releasedate is nullable, so an
    ORDER BY releasedate alone shuffles rows at the LIMIT boundary. A stable
    secondary sort (acc) keeps results reproducible."""

    def test_search_same_date_orders_by_acc_desc(self, mirror):
        result = mirror.search_runs("Sameday organism")
        accs = [r["accession"] for r in result["runs"]]
        assert accs == ["SRRC", "SRRB", "SRRA"]

    def test_study_runs_same_date_orders_by_acc_desc(self, mirror):
        result = mirror.get_study_runs("PRJNA9")
        accs = [r["accession"] for r in result["runs"]]
        assert accs == ["SRRC", "SRRB", "SRRA"]


class TestInitErrorHandling:
    """F9: an incomplete/corrupt mirror should fail with a specific, clean
    log -- not a raw traceback from a bare `except Exception` -- and must not
    leave the opened connection dangling behind a None self._con."""

    def test_missing_tables_logs_specific_error_without_traceback(
        self, tmp_path, caplog
    ):
        # A real DuckDB file that exists but lacks the expected tables.
        bad = str(tmp_path / "empty.duckdb")
        duckdb.connect(bad).close()
        with caplog.at_level(logging.ERROR):
            svc = SRAMirrorService(bad)
        assert svc.is_available() is False
        errors = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert errors, "expected an error log for the incomplete mirror"
        # logger.exception() attaches exc_info (a raw traceback); the fix uses
        # a specific message via logger.error instead.
        assert all(r.exc_info is None for r in errors)
        assert any("table" in r.getMessage().lower() for r in errors)


class TestPlatformAssayMatching:
    """Platform/assay_type were exact-match, so 'illumina' (lowercase) silently
    returned nothing even though the stored value is 'ILLUMINA'. Now matched
    case-insensitively, like the country filter."""

    def test_case_insensitive_platform(self, mirror):
        result = mirror.search_runs("Plasmodium falciparum", platform="illumina")
        assert result["n_returned"] == 1
        assert result["runs"][0]["accession"] == "SRR001"
        # Whitespace-padded input normalizes identically for the cache key and
        # the SQL param, so it returns the same result instead of caching a
        # zero-result under the shared key.
        padded = mirror.search_runs("Plasmodium falciparum", platform="  ILLUMINA  ")
        assert padded["n_returned"] == 1

    def test_case_insensitive_assay_type(self, mirror):
        # Both P. falciparum rows are WGS, so a lowercase match returns both...
        result = mirror.search_runs("Plasmodium falciparum", assay_type="wgs")
        assert result["n_returned"] == 2
        # ...and a non-matching assay type returns none -- proves the filter
        # actually excludes rather than being a no-op, and handles mixed case.
        none = mirror.search_runs("Plasmodium falciparum", assay_type="RNA-Seq")
        assert none["n_returned"] == 0


class TestConcurrentAccess:
    """FastMCP offloads sync MCP tools to a worker threadpool, so the singleton
    service's shared DuckDB connection and in-process cache are hit from many
    threads at once. A single DuckDB connection is not safe for concurrent
    execute()/fetch() (a second thread's execute() resets the pending result,
    so the first thread's fetch returns None -> TypeError), and the plain-dict
    cache is not safe for concurrent mutation under eviction. The public methods
    serialize on an instance lock; this exercises that.

    Every call below uses a UNIQUE cache key (distinct limit per iteration) so
    it misses the cache and actually hits the connection -- a shared key would
    let the cache absorb every call after the first and hide the race. The
    distinct keys also push the cache past _CACHE_MAX_ENTRIES, exercising the
    _evict() iteration alongside concurrent inserts.
    """

    def test_parallel_misses_hit_connection_safely(self, mirror):
        import concurrent.futures

        from app.services import sra_mirror as sra_mod

        errors: list[Exception] = []
        n_iter = max(800, sra_mod._CACHE_MAX_ENTRIES * 2)

        def hammer(i: int):
            try:
                # Unique limit -> unique cache key -> guaranteed connection hit.
                # P. falciparum has 2 runs and PRJNA12345 has 2 runs, so the
                # returned count is a stable invariant we can assert: a torn
                # execute()/fetch() shows up as a wrong count or a crash.
                limit = (i % 200) + 1
                pf = mirror.search_runs("Plasmodium falciparum", limit=limit)
                assert pf["n_returned"] == min(2, limit), pf["n_returned"]
                study = mirror.get_study_runs("PRJNA12345", limit=limit)
                assert study["n_returned"] == min(2, limit), study["n_returned"]
            except Exception as exc:  # noqa: BLE001 -- surface to the assertion
                errors.append(exc)

        with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
            list(pool.map(hammer, range(n_iter)))

        assert not errors, errors[:5]
