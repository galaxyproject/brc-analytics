"""Tests for the Galaxy/kmindex service layer.

These cover the failure modes where an incomplete result could be presented --
or worse, cached -- as a complete one, plus the merge-time bookkeeping. They
stub bioblend rather than touching a real Galaxy instance.

Mocked job statuses carry params=None, which models a status that did not come
with the job's parameters -- one served from the status cache, where the field
is excluded. The code under test then falls back to the stubbed show_job, which
is the path most of these tests are exercising. TestJobMetadataIsFetchedOnce
covers the other side, where the parameters are carried and no fetch happens.
"""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.core.cache import CacheTTL
from app.models.galaxy import (
    MAX_INDEXES,
    MAX_QUERY_BASES,
    GalaxyJobState,
    GalaxyJobStatus,
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
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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

    def test_unreadable_params_are_none_not_an_empty_selection(self):
        # None rather than [], because the caller decides whether to cache on
        # exactly this distinction: [] is a selection that named nothing, while
        # None is "this job carries no readable selection".
        assert _submitted_index_names(None) is None
        assert _submitted_index_names({}) is None
        assert _submitted_index_names({"db_opts": "not json"}) is None
        assert _submitted_index_names({"db_opts|kmindex": {"unexpected": 1}}) is None

    def test_histdb_job_carrying_no_kmindex_key_is_unreadable(self):
        # The tool's db_opts conditional has a second case: a user-supplied
        # index file, which carries no kmindex key at all. The results endpoint
        # accepts an arbitrary job id, so this shape is reachable rather than
        # hypothetical -- and it used to parse as [].
        params = {
            "db_opts": json.dumps(
                {
                    "__current_case__": 0,
                    "db_opts_selector": "histdb",
                    "histdb": {"values": [{"id": "abc123", "src": "hda"}]},
                }
            )
        }

        assert _submitted_index_names(params) is None

    def test_an_explicitly_empty_selection_is_readable_and_empty(self):
        # Parsed, so it is a list -- the other half of the distinction above.
        assert _submitted_index_names({"db_opts|kmindex": []}) == []
        assert _submitted_index_names({"db_opts|kmindex": ["  ", ""]}) == []


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
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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
    async def test_histdb_job_is_not_cached_as_all_unattributed(self, service):
        """A job whose parameters carry no kmindex key must not be cached.

        The names used to come back as [] for every shape that could not be
        parsed, which sailed past the `is None` guard and wrote a
        100%-(unattributed) breakdown with a one-day TTL and no refresh path --
        precisely the state that guard exists to prevent.
        """
        service.gi.jobs.show_job = MagicMock(
            return_value={
                "params": {
                    "db_opts": json.dumps(
                        {
                            "__current_case__": 0,
                            "db_opts_selector": "histdb",
                            "histdb": {"values": [{"id": "abc123", "src": "hda"}]},
                        }
                    )
                }
            }
        )
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 1.0, "SRR2": 0.9}}}
        )

        aggregate = await service._aggregate_shards("job1")

        # Still served: the hits are real, only the attribution is unknown.
        assert [s["index"] for s in aggregate["per_index"]] == [KMINDEX_UNATTRIBUTED]
        assert aggregate["total_matches"] == 2
        # But not frozen that way for a day.
        service.cache.set.assert_not_called()

    @pytest.mark.asyncio
    async def test_readable_but_empty_selection_with_hits_is_not_cached(self, service):
        # Distinguishable from unreadable, but it still attributes every hit to
        # nothing, which is the same unrefreshable state -- so the same refusal.
        service.gi.jobs.show_job = MagicMock(
            return_value={"params": {"db_opts|kmindex": []}}
        )
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={"GENOMIC_BCT_2": {"q": {"SRR1": 1.0}}}
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
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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


def _cohort_payload(total: int, in_mirror: int) -> dict:
    """A cohort shaped like the mirror really returns one.

    Counts reconcile the way the real query guarantees -- values + other +
    unknown == in_mirror on every facet -- and the country facet carries SRA's
    'uncalculated' sentinel in `unknown` rather than as a value, which is the
    thing that would otherwise render as a top-three country.

    @param total: hits before the cap, i.e. total_matches.
    @param in_mirror: how many of those the mirror knows.
    @returns: the cohort dict as the mirror service hands it over.
    """
    return {
        "bioprojects": 19014,
        "countries": 186,
        "facets": [
            {
                "name": "country",
                "other": 4,
                "unknown": 6,
                "values": [
                    {"count": in_mirror - 12, "value": "USA"},
                    {"count": 2, "value": "United Kingdom"},
                ],
            },
            {
                "name": "platform",
                "other": 0,
                "unknown": 0,
                "values": [{"count": in_mirror, "value": "ILLUMINA"}],
            },
        ],
        "in_mirror": in_mirror,
        "organisms": 10927,
        "studies": 19148,
        "top_organisms": [{"count": in_mirror, "value": "Salmonella enterica"}],
        "total": total,
    }


