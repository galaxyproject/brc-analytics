"""Tests for the Galaxy/kmindex service layer.

These cover the failure modes where an incomplete result could be presented --
or worse, cached -- as a complete one, plus the merge-time bookkeeping. They
stub bioblend rather than touching a real Galaxy instance.
"""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.models.galaxy import (
    MAX_INDEXES,
    MAX_QUERY_BASES,
    KmindexQuerySubmission,
)
from app.services import galaxy_service
from app.services.galaxy_service import (
    KMINDEX_UNATTRIBUTED,
    GalaxyService,
    _submitted_index_names,
)


@pytest.fixture()
def service(monkeypatch):
    """A GalaxyService with a stub Galaxy connection and a no-op cache."""
    monkeypatch.setenv("GALAXY_API_KEY", "test-key")
    from app.core.config import get_settings

    get_settings.cache_clear()

    cache = MagicMock()
    cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock(return_value=True)
    cache.make_key = MagicMock(return_value="k")

    svc = GalaxyService(cache)
    svc.gi = MagicMock()
    svc._galaxy_available = True
    yield svc
    get_settings.cache_clear()


class TestJobOutputsFailFast:
    """A failure reading outputs must not look like 'this job had no outputs'."""

    @pytest.mark.asyncio
    async def test_show_dataset_failure_raises_rather_than_returning_empty(
        self, service
    ):
        service.gi.jobs.show_job = MagicMock(
            return_value={"outputs": {"out1": {"id": "ds1"}}}
        )
        service.gi.datasets.show_dataset = MagicMock(
            side_effect=RuntimeError("429 Too Many Requests")
        )

        with pytest.raises(Exception, match="Failed to get outputs"):
            await service._get_job_outputs("job1")

    @pytest.mark.asyncio
    async def test_show_job_failure_raises(self, service):
        service.gi.jobs.show_job = MagicMock(side_effect=RuntimeError("boom"))

        with pytest.raises(Exception, match="Failed to get outputs"):
            await service._get_job_outputs("job1")


class TestAggregateRefusesEmptyOutputs:
    """A successful kmindex job always writes shards; zero means we misread."""

    @pytest.mark.asyncio
    async def test_successful_job_with_no_outputs_is_refused(self, service):
        status = MagicMock(is_complete=True, is_successful=True, state="ok", outputs=[])
        service.get_job_status = AsyncMock(return_value=status)

        with pytest.raises(Exception, match="exposed no output datasets"):
            await service._aggregate_shards("job1")

        # The point of raising is that nothing gets written to the cache.
        service.cache.set.assert_not_called()


class TestMergeBookkeeping:
    """Shard accounting and ordering across the merged hit list."""

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True, is_successful=True, state="ok", outputs=outputs
        )

    @pytest.mark.asyncio
    async def test_shards_with_hits_counts_shards_not_query_pairs(self, service):
        # One shard carrying two query records must still count once.
        shard = {
            "IDX_1": {
                "queryA": {"SRR1": 0.9},
                "queryB": {"SRR2": 0.8},
            }
        }
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(return_value=shard)

        aggregate = await service._aggregate_shards("job1")

        assert aggregate["shards_searched"] == 1
        assert aggregate["shards_with_hits"] == 1
        assert aggregate["shards_with_hits"] <= aggregate["shards_searched"]

    @pytest.mark.asyncio
    async def test_equal_scores_order_deterministically(self, service):
        # Same hits, shards arriving in opposite order, must page identically.
        shard_a = {"IDX_1": {"q": {"SRRb": 0.5, "SRRa": 0.5}}}
        shard_b = {"IDX_2": {"q": {"SRRd": 0.5, "SRRc": 0.5}}}

        service.get_job_status = AsyncMock(return_value=self._status(2))

        service._download_shard = AsyncMock(side_effect=[shard_a, shard_b])
        first = await service._aggregate_shards("job1")

        service._download_shard = AsyncMock(side_effect=[shard_b, shard_a])
        second = await service._aggregate_shards("job1")

        assert [h["accession"] for h in first["hits"]] == [
            h["accession"] for h in second["hits"]
        ]

    @pytest.mark.asyncio
    async def test_failed_shards_are_counted_and_not_cached(self, service):
        service.get_job_status = AsyncMock(return_value=self._status(2))
        service._download_shard = AsyncMock(
            side_effect=[{"IDX_1": {"q": {"SRR1": 0.9}}}, None, None]
        )

        aggregate = await service._aggregate_shards("job1")

        assert aggregate["shards_failed"] == 1
        service.cache.set.assert_not_called()


