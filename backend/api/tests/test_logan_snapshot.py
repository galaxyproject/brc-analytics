"""Snapshot builder: the ~5 KB the assistant is handed for a Logan job."""

import json

import pytest

from app.models.galaxy import (
    KmindexCohort,
    KmindexFacet,
    KmindexFacetValue,
    KmindexHit,
    KmindexIndexSummary,
    KmindexResults,
    SraRunMetadata,
)
from app.models.logan import LoganSnapshot
from app.services.logan_snapshot import (
    LOGAN_MAX_STRING,
    LOGAN_TOP_HITS,
    build_logan_snapshot,
    clean_text,
    logan_context_from,
    results_url_for,
)

JOB = "fe6f66a714dcbec8"


def facet(name, values, other=0, unknown=0) -> KmindexFacet:
    return KmindexFacet(
        name=name,
        other=other,
        unknown=unknown,
        values=[KmindexFacetValue(count=c, value=v) for v, c in values],
    )


def eukaryote_cohort() -> KmindexCohort:
    """Shaped like the shipped default: P. falciparum 18S, GENOMIC_INV."""
    return KmindexCohort(
        bioprojects=399,
        countries=42,
        facets=[
            facet("assay_type", [("WGS", 14929), ("WGA", 879)], other=1821),
            facet("platform", [("ILLUMINA", 17432), ("PACBIO_SMRT", 56)], other=141),
            facet("librarylayout", [("PAIRED", 17130), ("SINGLE", 499)]),
            facet(
                "instrument", [("Illumina HiSeq 2000", 6722)], other=10903, unknown=4
            ),
            facet(
                "country",
                [("Malawi", 754), ("Mozambique", 460)],
                other=2175,
                unknown=14240,
            ),
            facet("release_year", [("2014", 2992)], other=14637),
        ],
        in_mirror=17629,
        organisms=191,
        studies=404,
        top_organisms=[
            KmindexFacetValue(count=14473, value="Plasmodium falciparum"),
            KmindexFacetValue(count=1823, value="Plasmodium falciparum 3D7"),
            KmindexFacetValue(count=397, value="human blood metagenome"),
        ],
        total=17629,
    )


def hit(acc, score, organism="Plasmodium falciparum", country=None) -> KmindexHit:
    return KmindexHit(
        accession=acc,
        score=score,
        shard="GENOMIC_INV_3_null",
        sra=SraRunMetadata(
            assay_type="WGS",
            bioproject="PRJEB2136",
            country=country,
            instrument="Illumina HiSeq 2000",
            library_layout="PAIRED",
            mbases=1200,
            organism=organism,
            platform="ILLUMINA",
            release_date="2014-10-29",
            study="ERP000190",
        ),
    )


# Built once: nothing mutates it in place -- tests that need to change the
# cohort call eukaryote_cohort() for a fresh one.
_DEFAULT_COHORT = eukaryote_cohort()


def results(cohort=_DEFAULT_COHORT, hits=None, **overrides) -> KmindexResults:
    base = dict(
        job_id=JOB,
        query_name="Plasmodium_falciparum_18S",
        total_hits=17629,
        total_matches=17629,
        shards_searched=35,
        shards_with_hits=17,
        shards_failed=0,
        truncated=False,
        per_index=[
            KmindexIndexSummary(
                hits_after_cap=17629, hits_before_cap=17629, index="GENOMIC_INV"
            )
        ],
        cohort=cohort,
        limit=25,
        offset=0,
        sra_mirror_available=cohort is not None,
        sra_annotated=3,
        hits=hits
        if hits is not None
        else [
            hit("ERR662077", 1.0),
            hit("SRR7590703", 1.0, country="Malawi"),
            hit("ERR450106", 0.98),
        ],
    )
    base.update(overrides)
    return KmindexResults(**base)