def _geography_payload(in_mirror: int) -> dict:
    """Geography shaped like the mirror really returns it.

    The parts reconcile the way the real query guarantees -- drawn +
    unplaceable + unknown == in_mirror -- and both kinds of unplaceable are
    present: Singapore, which is a country with no shape at 1:110m, and
    Borneo, which is not a country.

    @param in_mirror: matched accessions the mirror knows.
    @returns: the geography dict as the mirror service hands it over.
    """
    drawn = in_mirror - 5
    return {
        "continents": [
            {"count": drawn, "value": "North America"},
            {"count": 3, "value": "Asia"},
        ],
        "countries": [
            {
                "count": drawn,
                "iso_a3": "USA",
                "iso_n3": "840",
                "value": "United States of America",
            }
        ],
        "in_mirror": in_mirror,
        "recorded": in_mirror - 2,
        "unknown": 2,
        "unmapped_countries": [
            {"count": 3, "value": "Singapore"},
            {"count": 2, "value": "Borneo"},
        ],
    }


def duckdb_binder_error() -> Exception:
    """The shape a mirror on an older schema fails with, every single call."""
    return RuntimeError(
        'Binder Error: Referenced column "geo_loc_name_country_calc" not found'
    )


class TestCohortOverTheFullHitSet:
    """
    The cohort has to describe the query, not the cap.

    The visible rows are the top of a global score sort, so counting them
    counts the truncation: on the real 1,133,516-hit job the surviving 50,000
    reported E. coli first at 70.2% when the true leader was Salmonella
    enterica at 29.2% -- which the capped set does not contain at all -- and
    947 organisms where the full set has 10,927.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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

    def _mirror(self, service, cohort=None, side_effect=None):
        """Attach a stub SRA mirror to `service`.

        @param service: the GalaxyService under test.
        @param cohort: dict the mirror returns for the full hit set.
        @param side_effect: raise this instead, to model a broken read.
        @returns: the stub, so a test can inspect the call it received.
        """
        mirror = MagicMock()
        mirror.is_available = MagicMock(return_value=True)
        mirror.has_capability = MagicMock(return_value=True)
        mirror.cohort_for_accessions = MagicMock(
            return_value=cohort, side_effect=side_effect
        )
        mirror.geography_for_accessions = MagicMock(
            return_value=_geography_payload(24) if cohort else None
        )
        service.sra_mirror = mirror
        return mirror

    def _wire(self, service, hits=25):
        """Point the service at one shard carrying `hits` equal-scoring hits."""
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={
                "GENOMIC_BCT_10_null": {"q": {f"SRR{n:06d}": 1.0 for n in range(hits)}}
            }
        )

    @pytest.mark.asyncio
    async def test_cohort_is_computed_from_every_hit_not_the_capped_page(
        self, service, monkeypatch
    ):
        monkeypatch.setattr(galaxy_service, "KMINDEX_MAX_HITS", 10)
        mirror = self._mirror(service, _cohort_payload(total=25, in_mirror=24))
        self._wire(service, hits=25)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        # The whole point: the mirror saw all 25, not the 10 that survived.
        (accessions,) = mirror.cohort_for_accessions.call_args.args
        assert len(accessions) == 25
        assert results.total_hits == 10
        assert results.cohort.total == results.total_matches == 25

    @pytest.mark.asyncio
    async def test_cohort_facets_reconcile_on_the_wire(self, service):
        self._mirror(service, _cohort_payload(total=25, in_mirror=24))
        self._wire(service, hits=25)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        for facet in results.cohort.facets:
            listed = sum(v.count for v in facet.values)
            assert listed + facet.other + facet.unknown == results.cohort.in_mirror
        country = next(f for f in results.cohort.facets if f.name == "country")
        assert "uncalculated" not in [v.value for v in country.values]

    @pytest.mark.asyncio
    async def test_no_mirror_yields_no_cohort_and_still_caches(self, service):
        service.sra_mirror = None
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.cohort is None
        # A missing mirror is a steady state, not a transient failure -- there
        # is nothing to retry, so the hit list is still worth caching.
        service.cache.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_unavailable_mirror_yields_no_cohort(self, service):
        mirror = MagicMock()
        mirror.is_available = MagicMock(return_value=False)
        service.sra_mirror = mirror
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        assert service._page_kmindex(aggregate, "job1", 5, 0).cohort is None
        mirror.cohort_for_accessions.assert_not_called()

    @pytest.mark.asyncio
    async def test_capability_the_mirror_cannot_serve_is_skipped_not_attempted(
        self, service
    ):
        # A mirror older than the query is a steady state, not a transient
        # failure: the columns are not going to appear between polls. Skip the
        # read, cache for a day, and do not spend an hourly re-aggregation on
        # a query that cannot succeed.
        mirror = self._mirror(service, _cohort_payload(total=5, in_mirror=5))
        mirror.has_capability = MagicMock(
            side_effect=lambda capability: capability != "cohort"
        )
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        assert service._page_kmindex(aggregate, "job1", 5, 0).cohort is None
        mirror.cohort_for_accessions.assert_not_called()
        _key, _value, ttl = service.cache.set.call_args.args
        assert ttl == CacheTTL.ONE_DAY

    @pytest.mark.asyncio
    async def test_failed_cohort_read_still_caches_the_correct_hit_list(self, service):
        self._mirror(service, side_effect=RuntimeError("mirror read failed"))
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        # Nothing partial is served...
        assert results.cohort is None
        # ...but the hit list, the breakdown and total_matches are all correct.
        # The cohort is an optional enrichment, so letting it veto the cache of
        # a correct result would invert the cost -- see the re-aggregation test
        # below for what that cost actually is.
        service.cache.set.assert_called_once()
        _key, _value, ttl = service.cache.set.call_args.args
        # Short, so the read is retried rather than abandoned for a day.
        assert ttl == CacheTTL.ONE_HOUR

    @pytest.mark.asyncio
    async def test_deterministic_cohort_failure_aggregates_once_not_per_request(
        self, service
    ):
        """A cohort read that fails the same way every time must not re-download
        every shard on every poll.

        Deterministic causes are reachable. The one that produced this test --
        a mirror whose schema predates a column the query names -- is now
        caught at startup by the per-capability column check, so it never
        reaches the query. What that check cannot see remains: a corrupt page,
        a revoked file handle, a duckdb version disagreement. Every results
        poll and every page click would otherwise re-download all 84 shard
        datasets from a rate-limited Galaxy, serialized against every other
        kmindex user on the process-wide aggregation lock.
        """
        store = {}
        service.cache.make_key = MagicMock(
            side_effect=lambda prefix, params: f"{prefix}:{params['job_id']}"
        )
        service.cache.get = AsyncMock(side_effect=lambda key: store.get(key))
        service.cache.set = AsyncMock(
            side_effect=lambda key, value, ttl: store.__setitem__(key, value)
        )
        mirror = self._mirror(
            service,
            side_effect=duckdb_binder_error(),
        )
        self._wire(service, hits=5)

        for _ in range(3):
            results = await service.get_kmindex_results("job1")

        # The hit list is still correct and still served, just without a cohort.
        assert results.cohort is None
        assert results.total_matches == 5
        # One aggregation for three polls: the failure is retried on a timer,
        # not on every request.
        assert service._download_shard.await_count == 1
        assert mirror.cohort_for_accessions.call_count == 1

    @pytest.mark.asyncio
    async def test_cohort_survives_the_cache_round_trip(self, service):
        store = {}
        service.cache.make_key = MagicMock(
            side_effect=lambda prefix, params: f"{prefix}:{params['job_id']}"
        )
        service.cache.get = AsyncMock(side_effect=lambda key: store.get(key))
        service.cache.set = AsyncMock(
            side_effect=lambda key, value, ttl: store.__setitem__(key, value)
        )
        mirror = self._mirror(service, _cohort_payload(total=5, in_mirror=5))
        self._wire(service, hits=5)

        first = await service.get_kmindex_results("job1")
        second = await service.get_kmindex_results("job1")

        assert first.cohort == second.cohort
        # The mirror is only asked once: the second call reads the cached
        # aggregate, which is the only place the cohort still exists.
        assert mirror.cohort_for_accessions.call_count == 1

    @pytest.mark.asyncio
    async def test_aggregate_cached_before_cohorts_reads_as_no_cohort(self, service):
        # A v2 entry written before this existed is not wrong, just silent --
        # so it stays readable rather than forcing every warm job to
        # re-download its shards from a rate-limited Galaxy.
        aggregate = {
            "hits": [{"accession": "SRR9", "score": 0.9, "shard": "GENOMIC_BCT_2"}],
            "per_index": [
                {"hits_after_cap": 1, "hits_before_cap": 1, "index": "GENOMIC_BCT"}
            ],
            "query_name": "q",
            "shards_failed": 0,
            "shards_searched": 1,
            "shards_with_hits": 1,
            "total_matches": 1,
            "truncated": False,
        }

        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.cohort is None
        assert results.total_matches == 1


class TestGeographyInTheAggregationWindow:
    """Geography is computed where the cohort and the export are, and for the
    same reason: the pre-cap hit list exists in that window and nowhere else.

    After aggregation returns, the aggregate holds 50,000 hits and the other
    million are only recoverable by re-downloading 84-280 shard datasets from
    a rate-limited Galaxy behind a process-wide lock.
    """

    _status = staticmethod(TestCohortOverTheFullHitSet._status)
    _job = staticmethod(TestCohortOverTheFullHitSet._job)
    _mirror = TestCohortOverTheFullHitSet._mirror
    _wire = TestCohortOverTheFullHitSet._wire

    @pytest.mark.asyncio
    async def test_geography_is_computed_from_every_hit_not_the_capped_page(
        self, service, monkeypatch
    ):
        monkeypatch.setattr(galaxy_service, "KMINDEX_MAX_HITS", 10)
        mirror = self._mirror(service, _cohort_payload(total=25, in_mirror=24))
        self._wire(service, hits=25)

        aggregate = await service._aggregate_shards("job1")

        (accessions,) = mirror.geography_for_accessions.call_args.args
        assert len(accessions) == 25
        assert aggregate["geography"]["in_mirror"] == 24

    @pytest.mark.asyncio
    async def test_no_mirror_yields_no_geography_and_still_caches(self, service):
        service.sra_mirror = None
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        assert aggregate["geography"] is None
        service.cache.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_geography_closes_alone_when_the_mirror_is_behind(self, service):
        # The live case for a phase 1 deploy that lands ahead of a mirror
        # rebuild. Geography goes dark; the cohort and the export do not.
        mirror = self._mirror(service, _cohort_payload(total=5, in_mirror=5))
        mirror.has_capability = MagicMock(
            side_effect=lambda capability: capability != "geography"
        )
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        assert aggregate["geography"] is None
        mirror.geography_for_accessions.assert_not_called()
        assert aggregate["cohort"]["in_mirror"] == 5
        mirror.cohort_for_accessions.assert_called_once()
        # A steady state, so it is cached for a day rather than retried hourly.
        _key, _value, ttl = service.cache.set.call_args.args
        assert ttl == CacheTTL.ONE_DAY

    @pytest.mark.asyncio
    async def test_a_broken_geography_read_shortens_the_ttl_like_the_cohort(
        self, service
    ):
        mirror = self._mirror(service, _cohort_payload(total=5, in_mirror=5))
        mirror.geography_for_accessions = MagicMock(
            side_effect=RuntimeError("geography read failed")
        )
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        # The hit list and the cohort are both correct and both still served.
        assert aggregate["geography"] is None
        assert aggregate["cohort"]["in_mirror"] == 5
        assert aggregate["total_matches"] == 5
        service.cache.set.assert_called_once()
        _key, _value, ttl = service.cache.set.call_args.args
        assert ttl == CacheTTL.ONE_HOUR

    @pytest.mark.asyncio
    async def test_geography_survives_the_cache_round_trip(self, service):
        store = {}
        service.cache.make_key = MagicMock(
            side_effect=lambda prefix, params: f"{prefix}:{params['job_id']}"
        )
        service.cache.get = AsyncMock(side_effect=lambda key: store.get(key))
        service.cache.set = AsyncMock(
            side_effect=lambda key, value, ttl: store.__setitem__(key, value)
        )
        mirror = self._mirror(service, _cohort_payload(total=5, in_mirror=5))
        self._wire(service, hits=5)

        await service.get_kmindex_results("job1")
        await service.get_kmindex_results("job1")

        (cached,) = store.values()
        assert cached["geography"] == mirror.geography_for_accessions.return_value
        # Asked once: the second read comes off the cached aggregate, which is
        # the only place geography still exists.
        assert mirror.geography_for_accessions.call_count == 1


class TestJobMetadataIsFetchedOnce:
    """
    One cold results request should make one show_job GET, not three.

    get_job_status already holds the full job dict, params included;
    _get_job_outputs re-fetched it and _submitted_indexes fetched it a third
    time purely for params it could have been handed. That third call had no
    retry budget -- unlike the seven attempts plus 20s straggler sweep every
    shard download gets -- and its failure discarded the whole aggregation. At
    280 shards throttled to two concurrent, that is minutes of rate-limited
    work thrown away because a metadata GET blipped.
    """

    @staticmethod
    def _wire(service, shard_count=3):
        """Stub a complete job whose show_job answers status, outputs and params.

        @param service: the GalaxyService under test.
        @param shard_count: how many output datasets the job exposes.
        @returns: None; the service is mutated in place.
        """
        service.gi.jobs.show_job = MagicMock(
            return_value={
                "state": "ok",
                "create_time": "t0",
                "update_time": "t1",
                "outputs": {f"out{i}": {"id": f"ds{i}"} for i in range(shard_count)},
                "params": {
                    "db_opts": json.dumps(
                        {
                            "__current_case__": 1,
                            "db_opts_selector": "db",
                            "kmindex": ["GENOMIC_BCT"],
                        }
                    )
                },
            }
        )
        service.gi.datasets.show_dataset = MagicMock(
            side_effect=lambda ds_id: {
                "id": ds_id,
                "name": ds_id,
                "state": "ok",
                "file_ext": "json",
            }
        )
        service._download_shard = AsyncMock(
            side_effect=lambda ds_id, sem: {
                f"GENOMIC_BCT_{ds_id[2:]}": {"q": {f"SRR{ds_id[2:]}": 1.0}}
            }
        )

    @pytest.mark.asyncio
    async def test_one_show_job_per_cold_results_request(self, service):
        service.sra_mirror = None
        self._wire(service)

        results = await service.get_kmindex_results("job1", limit=25, offset=0)

        assert service.gi.jobs.show_job.call_count == 1
        # And that single fetch still attributed every shard, so the round trips
        # were redundant rather than load-bearing.
        assert [s.index for s in results.per_index] == ["GENOMIC_BCT"]
        assert results.total_matches == 3

    @pytest.mark.asyncio
    async def test_status_without_params_falls_back_to_one_fetch(self, service):
        # A status served from the status cache carries no params, since the
        # field is excluded from model_dump. The index list stays readable --
        # at the cost of the one round trip, not three.
        service.sra_mirror = None
        self._wire(service)
        cached_shape = (await service.get_job_status("job1")).model_copy(
            update={"params": None}
        )
        service.gi.jobs.show_job.reset_mock()
        service.get_job_status = AsyncMock(return_value=cached_shape)

        aggregate = await service._aggregate_shards("job1")

        assert service.gi.jobs.show_job.call_count == 1
        assert [s["index"] for s in aggregate["per_index"]] == ["GENOMIC_BCT"]

    def test_params_reach_neither_the_wire_nor_the_status_cache(self):
        status = GalaxyJobStatus(
            job_id="job1",
            state=GalaxyJobState.OK,
            created_time="t0",
            updated_time="t1",
            params={"db_opts|kmindex": ["GENOMIC_BCT"]},
        )

        # Carried in-process for the aggregation path...
        assert status.params == {"db_opts|kmindex": ["GENOMIC_BCT"]}
        # ...but excluded from the public response model and from the dict the
        # status cache stores, so a job's raw tool parameters stay internal.
        assert "params" not in status.model_dump()
        assert "params" not in status.model_dump_json()


class TestExportOfTheFullMatchSet:
    """
    The download has to be written while the full hit list is alive.

    The aggregate keeps 50,000 hits and joins metadata onto the 25 on screen,
    so "every match, with its metadata" exists for exactly the span
    _aggregate_shards runs in. After that, rebuilding it means re-downloading
    84-280 shard datasets from a rate-limited Galaxy behind a process-wide
    lock. These cover that it is written from the whole list, that a failure
    costs nobody their search, and that a day-old cache entry cannot advertise
    a file that is no longer there.
    """

    @staticmethod
    def _status(shard_count):
        outputs = [MagicMock() for _ in range(shard_count)]
        for i, o in enumerate(outputs):
            o.dataset.id = f"ds{i}"
        return MagicMock(
            is_complete=True,
            is_successful=True,
            state="ok",
            outputs=outputs,
            params=None,
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

    def _mirror(self, service, record=None, side_effect=None):
        """Attach a stub SRA mirror whose export_hits returns `record`.

        @param service: the GalaxyService under test.
        @param record: what materialization reports back.
        @param side_effect: raise this instead, to model a broken write.
        @returns: the stub, so a test can inspect the call it received.
        """
        mirror = MagicMock()
        mirror.is_available = MagicMock(return_value=True)
        mirror.has_capability = MagicMock(return_value=True)
        mirror.cohort_for_accessions = MagicMock(return_value=None)
        mirror.geography_for_accessions = MagicMock(return_value=None)
        mirror.export_hits = MagicMock(return_value=record, side_effect=side_effect)
        service.sra_mirror = mirror
        return mirror

    def _wire(self, service, hits=25):
        """Point the service at one shard carrying `hits` equal-scoring hits."""
        service.gi.jobs.show_job = MagicMock(return_value=self._job(["GENOMIC_BCT"]))
        service.get_job_status = AsyncMock(return_value=self._status(1))
        service._download_shard = AsyncMock(
            return_value={
                "GENOMIC_BCT_10_null": {"q": {f"SRR{n:06d}": 1.0 for n in range(hits)}}
            }
        )

    @staticmethod
    def _materialize(directory, job_id="job1", rows=25):
        """Put a file where the export for `job_id` would have been written."""
        path = directory / f"{job_id}.parquet"
        path.write_bytes(b"PAR1" * rows)
        return path

    @pytest.mark.asyncio
    async def test_no_export_directory_writes_nothing_and_offers_nothing(self, service):
        # The default deployment. Nothing is materialized, nothing is claimed,
        # and no error is raised on the way past.
        mirror = self._mirror(service)
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        mirror.export_hits.assert_not_called()
        assert results.export_status == "unavailable"
        assert results.export_rows is None
        assert results.export_bytes is None
        assert results.total_matches == 5

    @pytest.mark.asyncio
    async def test_unavailable_mirror_writes_nothing(
        self, service, monkeypatch, tmp_path
    ):
        # There is no export without the mirror: the join is the whole point.
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        mirror = self._mirror(service)
        mirror.is_available = MagicMock(return_value=False)
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")

        mirror.export_hits.assert_not_called()
        assert service._page_kmindex(aggregate, "job1", 5, 0).export_status == (
            "unavailable"
        )

    @pytest.mark.asyncio
    async def test_export_is_written_from_every_hit_not_the_capped_page(
        self, service, monkeypatch, tmp_path
    ):
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        monkeypatch.setattr(galaxy_service, "KMINDEX_MAX_HITS", 10)
        mirror = self._mirror(service, {"rows": 25, "status": "available"})
        self._wire(service, hits=25)
        self._materialize(tmp_path)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        # The file was written from all 25, not the 10 that survived the cap.
        _job_id, hits, _dir = mirror.export_hits.call_args.args
        assert len(hits) == 25
        assert results.total_hits == 10
        assert results.export_rows == results.total_matches == 25

    @pytest.mark.asyncio
    async def test_export_runs_off_the_event_loop(self, service, monkeypatch, tmp_path):
        # It is a ~1.5s DuckDB write on a million-hit job, which is far too
        # long to spend on the loop.
        import threading

        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        seen = {}
        mirror = self._mirror(service, {"rows": 5, "status": "available"})
        mirror.export_hits = MagicMock(
            side_effect=lambda *args: seen.setdefault("thread", threading.get_ident())
            and {"rows": 5, "status": "available"}
        )
        self._wire(service, hits=5)

        await service._aggregate_shards("job1")

        assert seen["thread"] != threading.get_ident()

    @pytest.mark.asyncio
    async def test_a_failed_write_leaves_the_search_working(
        self, service, monkeypatch, tmp_path
    ):
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        self._mirror(service, side_effect=OSError("No space left on device"))
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        # The hit list, the breakdown and total_matches are all still correct;
        # the download is simply not on offer.
        assert results.total_matches == 5
        assert len(results.hits) == 5
        assert results.export_status == "unavailable"
        # Cached, because re-aggregation costs 84-280 shard downloads -- but
        # only for an hour, because the file can only ever be written from a
        # hit list that no longer exists once this returns.
        service.cache.set.assert_called_once()
        _key, _value, ttl = service.cache.set.call_args.args
        assert ttl == CacheTTL.ONE_HOUR

    @pytest.mark.asyncio
    async def test_a_hit_set_over_the_ceiling_says_so_and_is_cached_for_a_day(
        self, service, monkeypatch, tmp_path
    ):
        # Nothing to retry: the query matched more than is worth materializing,
        # and it will match the same number tomorrow.
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        self._mirror(service, {"rows": None, "status": "too_large"})
        self._wire(service, hits=5)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.export_status == "too_large"
        assert results.export_rows is None
        _key, _value, ttl = service.cache.set.call_args.args
        assert ttl == CacheTTL.ONE_DAY

    @pytest.mark.asyncio
    async def test_a_swept_file_is_not_advertised_by_the_cached_aggregate(
        self, service, monkeypatch, tmp_path
    ):
        # The aggregate lives a day; retention and a redeployed volume do not
        # respect it. The cached record is a claim, the filesystem is the
        # authority -- otherwise the UI shows a link that 404s.
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        self._mirror(service, {"rows": 25, "status": "available"})
        self._wire(service, hits=25)
        path = self._materialize(tmp_path)

        aggregate = await service._aggregate_shards("job1")
        assert service._page_kmindex(aggregate, "job1", 5, 0).export_status == (
            "available"
        )

        path.unlink()
        stale = service._page_kmindex(aggregate, "job1", 5, 0)
        assert stale.export_status == "unavailable"
        assert stale.export_rows is None
        assert stale.export_bytes is None

    @pytest.mark.asyncio
    async def test_size_is_read_from_the_file_being_offered(
        self, service, monkeypatch, tmp_path
    ):
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        self._mirror(service, {"rows": 25, "status": "available"})
        self._wire(service, hits=25)
        path = self._materialize(tmp_path)

        aggregate = await service._aggregate_shards("job1")
        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.export_bytes == path.stat().st_size

    @pytest.mark.asyncio
    async def test_export_is_written_once_and_survives_the_cache_round_trip(
        self, service, monkeypatch, tmp_path
    ):
        monkeypatch.setattr(service.settings, "KMINDEX_EXPORT_DIR", str(tmp_path))
        store = {}
        service.cache.make_key = MagicMock(
            side_effect=lambda prefix, params: f"{prefix}:{params['job_id']}"
        )
        service.cache.get = AsyncMock(side_effect=lambda key: store.get(key))
        service.cache.set = AsyncMock(
            side_effect=lambda key, value, ttl: store.__setitem__(key, value)
        )
        mirror = self._mirror(service, {"rows": 5, "status": "available"})
        self._wire(service, hits=5)
        self._materialize(tmp_path, rows=5)

        first = await service.get_kmindex_results("job1")
        second = await service.get_kmindex_results("job1")

        assert first.export_rows == second.export_rows == 5
        # Written once: the second call reads the cached aggregate, and the
        # file it points at is still on disk.
        assert mirror.export_hits.call_count == 1

    def test_an_unrecognised_cached_status_reads_as_unavailable(self, service):
        # The aggregate outlives the code that wrote it by up to a day. A
        # status from another version is worth "no download", not a 500 on the
        # results endpoint.
        aggregate = {
            "export": {"rows": 5, "status": "materialising"},
            "hits": [],
            "per_index": [],
            "query_name": "q",
            "total_matches": 0,
        }

        assert service._page_kmindex(aggregate, "job1", 5, 0).export_status == (
            "unavailable"
        )

    @pytest.mark.asyncio
    async def test_aggregate_cached_before_exports_reads_as_unavailable(self, service):
        # A v2 entry written before this existed is not wrong, just silent --
        # so it stays readable rather than forcing every warm job to
        # re-download its shards from a rate-limited Galaxy.
        aggregate = {
            "hits": [{"accession": "SRR9", "score": 0.9, "shard": "GENOMIC_BCT_2"}],
            "per_index": [
                {"hits_after_cap": 1, "hits_before_cap": 1, "index": "GENOMIC_BCT"}
            ],
            "query_name": "q",
            "shards_failed": 0,
            "shards_searched": 1,
            "shards_with_hits": 1,
            "total_matches": 1,
            "truncated": False,
        }

        results = service._page_kmindex(aggregate, "job1", 5, 0)

        assert results.export_status == "unavailable"
        assert results.export_rows is None


class TestExportEndpoint:
    """Serving a materialized export.

    The file is a finished artifact: the endpoint never touches Galaxy and
    never needs the mirror, so a job whose export exists stays downloadable
    even while both are down.
    """

    @staticmethod
    def _client(export_dir, monkeypatch):
        """A test client over the galaxy router alone, with the export
        directory configured.

        @param export_dir: value for KMINDEX_EXPORT_DIR, or None to leave it
            unset.
        @param monkeypatch: the test's monkeypatch fixture.
        @returns: a TestClient.
        """
        from fastapi import FastAPI
        from fastapi.testclient import TestClient

        from app.api.v1 import galaxy as galaxy_api
        from app.core.config import get_settings
        from app.core.dependencies import check_rate_limit

        if export_dir is not None:
            monkeypatch.setenv("KMINDEX_EXPORT_DIR", str(export_dir))
        get_settings.cache_clear()

        app = FastAPI()
        app.include_router(galaxy_api.router, prefix="/galaxy")
        app.dependency_overrides[check_rate_limit] = lambda: None
        return TestClient(app)

    @staticmethod
    def _export(directory, job_id="job1", accessions=("SRR1", "SRR2")):
        """Write an export-shaped parquet where the endpoint will look."""
        import duckdb

        from app.services.sra_mirror import EXPORT_COLUMNS

        tail = ", ".join(f"NULL AS {name}" for name in EXPORT_COLUMNS[3:])
        rows = " UNION ALL ".join(
            f"SELECT '{acc}' AS accession, 1.0 AS score, 'IDX_1' AS shard, {tail}"
            for acc in accessions
        )
        con = duckdb.connect()
        try:
            con.execute(
                f"COPY ({rows}) TO '{directory / f'{job_id}.parquet'}' (FORMAT parquet)"
            )
        finally:
            con.close()

    def test_a_job_with_no_file_404s(self, tmp_path, monkeypatch):
        client = self._client(tmp_path, monkeypatch)

        response = client.get("/galaxy/kmindex/jobs/job1/export")

        assert response.status_code == 404
        assert "job1" in response.json()["detail"]

    def test_an_unset_export_directory_404s(self, tmp_path, monkeypatch):
        monkeypatch.delenv("KMINDEX_EXPORT_DIR", raising=False)
        client = self._client(None, monkeypatch)
        self._export(tmp_path)

        assert client.get("/galaxy/kmindex/jobs/job1/export").status_code == 404

    def test_a_job_id_that_is_not_an_identifier_404s(self, tmp_path, monkeypatch):
        # It is a filename here, so it never gets to be a path.
        client = self._client(tmp_path, monkeypatch)

        assert client.get("/galaxy/kmindex/jobs/..%2F..%2Fetc/export").status_code in (
            404,
            405,
        )
        assert client.get("/galaxy/kmindex/jobs/job.1/export").status_code == 404

    def test_parquet_is_served_as_is_and_named_for_the_job_and_row_count(
        self, tmp_path, monkeypatch
    ):
        client = self._client(tmp_path, monkeypatch)
        self._export(tmp_path, accessions=("SRR1", "SRR2", "SRR3"))

        response = client.get("/galaxy/kmindex/jobs/job1/export")

        assert response.status_code == 200
        assert response.content == (tmp_path / "job1.parquet").read_bytes()
        assert (
            response.headers["content-disposition"]
            == 'attachment; filename="logan-job1-3-runs.parquet"'
        )

    def test_tsv_is_converted_on_the_way_out(self, tmp_path, monkeypatch):
        from app.services.sra_mirror import EXPORT_COLUMNS

        client = self._client(tmp_path, monkeypatch)
        self._export(tmp_path)

        response = client.get("/galaxy/kmindex/jobs/job1/export?format=tsv")
        lines = response.text.splitlines()

        assert response.status_code == 200
        assert lines[0] == "\t".join(EXPORT_COLUMNS)
        assert [line.split("\t")[0] for line in lines[1:]] == ["SRR1", "SRR2"]
        assert (
            'filename="logan-job1-2-runs.tsv"'
            in (response.headers["content-disposition"])
        )

    def test_an_unknown_format_is_rejected(self, tmp_path, monkeypatch):
        client = self._client(tmp_path, monkeypatch)
        self._export(tmp_path)

        assert client.get(
            "/galaxy/kmindex/jobs/job1/export?format=xlsx"
        ).status_code == (422)


class TestCachedKmindexRead:
    """The assistant's read path: a Redis hit or None, never an aggregation."""

    @pytest.mark.asyncio
    async def test_miss_returns_none_without_aggregating(self, service):
        service.cache.get = AsyncMock(return_value=None)
        service._aggregate_shards = AsyncMock(side_effect=AssertionError("cold path"))

        assert await service.get_cached_kmindex_results("job1") is None
        service._aggregate_shards.assert_not_called()

    @pytest.mark.asyncio
    async def test_hit_pages_and_annotates(self, service):
        aggregate = {
            "hits": [
                {"accession": "ERR1", "score": 1.0, "shard": "s"},
                {"accession": "ERR2", "score": 0.9, "shard": "s"},
            ],
            "total_matches": 2,
            "per_index": [],
            "query_name": "q",
        }
        service.cache.get = AsyncMock(return_value=aggregate)
        service._aggregate_shards = AsyncMock(side_effect=AssertionError("cold path"))
        service._export_state = MagicMock(
            return_value={"bytes": None, "rows": None, "status": "unavailable"}
        )

        page = await service.get_cached_kmindex_results("job1", limit=1, offset=0)

        assert page is not None
        assert page.total_hits == 2
        assert [h.accession for h in page.hits] == ["ERR1"]
        service._aggregate_shards.assert_not_called()

    @pytest.mark.asyncio
    async def test_reads_even_when_galaxy_key_missing(self, service):
        # A cached aggregate needs no Galaxy connection to page.
        service._galaxy_available = False
        service.cache.get = AsyncMock(return_value=None)
        assert await service.get_cached_kmindex_results("job1") is None
