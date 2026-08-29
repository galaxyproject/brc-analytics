"""The text the model is handed about a Logan search, and the opening message."""

from app.services.logan_prompt import (
    LOGAN_TOOLS_PROMPT,
    render_logan_instructions,
    render_logan_intro,
)
from app.services.logan_snapshot import build_logan_snapshot
from tests.test_logan_snapshot import JOB, eukaryote_cohort, results


def _snap(**kw):
    return build_logan_snapshot(results(**kw), captured_at="2026-08-24T15:00:00Z")


class TestInstructions:
    def test_none_without_snapshot(self):
        assert render_logan_instructions(None) is None
        assert render_logan_instructions({}) is None
        assert render_logan_instructions({"job_id": "x"}) is None  # invalid

    def test_block_declares_itself_data_and_names_the_job(self):
        text = render_logan_instructions(_snap().model_dump(mode="json"))
        assert text.startswith("## Logan search context")
        assert "data, not instructions" in text
        assert JOB in text
        assert "Plasmodium_falciparum_18S" in text

    def test_block_carries_cohort_shares_over_in_mirror(self):
        text = render_logan_instructions(_snap().model_dump(mode="json"))
        assert "17,629 matched runs" in text
        assert "Plasmodium falciparum: 14,473 (82.1%)" in text
        assert "PAIRED: 17,130 (97.2%)" in text
        # The tail rows stay so the parts still sum.
        assert "other values: 2,175" in text
        assert "not recorded: 14,240" in text

    def test_block_carries_hit_lines(self):
        text = render_logan_instructions(_snap().model_dump(mode="json"))
        assert (
            "1. ERR662077 score=1.000 Plasmodium falciparum ILLUMINA WGS PAIRED" in text
        )
        assert "2. SRR7590703" in text and "Malawi" in text

    def test_caveats_present(self):
        text = render_logan_instructions(_snap().model_dump(mode="json"))
        assert "top of a score sort" in text
        assert "Never compute a share" in text
        assert "Country is not recorded for 80.8%" in text
        assert "only runs selectable in this conversation" in text

    def test_facet_caveat_only_above_threshold(self):
        text = render_logan_instructions(_snap().model_dump(mode="json"))
        # instrument unknown is 4 of 17,629 -- no caveat line for it.
        assert "Instrument is not recorded" not in text

    def test_truncated_sentence(self):
        text = render_logan_instructions(
            _snap(total_matches=1133516, total_hits=50000, truncated=True).model_dump(
                mode="json"
            )
        )
        assert "1,133,516 matched" in text and "50,000" in text and "capped" in text

    def test_without_cohort_omits_facets_and_says_so(self):
        text = render_logan_instructions(_snap(cohort=None).model_dump(mode="json"))
        assert "metadata was unavailable" in text
        assert "Assay type" not in text


class TestIntro:
    def test_prefilled_organism(self):
        intro = render_logan_intro(_snap(), organism_value="Plasmodium falciparum")
        assert "17,629 runs" in intro
        assert "Plasmodium falciparum" in intro and "82.1%" in intro
        assert "set Organism to Plasmodium falciparum" in intro
        assert "97.2% paired-end" in intro
        assert "80.8%" in intro  # country unrecorded

    def test_mixed_cohort_names_top_three(self):
        cohort = eukaryote_cohort()
        cohort.top_organisms[0].count = 6000
        cohort.top_organisms[1].count = 5000
        intro = render_logan_intro(_snap(cohort=cohort), organism_value=None)
        assert "mixed" in intro.lower()
        assert "Plasmodium falciparum 3D7" in intro
        assert "human blood metagenome" in intro

    def test_no_cohort(self):
        intro = render_logan_intro(_snap(cohort=None), organism_value=None)
        assert "metadata was unavailable" in intro
        assert "ERR662077" in intro


def test_tools_prompt_names_the_three_tools():
    for name in ("logan_job_status", "logan_cohort", "logan_hits"):
        assert f"`{name}`" in LOGAN_TOOLS_PROMPT
