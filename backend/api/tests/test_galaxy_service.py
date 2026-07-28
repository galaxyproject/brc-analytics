"""Tests for the Galaxy/kmindex service layer.

These cover the failure modes where an incomplete result could be presented --
or worse, cached -- as a complete one, plus the merge-time bookkeeping. They
stub bioblend rather than touching a real Galaxy instance.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.models.galaxy import KmindexQuerySubmission
from app.services.galaxy_service import GalaxyService


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
            KmindexQuerySubmission(sequence=">a\nACGT\n>b\nTTTT\n", index="GENOMIC_BCT")

    def test_single_record_accepted(self):
        submission = KmindexQuerySubmission(sequence=">a\nACGT\n", index="GENOMIC_BCT")
        assert submission.index == "GENOMIC_BCT"

    def test_headerless_sequence_accepted(self):
        assert KmindexQuerySubmission(sequence="ACGT", index="GENOMIC_BCT")