class TestQueryValidation:
    """One sequence per query -- see the merge note on KmindexQuerySubmission."""

    def test_multi_record_fasta_rejected(self):
        with pytest.raises(ValidationError, match="one sequence per query"):
            KmindexQuerySubmission(
                sequence=">a\nACGT\n>b\nTTTT\n", indexes=["GENOMIC_BCT"]
            )

    def test_single_record_accepted(self):
        submission = KmindexQuerySubmission(
            sequence=">a\nACGT\n", indexes=["GENOMIC_BCT"]
        )
        assert submission.indexes == ["GENOMIC_BCT"]

    def test_headerless_sequence_accepted(self):
        assert KmindexQuerySubmission(sequence="ACGT", indexes=["GENOMIC_BCT"])


class TestQueryLengthCap:
    """The UI enforces the same ceiling, but the UI is not the only caller."""

    def test_over_limit_rejected(self):
        with pytest.raises(ValidationError, match="the limit is 2500"):
            KmindexQuerySubmission(
                sequence=">q\n" + "A" * (MAX_QUERY_BASES + 1), indexes=["GENOMIC_BCT"]
            )

    def test_at_limit_accepted(self):
        assert KmindexQuerySubmission(
            sequence=">q\n" + "A" * MAX_QUERY_BASES, indexes=["GENOMIC_BCT"]
        )

    def test_header_and_newlines_do_not_count_toward_the_limit(self):
        """A long header shouldn't push an otherwise-legal query over."""
        wrapped = "\n".join("A" * 60 for _ in range(MAX_QUERY_BASES // 60))
        assert KmindexQuerySubmission(
            sequence=">" + "n" * 200 + "\n" + wrapped, indexes=["GENOMIC_BCT"]
        )

    def test_oversized_payload_rejected_before_parsing(self):
        """max_length guards against a multi-megabyte body reaching the validators."""
        with pytest.raises(ValidationError):
            KmindexQuerySubmission(sequence="A" * 100_000, indexes=["GENOMIC_BCT"])


class TestIndexSelection:
    """kmindex_query's select is multiple="true"; the cap on it is ours."""

    def test_multiple_indexes_accepted(self):
        submission = KmindexQuerySubmission(
            sequence="ACGT", indexes=["GENOMIC_BCT", "METAGENOMIC_ENV"]
        )
        assert submission.indexes == ["GENOMIC_BCT", "METAGENOMIC_ENV"]

    def test_duplicates_collapse(self):
        """A repeated index would merge its hits into the ranked list twice."""
        submission = KmindexQuerySubmission(
            sequence="ACGT", indexes=["GENOMIC_BCT", "GENOMIC_BCT"]
        )
        assert submission.indexes == ["GENOMIC_BCT"]

    def test_blanks_dropped(self):
        submission = KmindexQuerySubmission(
            sequence="ACGT", indexes=["  GENOMIC_BCT  ", "", "   "]
        )
        assert submission.indexes == ["GENOMIC_BCT"]

    def test_selection_order_preserved(self):
        submission = KmindexQuerySubmission(
            sequence="ACGT", indexes=["METAGENOMIC_ENV", "GENOMIC_BCT"]
        )
        assert submission.indexes == ["METAGENOMIC_ENV", "GENOMIC_BCT"]

    def test_empty_list_rejected(self):
        with pytest.raises(ValidationError):
            KmindexQuerySubmission(sequence="ACGT", indexes=[])

    def test_all_blank_rejected(self):
        with pytest.raises(ValidationError):
            KmindexQuerySubmission(sequence="ACGT", indexes=["", "  "])

    def test_over_the_cap_rejected(self):
        with pytest.raises(ValidationError):
            KmindexQuerySubmission(
                sequence="ACGT", indexes=[f"IDX_{n}" for n in range(MAX_INDEXES + 1)]
            )

    def test_at_the_cap_accepted(self):
        assert KmindexQuerySubmission(
            sequence="ACGT", indexes=[f"IDX_{n}" for n in range(MAX_INDEXES)]
        )


class TestTieBreakIsArchiveNeutral:
    """
    Equal scores are the common case, not an edge case.

    A conserved query against GENOMIC_BCT returned 305,061 hits scoring exactly
    1.0 against a 50,000 cap, so the cap boundary falls inside one tie band and
    the tie-break alone chooses the result set. Ordering by accession orders by
    archive prefix, and the prefix predicts submitting country.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True, is_successful=True, state="ok", outputs=outputs
        )

    @pytest.mark.asyncio
    async def test_all_archives_survive_a_tie_band(self, service):
        # Every hit scores the same, so ordering is entirely the tie-break.
        # Alphabetically DRR < ERR < SRR, so an accession sort keeps only DRR.
        hits = {}
        for prefix in ("DRR", "ERR", "SRR"):
            for n in range(300):
                hits[f"{prefix}{n:06d}"] = 1.0
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(return_value={"IDX_1": {"q": hits}})

        aggregate = await service._aggregate_shards("job1")

        head = [h["accession"][:3] for h in aggregate["hits"][:300]]
        assert set(head) == {"DRR", "ERR", "SRR"}, (
            f"one archive monopolises the head of the tie band; got {sorted(set(head))}"
        )
        # Proportional to within a wide margin -- this guards against a
        # systematic bias, not against sampling noise.
        for prefix in ("DRR", "ERR", "SRR"):
            assert 50 < head.count(prefix) < 150

    @pytest.mark.asyncio
    async def test_ordering_is_still_deterministic(self, service):
        hits = {f"SRR{n:06d}": 0.5 for n in range(50)}
        service.get_job_status = AsyncMock(return_value=self._status(1))

        service._download_shard = AsyncMock(return_value={"IDX_1": {"q": hits}})
        first = await service._aggregate_shards("job1")
        service._download_shard = AsyncMock(return_value={"IDX_1": {"q": hits}})
        second = await service._aggregate_shards("job1")

        assert [h["accession"] for h in first["hits"]] == [
            h["accession"] for h in second["hits"]
        ]


class TestCapReporting:
    """
    The cap has to be legible from the response, not merely applied.

    One real job matched 1,133,516 accessions against the 50,000 cap. Reporting
    the cap as the hit count presents 4.4% of the answer as the whole of it,
    and a caller has no way to tell that from an uncapped search.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True, is_successful=True, state="ok", outputs=outputs
        )

    @staticmethod
    def _job(indexes):
        # The shape both real probe jobs came back in: Galaxy echoes the whole
        # db_opts conditional as one JSON string rather than the flat key the
        # job was submitted with.
        return {
            "params": {
                "db_opts": json.dumps(
                    {
                        "__current_case__": 1,
                        "db_opts_selector": "db",
                        "kmindex": indexes,
                    }
                )
            }
        }

    @pytest.mark.asyncio
    async def test_total_matches_exceeds_total_hits_when_truncated(
        self, service, monkeypatch
    ):
        # Shrink the cap rather than build 50,001 hits; the reporting is what's
        # under test, not the constant.
        monkeypatch.setattr(galaxy_service, "KMINDEX_MAX_HITS", 10)
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={
                "GENOMIC_BCT_10_null": {"q": {f"SRR{n:06d}": 1.0 for n in range(25)}}
            }
        )

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.truncated is True
        # total_hits is what's pageable, so it stays post-cap.
        assert results.total_hits == 10
        assert results.total_matches == 25

    @pytest.mark.asyncio
    async def test_total_matches_equals_total_hits_when_not_truncated(self, service):
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={
                "GENOMIC_BCT_10_null": {"q": {f"SRR{n:06d}": 1.0 for n in range(25)}}
            }
        )

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.truncated is False
        assert results.total_matches == results.total_hits == 25

    @pytest.mark.asyncio
    async def test_per_index_counts_sum_to_the_totals(self, service, monkeypatch):
        monkeypatch.setattr(galaxy_service, "KMINDEX_MAX_HITS", 10)
        # The big index outscores the small one throughout, which is what a
        # single global score sort does to a small index in practice.
        big = {f"SRR{n:06d}": 0.9 for n in range(20)}
        small = {f"ERR{n:06d}": 0.2 for n in range(8)}
        service.gi.jobs.show_job = MagicMock(
            return_value=self._job(["GENOMIC_BCT", "METATRANSCRIPTOMIC_BCT"])
        )
        service.get_job_status = AsyncMock(return_value=self._status(2))
        service._download_shard = AsyncMock(
            side_effect=[
                {"GENOMIC_BCT_2": {"q": big}},
                {"METATRANSCRIPTOMIC_BCT_31": {"q": small}},
            ]
        )

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.total_matches == 28
        assert (
            sum(s.hits_before_cap for s in results.per_index) == results.total_matches
        )
        assert sum(s.hits_after_cap for s in results.per_index) == results.total_hits

        by_index = {s.index: s for s in results.per_index}
        assert by_index["GENOMIC_BCT"].hits_before_cap == 20
        assert by_index["METATRANSCRIPTOMIC_BCT"].hits_before_cap == 8
        # The small index contributed nothing pageable, which is exactly the
        # thing the breakdown exists to say out loud.
        assert by_index["METATRANSCRIPTOMIC_BCT"].hits_after_cap == 0


