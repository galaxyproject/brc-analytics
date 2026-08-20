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

    def test_unknown_numeric_taxid_is_not_resolved(self, mirror):
        # A numeric taxid absent from taxid_names matches nothing, so it should
        # read as unresolved -- not a phantom "known organism" with zero runs.
        result = mirror.summary_for_organism("999999")
        assert result["n_runs"] == 0
        assert result["resolved"] is False


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
        # The error path still carries provenance, like every other response.
        assert result["resolved"] is True
        assert "_meta" in result

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


class TestAccessionBatching:
    """A page larger than the batch size must not lose annotations.

    The lookup used to slice to the batch size, which dropped rows silently --
    and since the accession list is sorted before slicing, it dropped them by
    accession rather than by score, so what survived wasn't the ranked subset
    either.
    """

    @staticmethod
    def _mirror_with(n: int, tmp_path):
        """Build a mirror holding `n` synthetic runs.

        @param n: how many runs to insert.
        @param tmp_path: pytest tmp dir.
        @returns: (service, list of every accession inserted).
        """
        path = str(tmp_path / f"batch-{n}.duckdb")
        _build_mirror(path)
        con = duckdb.connect(path)
        accs = [f"SRRB{i:06d}" for i in range(n)]
        con.executemany(
            "INSERT INTO runs VALUES (?,'SRPX','PRJNAX','Batch organism','WGS',"
            "'ILLUMINA','X','PAIRED', DATE '2023-01-01','Kenya', 1)",
            [(a,) for a in accs],
        )
        con.close()
        svc = SRAMirrorService(path)
        assert svc.is_available()
        return svc, accs

    def test_page_larger_than_batch_size_annotates_every_row(self, tmp_path):
        from app.services.sra_mirror import _ACCESSION_BATCH_SIZE

        n = _ACCESSION_BATCH_SIZE * 2 + 37  # spans three batches, last partial
        svc, accs = self._mirror_with(n, tmp_path)
        found = svc.runs_by_accession(accs)
        assert len(found) == n
        assert set(found) == set(accs)

    def test_exact_batch_multiple_has_no_off_by_one(self, tmp_path):
        from app.services.sra_mirror import _ACCESSION_BATCH_SIZE

        svc, accs = self._mirror_with(_ACCESSION_BATCH_SIZE * 2, tmp_path)
        assert len(svc.runs_by_accession(accs)) == _ACCESSION_BATCH_SIZE * 2

    def test_unknown_accessions_are_simply_absent(self, tmp_path):
        svc, accs = self._mirror_with(10, tmp_path)
        found = svc.runs_by_accession(accs + ["SRR_NOT_IN_MIRROR"])
        assert len(found) == 10
        assert "SRR_NOT_IN_MIRROR" not in found


