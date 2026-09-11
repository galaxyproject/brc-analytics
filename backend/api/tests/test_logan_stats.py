"""Logan's per-hit statistics, computed the way logan-search.org computes them."""

import math

import pytest

from app.services import logan_stats
from app.services.logan_stats import (
    KMER_SIZE,
    ani_estimate,
    correct_score,
    fp_baselines,
)


class TestFalsePositiveFile:
    def test_carries_the_227_saturated_samples(self):
        # The file Danielle sent is a sparse correction for the worst
        # offenders, not a per-accession table: 227 Bloom filters so saturated
        # they match a fraction of any query's k-mers.
        baselines = fp_baselines()
        assert len(baselines) == 227
        assert all(0.10 < value < 0.70 for value in baselines.values())

    def test_is_keyed_by_upper_case_accession(self):
        assert "SRR10916223" in fp_baselines()
        assert all(acc == acc.upper() for acc in fp_baselines())


class TestCorrectScore:
    def test_subtracts_the_baseline_for_a_listed_accession(self):
        # SRR10916223's baseline is 0.6910401647785788 in the file.
        score, baseline = correct_score("SRR10916223", 0.9)
        assert baseline == pytest.approx(0.6910401647785788)
        assert score == pytest.approx(0.209)

    def test_rounds_to_four_places_like_the_spec(self):
        score, _ = correct_score("SRR10916223", 0.95)
        assert score == round(0.95 - 0.6910401647785788, 4)

    def test_leaves_an_unlisted_accession_alone(self):
        assert correct_score("SRR000001", 0.62) == (0.62, None)

    def test_matches_regardless_of_case_or_padding(self):
        score, baseline = correct_score(" srr10916223 ", 0.9)
        assert baseline is not None
        assert score == pytest.approx(0.209)

    def test_can_go_negative(self):
        # The caller decides what to do with a hit that corrects below zero;
        # this function only reports the arithmetic.
        score, _ = correct_score("SRR10916223", 0.5)
        assert score < 0


class TestAniEstimate:
    def test_is_the_mash_screen_closed_form(self):
        assert KMER_SIZE == 31
        assert ani_estimate(0.5) == round(0.5 ** (1 / 31), 4) == 0.9779

    def test_perfect_coverage_is_perfect_identity(self):
        assert ani_estimate(1.0) == 1.0

    def test_zero_coverage_is_zero(self):
        assert ani_estimate(0.0) == 0.0

    def test_negative_or_missing_coverage_has_no_estimate(self):
        # A negative corrected score has no real 31st root, and a missing one
        # has nothing to estimate from.
        assert ani_estimate(-0.1) is None
        assert ani_estimate(None) is None

    def test_never_returns_nan(self):
        for value in (0.0, 1e-9, 0.25, 0.9999, 1.0):
            estimate = ani_estimate(value)
            assert estimate is not None and not math.isnan(estimate)


def test_module_exposes_the_data_path_for_the_docs():
    assert logan_stats.FP_CORRECTION_PATH.name == "logan_fp.json"
    assert logan_stats.FP_CORRECTION_PATH.exists()