class TestSubmittedIndexNames:
    """
    The submitted list is read off the job, so every shape it arrives in counts.

    Both real probe jobs echoed the db_opts conditional as one JSON string
    carrying a list, but the flat key is what the job is submitted with and a
    select that took one value can come back as a bare name.
    """

    def test_nested_json_encoded_section(self):
        params = {
            "db_opts": json.dumps(
                {
                    "__current_case__": 1,
                    "db_opts_selector": "db",
                    "kmindex": ["GENOMIC_BCT", "METATRANSCRIPTOMIC_BCT"],
                }
            )
        }

        assert _submitted_index_names(params) == [
            "GENOMIC_BCT",
            "METATRANSCRIPTOMIC_BCT",
        ]

    def test_nested_section_already_decoded(self):
        params = {"db_opts": {"kmindex": ["GENOMIC_BCT"]}}

        assert _submitted_index_names(params) == ["GENOMIC_BCT"]

    def test_flat_key_carrying_a_list(self):
        params = {"db_opts|kmindex": ["GENOMIC_BCT", "GENOMIC_VRL"]}

        assert _submitted_index_names(params) == ["GENOMIC_BCT", "GENOMIC_VRL"]

    def test_single_index_echoed_as_a_bare_string(self):
        assert _submitted_index_names({"db_opts|kmindex": "GENOMIC_BCT"}) == [
            "GENOMIC_BCT"
        ]

    def test_json_encoded_list_under_the_flat_key(self):
        params = {"db_opts|kmindex": '["GENOMIC_BCT", "GENOMIC_VRL"]'}

        assert _submitted_index_names(params) == ["GENOMIC_BCT", "GENOMIC_VRL"]

    def test_blanks_dropped(self):
        params = {"db_opts|kmindex": ["  GENOMIC_BCT  ", "", "   "]}

        assert _submitted_index_names(params) == ["GENOMIC_BCT"]

    def test_missing_or_unusable_params_yield_no_names(self):
        assert _submitted_index_names(None) == []
        assert _submitted_index_names({}) == []
        assert _submitted_index_names({"db_opts": "not json"}) == []