def _build_cohort_mirror(path: str) -> list:
    """Create a mirror shaped like the real one's awkward parts.

    Carries what the cohort query has to get right and a small fixture
    otherwise wouldn't exercise: the literal 'uncalculated' country sentinel
    beside genuinely NULL countries, the literal 'unspecified' instrument
    sentinel in a column that has no NULLs or blanks at all, an instrument
    tail longer than the listed head, a run with no release date, and an
    empty-string assay type. Returns every accession inserted.
    """
    _build_mirror(path)
    con = duckdb.connect(path)
    con.execute("DELETE FROM runs")

    rows = []

    def add(n, organism, country, instrument, **kw):
        for _ in range(n):
            acc = f"SRRC{len(rows):05d}"
            rows.append(
                (
                    acc,
                    kw.get("study", "SRP1"),
                    kw.get("project", "PRJNA1"),
                    organism,
                    kw.get("assay", "WGS"),
                    kw.get("platform", "ILLUMINA"),
                    instrument,
                    kw.get("layout", "PAIRED"),
                    kw.get("date", "2020-06-01"),
                    country,
                )
            )

    # A dominant organism plus a runner-up, so top_organisms has an order to
    # get wrong, and a second study/project so the distinct counts aren't 1.
    add(20, "Salmonella enterica", "USA", "Illumina MiSeq")
    add(12, "Escherichia coli", "United Kingdom", "Illumina MiSeq", study="SRP2")
    add(3, "Shigella sonnei", "Kenya", "Illumina MiSeq", project="PRJNA2")
    # The sentinel and real NULLs: both belong in `unknown`, and neither may
    # count toward `countries`.
    add(5, "Salmonella enterica", "uncalculated", "Illumina MiSeq")
    add(4, "Salmonella enterica", None, "Illumina MiSeq")
    # The instrument sentinel. Unlike country, this column has no NULLs and
    # no empty strings, so 'unspecified' is the only thing that can put a row
    # in `unknown` -- and at 6 rows it outranks every instrument below MiSeq,
    # so an unfixed facet lists it second rather than hiding it in `other`.
    # Parked on Shigella so the top-organism ranking below is untouched.
    add(6, "Shigella sonnei", "USA", "unspecified")
    # Fourteen one-run instruments: more distinct values than a facet lists,
    # so the tail has to roll into `other` rather than vanish.
    for i in range(14):
        add(1, "Escherichia coli", "USA", f"Instrument {i:02d}")
    # A run with no release date and one with a blank assay type -- both read
    # as unknown, not as a value.
    add(1, "Salmonella enterica", "USA", "Illumina MiSeq", date=None)
    add(1, "Salmonella enterica", "USA", "Illumina MiSeq", assay="")
    add(
        2,
        "Salmonella enterica",
        "USA",
        "MinION",
        platform="OXFORD_NANOPORE",
        layout="SINGLE",
        date="2023-06-01",
    )
    # An organism the mirror knows nothing about would simply be absent; this
    # one has an empty name, which must not become a top organism.
    add(1, "", "USA", "Illumina MiSeq")

    con.executemany(
        "INSERT INTO runs VALUES (?,?,?,?,?,?,?,?,?,?,1)",
        rows,
    )
    con.close()
    return [r[0] for r in rows]


@pytest.fixture()
def cohort_mirror(tmp_path):
    path = str(tmp_path / "cohort-mirror.duckdb")
    accessions = _build_cohort_mirror(path)
    svc = SRAMirrorService(path)
    assert svc.is_available()
    return svc, accessions