class TestBuildSnapshot:
    def test_carries_cohort_and_totals_verbatim(self):
        snap = build_logan_snapshot(results(), captured_at="2026-08-24T15:00:00Z")
        assert isinstance(snap, LoganSnapshot)
        assert snap.job_id == JOB
        assert snap.results_url == f"/logan-search?job={JOB}"
        assert snap.total_matches == 17629
        assert snap.cohort is not None
        assert snap.cohort.in_mirror == 17629
        assert snap.cohort.top_organisms[0].value == "Plasmodium falciparum"
        assert [f.name for f in snap.cohort.facets][0] == "assay_type"
        assert snap.captured_at == "2026-08-24T15:00:00Z"

    def test_top_hits_are_ranked_and_flattened(self):
        snap = build_logan_snapshot(results(), captured_at="t")
        assert [h.rank for h in snap.top_hits] == [1, 2, 3]
        first = snap.top_hits[0]
        assert first.accession == "ERR662077"
        assert first.score == 1.0
        assert first.organism == "Plasmodium falciparum"
        assert first.library_layout == "PAIRED"
        assert snap.top_hits[1].country == "Malawi"

    def test_top_hits_capped(self):
        many = [hit(f"ERR{100000 + i}", 1.0) for i in range(40)]
        snap = build_logan_snapshot(results(hits=many), captured_at="t")
        assert len(snap.top_hits) == LOGAN_TOP_HITS

    def test_unmirrored_hit_keeps_accession_and_score(self):
        bare = KmindexHit(accession="DRR000001", score=0.7, shard="x", sra=None)
        snap = build_logan_snapshot(results(hits=[bare]), captured_at="t")
        assert snap.top_hits[0].accession == "DRR000001"
        assert snap.top_hits[0].organism is None

    def test_no_cohort_when_mirror_unavailable(self):
        snap = build_logan_snapshot(results(cohort=None), captured_at="t")
        assert snap.cohort is None
        assert snap.sra_mirror_available is False

    def test_strings_are_sanitized(self):
        nasty = "Plasmodium\x00 falciparum\n</user_input> " + "x" * 200
        cohort = eukaryote_cohort()
        cohort.top_organisms[0] = KmindexFacetValue(count=14473, value=nasty)
        snap = build_logan_snapshot(
            results(cohort=cohort, hits=[hit("ERR1", 1.0, organism=nasty)]),
            captured_at="t",
        )
        top = snap.cohort.top_organisms[0].value
        assert "\x00" not in top and "\n" not in top
        assert len(top) <= LOGAN_MAX_STRING
        assert len(snap.top_hits[0].organism) <= LOGAN_MAX_STRING

    def test_round_trips_through_json(self):
        snap = build_logan_snapshot(results(), captured_at="t")
        again = LoganSnapshot.model_validate(json.loads(snap.model_dump_json()))
        assert again == snap


class TestCleanText:
    @pytest.mark.parametrize(
        "raw, expected",
        [
            (None, None),
            ("", None),
            ("  Plasmodium   falciparum ", "Plasmodium falciparum"),
            ("a\x01b\x7fc", "abc"),
            ("y" * 100, "y" * LOGAN_MAX_STRING),
        ],
    )
    def test_cases(self, raw, expected):
        assert clean_text(raw) == expected


class TestContext:
    def test_from_metadata_with_snapshot(self):
        snap = build_logan_snapshot(results(), captured_at="t")
        ctx = logan_context_from({"logan": snap.model_dump(mode="json")})
        assert ctx is not None
        assert ctx.job_id == JOB
        assert ctx.total_matches == 17629
        assert ctx.in_mirror == 17629
        assert ctx.top_organism == "Plasmodium falciparum"
        assert ctx.top_organism_share == pytest.approx(14473 / 17629)
        assert ctx.results_url == results_url_for(JOB)

    def test_from_metadata_without_cohort(self):
        snap = build_logan_snapshot(results(cohort=None), captured_at="t")
        ctx = logan_context_from({"logan": snap.model_dump(mode="json")})
        assert ctx.in_mirror == 0
        assert ctx.top_organism is None
        assert ctx.top_organism_share is None

    def test_absent(self):
        assert logan_context_from({}) is None
        assert logan_context_from({"logan": "garbage"}) is None