class TestIndexAttribution:
    """
    Whose hits the cap dropped, answered from the job's own submitted list.

    Shard keys are the only per-hit provenance kmindex gives us, so attribution
    is a name match -- and the names have to come from the job rather than from
    a live tool lookup, which needs a history and answers for the instance's
    configuration today rather than for this job.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True, is_successful=True, state="ok", outputs=outputs
        )

    @staticmethod
    def _job(indexes):
        return {
            "params": {
                "db_opts": json.dumps(
                    {
                        "__current_case__": 1,
                        "db_opts_selector": "db",
                        "kmindex": indexes,
                    }
                )
            }
        }

    @pytest.mark.asyncio
    async def test_attribution_handles_all_three_shard_key_forms(self, service):
        # One job emitted "GENOMIC_BCT_10_null", "GENOMIC_BCT_2" and
        # "GENOMIC_BCT_21_0" side by side, and index names contain underscores,
        # so nothing but a match against the submitted names recovers the index.
        service.gi.jobs.show_job = MagicMock(
            return_value=self._job(["GENOMIC_BCT", "METATRANSCRIPTOMIC_BCT"])
        )
        service.get_job_status = AsyncMock(return_value=self._status(4))
        service._download_shard = AsyncMock(
            side_effect=[
                {"GENOMIC_BCT_10_null": {"q": {"SRR1": 0.9}}},
                {"GENOMIC_BCT_2": {"q": {"SRR2": 0.9}}},
                {"GENOMIC_BCT_21_0": {"q": {"SRR3": 0.9}}},
                {"METATRANSCRIPTOMIC_BCT_10": {"q": {"SRR4": 0.9}}},
            ]
        )

        aggregate = await service._aggregate_shards("job1")

        counts = {s["index"]: s["hits_before_cap"] for s in aggregate["per_index"]}
        assert counts == {"GENOMIC_BCT": 3, "METATRANSCRIPTOMIC_BCT": 1}

    @pytest.mark.asyncio
    async def test_longest_index_name_wins_the_shard(self, service):
        # METATRANSCRIPTOMIC_BCT's shards must not be claimed by a shorter name
        # that happens to prefix it.
        service.gi.jobs.show_job = MagicMock(
            return_value=self._job(["METATRANSCRIPTOMIC", "METATRANSCRIPTOMIC_BCT"])
        )
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"METATRANSCRIPTOMIC_BCT_31": {"q": {"SRR1": 0.9}}}
        )

        aggregate = await service._aggregate_shards("job1")

        counts = {s["index"]: s["hits_before_cap"] for s in aggregate["per_index"]}
        assert counts == {"METATRANSCRIPTOMIC_BCT": 1, "METATRANSCRIPTOMIC": 0}

    @pytest.mark.asyncio
    async def test_submitted_index_that_matched_nothing_still_gets_a_row(self, service):
        # The eight-index job searched METAGENOMIC_UNKNOWN and the cap took all
        # 39 of its hits. Dropping the row entirely makes "I added an index and
        # got nothing back" indistinguishable from never having searched it --
        # which is the case this breakdown exists to expose.
        service.gi.jobs.show_job = MagicMock(
            return_value=self._job(["GENOMIC_BCT", "METAGENOMIC_UNKNOWN"])
        )
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 0.9}}}
        )

        aggregate = await service._aggregate_shards("job1")

        assert aggregate["per_index"] == [
            {"hits_after_cap": 1, "hits_before_cap": 1, "index": "GENOMIC_BCT"},
            {
                "hits_after_cap": 0,
                "hits_before_cap": 0,
                "index": "METAGENOMIC_UNKNOWN",
            },
        ]
        assert (
            sum(s["hits_before_cap"] for s in aggregate["per_index"])
            == aggregate["total_matches"]
        )

    @pytest.mark.asyncio
    async def test_shard_matching_no_submitted_name_is_named_not_dropped(self, service):
        # The breakdown is only worth trusting if it accounts for every row, so
        # a shard we can't place has to show up rather than shrink the totals.
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"MYSTERY_9": {"q": {"SRR1": 0.9, "SRR2": 0.8}}}
        )

        aggregate = await service._aggregate_shards("job1")

        counts = {s["index"]: s["hits_before_cap"] for s in aggregate["per_index"]}
        assert counts == {KMINDEX_UNATTRIBUTED: 2, "GENOMIC_BCT": 0}
        assert (
            sum(s["hits_before_cap"] for s in aggregate["per_index"])
            == aggregate["total_matches"]
        )

    @pytest.mark.asyncio
    async def test_unreadable_submitted_list_is_not_cached(self, service):
        # Everything lands in the unattributed bucket, which is honest but not
        # worth keeping for a day beside a hit list that is otherwise fine --
        # there would be no way to refresh it.
        service.gi.jobs.show_job = MagicMock(side_effect=RuntimeError("no galaxy"))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 0.9}}}
        )

        aggregate = await service._aggregate_shards("job1")

        assert [s["index"] for s in aggregate["per_index"]] == [KMINDEX_UNATTRIBUTED]
        service.cache.set.assert_not_called()

    @pytest.mark.asyncio
    async def test_results_path_creates_no_history(self, service):
        # Reading the tool's option list needs a history, and that lookup's
        # error path creates a fresh timestamped one on every call. A results
        # read is not allowed to write to Galaxy.
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 0.9}}}
        )

        results = await service.get_kmindex_results("job1")

        assert [s.index for s in results.per_index] == ["GENOMIC_BCT"]
        service.gi.histories.create_history.assert_not_called()
        service.gi.histories.get_histories.assert_not_called()
        service.gi.tools.build.assert_not_called()


class TestVersionedAggregateCacheKey:
    """
    An aggregate cached before the breakdown existed has to read as a miss.

    clear_caches() does not reach this namespace and the entries live a day, so
    after a deploy the only thing standing between a warm pre-change entry and
    a response claiming 50,000 matches with none of them missing is the key.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True, is_successful=True, state="ok", outputs=outputs
        )

    @staticmethod
    def _job(indexes):
        return {
            "params": {
                "db_opts": json.dumps(
                    {
                        "__current_case__": 1,
                        "db_opts_selector": "db",
                        "kmindex": indexes,
                    }
                )
            }
        }

    @pytest.mark.asyncio
    async def test_pre_version_entry_is_a_miss_and_is_recomputed(self, service):
        stale = {
            "hits": [{"accession": "SRR9", "score": 0.9, "shard": "GENOMIC_BCT_2"}],
            "query_name": "q",
            "shards_failed": 0,
            "shards_searched": 1,
            "shards_with_hits": 1,
            "truncated": True,
        }
        store = {"galaxy:kmindex_agg:job1": stale}
        service.cache.make_key = MagicMock(
            side_effect=lambda prefix, params: f"{prefix}:{params['job_id']}"
        )
        service.cache.get = AsyncMock(side_effect=lambda key: store.get(key))
        service.cache.set = AsyncMock(
            side_effect=lambda key, value, ttl: store.__setitem__(key, value)
        )
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 0.9, "SRR2": 0.8}}}
        )

        results = await service.get_kmindex_results("job1")

        # The stale entry is untouched and the recomputed one lands beside it.
        assert store["galaxy:kmindex_agg:job1"] is stale
        assert "galaxy:kmindex_agg:v2:job1" in store
        # Recomputed, so the pre-cap count is real rather than the cap restated.
        assert results.total_matches == results.total_hits == 2
        assert results.truncated is False
        assert [s.index for s in results.per_index] == ["GENOMIC_BCT"]