class TestCohortForAccessions:
    """Counts over a complete pre-cap hit set.

    The paged hit list is the top of a global score sort, so summarizing it
    summarizes the cap: on the measured 1,133,516-hit job the surviving 50,000
    put E. coli first at 70% and dropped Salmonella enterica, the real leader,
    out of the top five. These cover the properties that make the pre-cap
    numbers worth trusting instead.
    """

    def test_total_is_the_hit_count_the_caller_passed(self, cohort_mirror):
        svc, accessions = cohort_mirror
        # Unmirrored accessions are the norm -- Logan indexes all of SRA and
        # the mirror doesn't -- so `total` has to stay the caller's hit count
        # (it is shown as total_matches) while `in_mirror` carries the join.
        cohort = svc.cohort_for_accessions(accessions + ["SRR_NOT_MIRRORED"])
        assert cohort["total"] == len(accessions) + 1
        assert cohort["in_mirror"] == len(accessions)

    def test_distinct_counts_come_from_the_whole_set(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        # Salmonella, E. coli, Shigella -- the blank-named run is not a fourth.
        assert cohort["organisms"] == 3
        assert cohort["bioprojects"] == 2
        assert cohort["studies"] == 2
        # USA, United Kingdom, Kenya. Not 'uncalculated', not NULL.
        assert cohort["countries"] == 3

    def test_uncalculated_sentinel_is_unknown_not_a_country(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        country = next(f for f in cohort["facets"] if f["name"] == "country")

        assert "uncalculated" not in [v["value"] for v in country["values"]]
        # Five sentinel rows plus four genuinely NULL ones.
        assert country["unknown"] == 9

    def test_unspecified_sentinel_is_unknown_not_an_instrument(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        instrument = next(f for f in cohort["facets"] if f["name"] == "instrument")

        assert "unspecified" not in [v["value"] for v in instrument["values"]]
        # instrument carries no NULLs and no blanks -- mirror-wide, not just
        # here -- so the sentinel is the only thing that can make `unknown`
        # non-zero. Without this it is structurally 0, which claims every
        # matched run has a recorded instrument.
        assert instrument["unknown"] == 6
        # And it is genuinely excluded rather than swallowed by the tail: at 6
        # rows it outranks every listed instrument but MiSeq, so an unfixed
        # facet would have named it, not rolled it into `other`.
        assert min(v["count"] for v in instrument["values"]) < 6

    def test_every_facet_reconciles_to_in_mirror(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        # Every matched row lands in exactly one of values/other/unknown, which
        # is what lets a reader check the facet rather than take it on faith.
        for facet in cohort["facets"]:
            listed = sum(v["count"] for v in facet["values"])
            assert listed + facet["other"] + facet["unknown"] == cohort["in_mirror"], (
                facet["name"]
            )

    def test_long_tail_rolls_into_other(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        instrument = next(f for f in cohort["facets"] if f["name"] == "instrument")

        from app.services.sra_mirror import _COHORT_FACET_VALUES

        assert len(instrument["values"]) == _COHORT_FACET_VALUES
        # Sixteen distinct instruments, ten listed, so the rest are counted.
        assert instrument["other"] > 0

    def test_short_facets_list_every_value_with_no_other(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        layout = next(f for f in cohort["facets"] if f["name"] == "librarylayout")

        assert {v["value"] for v in layout["values"]} == {"PAIRED", "SINGLE"}
        assert layout["other"] == 0

    def test_blank_values_are_unknown_rather_than_a_value(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        assay = next(f for f in cohort["facets"] if f["name"] == "assay_type")

        assert assay["unknown"] == 1
        assert all(v["value"] for v in assay["values"])

    def test_release_year_buckets_by_year_and_nulls_are_unknown(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        years = next(f for f in cohort["facets"] if f["name"] == "release_year")

        assert {v["value"] for v in years["values"]} == {"2020", "2023"}
        # The one run with no release date.
        assert years["unknown"] == 1

    def test_top_organisms_are_ranked_and_exclude_blanks(self, cohort_mirror):
        svc, accessions = cohort_mirror
        cohort = svc.cohort_for_accessions(accessions)
        names = [o["value"] for o in cohort["top_organisms"]]

        assert names == ["Salmonella enterica", "Escherichia coli", "Shigella sonnei"]
        # 20 + 5 sentinel-country + 4 null-country + 2 nanopore + 2 odd rows.
        assert cohort["top_organisms"][0]["count"] == 33

    def test_hit_set_larger_than_the_accession_batch_size(self, cohort_mirror):
        # runs_by_accession chunks at 500 because it serves a page; the cohort
        # cannot chunk at all, since count(DISTINCT ...) does not merge across
        # batches. This proves it takes the whole set in one pass.
        from app.services.sra_mirror import _ACCESSION_BATCH_SIZE

        svc, accessions = cohort_mirror
        padding = [f"SRRPAD{i:06d}" for i in range(_ACCESSION_BATCH_SIZE * 3)]
        cohort = svc.cohort_for_accessions(accessions + padding)

        assert cohort["total"] == len(accessions) + len(padding)
        assert cohort["in_mirror"] == len(accessions)
        assert cohort["organisms"] == 3

    def test_unavailable_mirror_returns_none(self):
        svc = SRAMirrorService("")
        assert svc.is_available() is False
        assert svc.cohort_for_accessions(["SRR001"]) is None

    def test_empty_hit_set_returns_none(self, cohort_mirror):
        svc, _accessions = cohort_mirror
        assert svc.cohort_for_accessions([]) is None
        assert svc.cohort_for_accessions(["", "  "]) is None

    def test_query_failure_raises_rather_than_returning_a_partial_cohort(
        self, cohort_mirror, monkeypatch
    ):
        # The caller has to be able to tell a broken read from an absent
        # mirror, because only one of the two is worth retrying -- and a
        # half-filled cohort would undermine the one thing it is for.
        from app.services import sra_mirror as sra_mod

        svc, accessions = cohort_mirror
        monkeypatch.setattr(sra_mod, "_cohort_sql", lambda: "SELECT * FROM no_such")
        with pytest.raises(duckdb.Error):
            svc.cohort_for_accessions(accessions)

    def test_staging_file_is_removed_even_when_the_query_fails(
        self, cohort_mirror, monkeypatch, tmp_path
    ):
        import tempfile

        from app.services import sra_mirror as sra_mod

        svc, accessions = cohort_mirror
        staging_dir = tmp_path / "staging"
        staging_dir.mkdir()
        monkeypatch.setattr(tempfile, "tempdir", str(staging_dir))

        svc.cohort_for_accessions(accessions)
        assert list(staging_dir.iterdir()) == []

        monkeypatch.setattr(sra_mod, "_cohort_sql", lambda: "SELECT * FROM no_such")
        with pytest.raises(duckdb.Error):
            svc.cohort_for_accessions([a + "X" for a in accessions])
        assert list(staging_dir.iterdir()) == []

    def test_repeat_call_is_served_from_the_cache(self, cohort_mirror, monkeypatch):
        from app.services import sra_mirror as sra_mod

        svc, accessions = cohort_mirror
        first = svc.cohort_for_accessions(accessions)
        # Any second trip to DuckDB would now fail, so an equal result proves
        # the cache answered.
        monkeypatch.setattr(sra_mod, "_cohort_sql", lambda: "SELECT * FROM no_such")
        assert svc.cohort_for_accessions(accessions) == first

    def test_cached_cohort_is_not_mutated_by_a_caller(self, cohort_mirror):
        svc, accessions = cohort_mirror
        first = svc.cohort_for_accessions(accessions)
        first["in_mirror"] = -1
        first["facets"][0]["values"].append({"count": 1, "value": "BOGUS"})

        second = svc.cohort_for_accessions(accessions)
        assert second["in_mirror"] == len(accessions)
        assert all(v["value"] != "BOGUS" for v in second["facets"][0]["values"])

    def test_cohort_does_not_serialize_on_the_shared_lock(self, cohort_mirror):
        """The heavy query must run off the instance lock.

        @_synchronized holds it for a whole call and justifies that with
        "queries are sub-200ms"; this one is ~1s on a real hit set, so holding
        the lock would park every MCP tool call behind one user's search. The
        probe below calls a @_synchronized method from another thread while
        the cohort query is in flight: if the lock were held, it would block
        until the query finished and `probed` would still be clear.
        """
        import threading

        from app.services import sra_mirror as sra_mod

        svc, accessions = cohort_mirror
        real_sql = sra_mod._cohort_sql()
        in_query = threading.Event()
        probed = threading.Event()

        def probing_sql() -> str:
            # Called after the cursor is taken and before execute(), i.e. from
            # exactly the stretch that must not hold the lock.
            in_query.set()
            probed.wait(timeout=5)
            return real_sql

        def probe():
            in_query.wait(timeout=5)
            svc.search_runs("Plasmodium falciparum", limit=1)
            probed.set()

        thread = threading.Thread(target=probe)
        thread.start()
        try:
            with pytest.MonkeyPatch.context() as patch:
                patch.setattr(sra_mod, "_cohort_sql", probing_sql)
                cohort = svc.cohort_for_accessions(accessions)
        finally:
            probed.set()
            thread.join(timeout=5)

        assert probed.is_set(), "a synchronized call blocked on the cohort query"
        assert cohort["in_mirror"] == len(accessions)

    def test_cohort_method_is_not_wrapped_in_the_lock_decorator(self):
        # Structural guard for the same thing: @_synchronized would wrap it.
        assert not hasattr(SRAMirrorService.cohort_for_accessions, "__wrapped__")
        assert hasattr(SRAMirrorService.runs_by_accession, "__wrapped__")
