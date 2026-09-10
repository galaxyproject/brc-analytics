"""
Logan's per-hit statistics, computed the way logan-search.org computes them.

Two of the four statistics in LOGAN_STATS_SPEC.md are worth having and both are
cheap: the false-positive-corrected k-mer coverage, and the Mash Screen ANI
estimate derived from it. The other two, p-value and e-value, are constant
zero on every row of Logan's own example dashboards -- the Poisson model
underflows float64 for any query over ~200 bp above the default threshold --
so they are not reproduced here.

The correction file is a sparse table of 227 accessions whose Bloom filters
are saturated (median unitigs_sumlen 13.5 Gb against a global median of
8.3 Mb): soil metagenomes, axolotl, sea lion, human. Each matches a sizeable
fraction of any query's k-mers by construction, and the file records that
fraction so it can be subtracted. Everything not in the file is uncorrected.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, Optional, Tuple

# Logan indexes 31-mers; the ANI closed form needs the k the ratio was
# measured at.
KMER_SIZE = 31

# Shipped with the app rather than mounted: 8.9 KB, changes only when Logan
# rebuilds its index, and the backend has no other per-deployment data file.
FP_CORRECTION_PATH = Path(__file__).resolve().parent.parent / "data" / "logan_fp.json"


@lru_cache(maxsize=1)
def fp_baselines() -> Dict[str, float]:
    """The per-accession false-positive baselines, keyed by upper-case accession."""
    with FP_CORRECTION_PATH.open(encoding="utf-8") as fh:
        raw = json.load(fh)
    return {str(acc).strip().upper(): float(value) for acc, value in raw.items()}


def correct_score(accession: str, raw: float) -> Tuple[float, Optional[float]]:
    """
    kmer_coverage as the spec defines it: the raw ratio less the accession's
    false-positive baseline, rounded to four places.

    @param accession: SRA run accession as kmindex reported it.
    @param raw: the raw k-mer sharing ratio from kmindex, 0..1.
    @returns: (corrected score, baseline subtracted) -- the baseline is None
        and the score is the raw value untouched when the accession is not in
        the correction file. The caller decides what a negative result means.
    """
    baseline = fp_baselines().get(accession.strip().upper())
    if baseline is None:
        return raw, None
    return round(raw - baseline, 4), baseline


def ani_estimate(score: Optional[float]) -> Optional[float]:
    """
    Mash Screen's ANI estimate, coverage ** (1/k), rounded to four places.

    Monotone in the score, so it ranks nothing the score does not already
    rank; it exists because biologists read identity fluently and k-mer
    fractions less so. Four places because the whole 0.25..1.0 coverage range
    compresses into ANI 0.956..1.000.

    @param score: corrected k-mer coverage.
    @returns: the estimate, or None when there is nothing real to estimate --
        a missing score, or a corrected score that went negative.
    """
    if score is None or score < 0:
        return None
    return round(score ** (1 / KMER_SIZE), 4)
