"""Tests for deterministic evaluators."""

from dataclasses import dataclass
from typing import Any

import pytest
from pydantic_evals.evaluators import EvaluatorContext

from evals.datasets.catalog_query import QueryCatalogShape
from evals.evaluators import (
    FieldEquals,
    LowConfidence,
    MustMention,
    ToolCallMatch,
    extract_numbers,
)


def _ctx(output: Any, metadata: dict | None = None) -> EvaluatorContext:
    """Build a minimal EvaluatorContext for unit tests."""
    return EvaluatorContext(
        name="case",
        inputs=None,
        output=output,
        expected_output=None,
        metadata=metadata or {},
        duration=0.0,
        _span_tree=None,
        attributes={},
        metrics={},
    )


# ---------- FieldEquals ----------


def test_field_equals_match():
    ev = FieldEquals(field="taxonomy_id", expected="5833")
    assert ev.evaluate(_ctx({"taxonomy_id": "5833"})) == 1.0


def test_field_equals_case_insensitive():
    ev = FieldEquals(field="organism", expected="Saccharomyces cerevisiae")
    assert ev.evaluate(_ctx({"organism": "saccharomyces CEREVISIAE"})) == 1.0


def test_field_equals_miss():
    ev = FieldEquals(field="taxonomy_id", expected="5833")
    assert ev.evaluate(_ctx({"taxonomy_id": "9606"})) == 0.0


def test_field_equals_missing_key():
    ev = FieldEquals(field="taxonomy_id", expected="5833")
    assert ev.evaluate(_ctx({})) == 0.0


def test_field_equals_works_on_dataclass_output():
    @dataclass
    class _Out:
        taxonomy_id: str

    ev = FieldEquals(field="taxonomy_id", expected="4932")
    assert ev.evaluate(_ctx(_Out(taxonomy_id="4932"))) == 1.0


def test_field_equals_pulls_expected_from_metadata_if_omitted():
    ev = FieldEquals(field="taxonomy_id")
    assert (
        ev.evaluate(_ctx({"taxonomy_id": "5833"}, {"expected_taxonomy_id": "5833"}))
        == 1.0
    )


# ---------- MustMention ----------


def test_must_mention_all_present():
    ev = MustMention(keywords=["yeast", "RNA-seq"])
    assert ev.evaluate(_ctx("We can run RNA-seq on yeast.")) == 1.0


def test_must_mention_partial():
    ev = MustMention(keywords=["yeast", "RNA-seq"])
    assert ev.evaluate(_ctx("We can run RNA-seq on humans.")) == 0.5


def test_must_mention_pulls_keywords_from_metadata():
    ev = MustMention()
    assert ev.evaluate(_ctx("yeast", {"expected_keywords": ["yeast"]})) == 1.0


# ---------- LowConfidence ----------


def test_low_confidence_below_threshold():
    @dataclass
    class _Out:
        confidence: float

    ev = LowConfidence(threshold=0.3)
    assert ev.evaluate(_ctx(_Out(confidence=0.1))) == 1.0
    assert ev.evaluate(_ctx(_Out(confidence=0.3))) == 1.0


def test_low_confidence_above_threshold():
    @dataclass
    class _Out:
        confidence: float

    ev = LowConfidence(threshold=0.3)
    assert ev.evaluate(_ctx(_Out(confidence=0.7))) == 0.0


def test_low_confidence_missing_field():
    ev = LowConfidence()
    assert ev.evaluate(_ctx({})) == 0.0


# ---------- ToolCallMatch ----------


@dataclass
class _FakeRun:
    tool_calls: list[tuple[str, dict]]


def test_tool_call_match_hit():
    output = _FakeRun(tool_calls=[("search_organisms", {"query": "yeast"})])
    ev = ToolCallMatch(tool="search_organisms", arg_substrings={"query": "yeast"})
    assert ev.evaluate(_ctx(output)) == 1.0


def test_tool_call_match_arg_mismatch():
    output = _FakeRun(tool_calls=[("search_organisms", {"query": "human"})])
    ev = ToolCallMatch(tool="search_organisms", arg_substrings={"query": "yeast"})
    assert ev.evaluate(_ctx(output)) == 0.0


def test_tool_call_match_no_calls():
    output = _FakeRun(tool_calls=[])
    ev = ToolCallMatch(tool="search_organisms")
    assert ev.evaluate(_ctx(output)) == 0.0


def test_tool_call_match_pulls_from_metadata():
    output = _FakeRun(tool_calls=[("get_assemblies", {"taxonomy_id": "4932"})])
    ev = ToolCallMatch()
    assert (
        ev.evaluate(
            _ctx(
                output,
                {
                    "expected_tool": "get_assemblies",
                    "expected_args": {"taxonomy_id": "4932"},
                },
            )
        )
        == 1.0
    )


# ---------- QueryCatalogShape ----------


def test_query_shape_matches_field_and_value():
    out = _FakeRun(
        tool_calls=[
            ("query_catalog", {"operation": "facets", "facet_by": ["level"]}),
        ]
    )
    ev = QueryCatalogShape(operation="facets", must_contain=["level"])
    assert ev.evaluate(_ctx(out)) == 1.0


def test_query_shape_rejects_field_fragment():
    # faceting the wrong field must NOT satisfy must_contain=["level"]
    out = _FakeRun(
        tool_calls=[
            (
                "query_catalog",
                {"operation": "facets", "facet_by": ["taxonomicLevelGenus"]},
            ),
        ]
    )
    ev = QueryCatalogShape(operation="facets", must_contain=["level"])
    assert ev.evaluate(_ctx(out)) == 0.0


def test_query_shape_numeric_token_is_digit_bounded():
    # "1773" must not match the wrong taxid "17730"
    out = _FakeRun(
        tool_calls=[
            (
                "query_catalog",
                {"filters": [{"field": "speciesTaxonomyId", "value": "17730"}]},
            ),
        ]
    )
    ev = QueryCatalogShape(must_contain=["1773"])
    assert ev.evaluate(_ctx(out)) == 0.0


def test_query_shape_must_filter_field_and_value():
    out = _FakeRun(
        tool_calls=[
            (
                "query_catalog",
                {
                    "operation": "count",
                    "filters": [
                        {
                            "field": "taxonomicLevelGenus",
                            "op": "eq",
                            "value": "Anopheles",
                        }
                    ],
                },
            ),
        ]
    )
    ev = QueryCatalogShape(
        operation="count",
        must_filter=[{"field": "taxonomicLevelGenus", "value": "Anopheles"}],
    )
    assert ev.evaluate(_ctx(out)) == 1.0


def test_query_shape_must_filter_rejects_wrong_field():
    # The value "Anopheles" is present (inside a species value) but NOT on the
    # genus column — the old substring check would pass, the structural one must not.
    out = _FakeRun(
        tool_calls=[
            (
                "query_catalog",
                {
                    "filters": [
                        {
                            "field": "taxonomicLevelSpecies",
                            "op": "eq",
                            "value": "Anopheles gambiae",
                        }
                    ],
                },
            ),
        ]
    )
    ev = QueryCatalogShape(
        must_filter=[{"field": "taxonomicLevelGenus", "value": "Anopheles"}]
    )
    assert ev.evaluate(_ctx(out)) == 0.0


def test_query_shape_entity_default_is_assembly():
    # entity omitted ⇒ defaults to "assembly"
    out = _FakeRun(tool_calls=[("query_catalog", {"operation": "count"})])
    assert QueryCatalogShape(entity="assembly").evaluate(_ctx(out)) == 1.0
    assert QueryCatalogShape(entity="organism").evaluate(_ctx(out)) == 0.0


def test_query_shape_entity_organism():
    out = _FakeRun(
        tool_calls=[("query_catalog", {"entity": "organism", "operation": "count"})]
    )
    assert QueryCatalogShape(entity="organism").evaluate(_ctx(out)) == 1.0
    assert QueryCatalogShape(entity="assembly").evaluate(_ctx(out)) == 0.0


def test_query_shape_must_filter_list_value():
    # value may be a list (in / contains_any); membership counts as a match
    out = _FakeRun(
        tool_calls=[
            (
                "query_catalog",
                {
                    "filters": [
                        {"field": "ploidy", "op": "in", "value": ["HAPLOID", "DIPLOID"]}
                    ]
                },
            ),
        ]
    )
    ev = QueryCatalogShape(must_filter=[{"field": "ploidy", "value": "DIPLOID"}])
    assert ev.evaluate(_ctx(out)) == 1.0


def test_query_shape_facets_requires_facet_by():
    # operation=facets with empty facet_by is invalid (execute() rejects it), so a
    # facets case must not credit it even when the rank column isn't asserted.
    out = _FakeRun(
        tool_calls=[("query_catalog", {"operation": "facets", "facet_by": []})]
    )
    assert QueryCatalogShape(operation="facets").evaluate(_ctx(out)) == 0.0
    # operation matching is case-insensitive; the facets guard must be too
    assert QueryCatalogShape(operation="FACETS").evaluate(_ctx(out)) == 0.0
    # the invalid facets shape is rejected even when the case doesn't assert
    # operation (keyed on the call's actual op, not the expected one)
    assert (
        QueryCatalogShape(
            must_filter=[{"field": "taxonomicLevelGenus", "value": "Anopheles"}]
        ).evaluate(
            _ctx(
                _FakeRun(
                    tool_calls=[
                        (
                            "query_catalog",
                            {
                                "operation": "facets",
                                "facet_by": [],
                                "filters": [
                                    {
                                        "field": "taxonomicLevelGenus",
                                        "value": "Anopheles",
                                    }
                                ],
                            },
                        )
                    ]
                )
            )
        )
        == 0.0
    )


def test_query_shape_must_facet_membership():
    out = _FakeRun(
        tool_calls=[("query_catalog", {"operation": "facets", "facet_by": ["level"]})]
    )
    assert (
        QueryCatalogShape(operation="facets", must_facet=["level"]).evaluate(_ctx(out))
        == 1.0
    )
    assert (
        QueryCatalogShape(operation="facets", must_facet=["isRef"]).evaluate(_ctx(out))
        == 0.0
    )


# ---------- NumbersTraceToContext ----------

# A trimmed copy of the Logan instructions block as the model sees it. Inline
# rather than rendered from a fixture, so a re-captured fixture can't quietly
# change what these cases assert.
_LOGAN_CONTEXT = """\
Job fe6f66a714dcbec8, query "Plasmodium_falciparum_18S". Results page: \
/logan-search?job=fe6f66a714dcbec8
The query has 17,629 matched runs.
Whole match set: 17,629 matched runs, of which 17,629 are known to the SRA \
mirror. 191 organisms, 399 BioProjects, 404 SRA studies, 42 countries.
Top organisms:
- Plasmodium falciparum: 14,473 (82.1%)
- Plasmodium falciparum 3D7: 1,823 (10.3%)
- Library layout:
  - PAIRED: 17,130 (97.2%)
  - SINGLE: 499 (2.8%)
- Sequencing platform:
  - ILLUMINA: 17,432 (98.9%)
- Country:
  - Malawi: 754 (4.3%)
  - Mozambique: 460 (2.6%)
  - not recorded: 14,240 (80.8%)
Top 25 hits by shared k-mer score:
1. ERR662077 score=0.972 Plasmodium falciparum ILLUMINA WGS PAIRED 2014-10-29
2. SRR7590703 score=0.990 Plasmodium falciparum ILLUMINA WGS PAIRED Malawi
"""


@dataclass
class _Reply:
    reply: str
    context: str | None = _LOGAN_CONTEXT


def _trace(reply: str, context: str | None = _LOGAN_CONTEXT) -> float:
    from evals.evaluators import NumbersTraceToContext

    return NumbersTraceToContext().evaluate(_ctx(_Reply(reply, context)))


def test_numbers_trace_exact_and_separator_variants():
    assert _trace("It matched 17,629 runs.") == 1.0
    assert _trace("It matched 17629 runs.") == 1.0
    assert _trace("It matched 17 629 runs.") == 1.0
    assert _trace("It matched 17 629 runs.") == 1.0


def test_numbers_trace_percentage_rounding():
    # Within 0.1 of the context's share, and no further.
    assert _trace("P. falciparum is 82.1% of the runs.") == 1.0
    assert _trace("P. falciparum is 82.0% of the runs.") == 1.0
    assert _trace("P. falciparum is 82% of the runs.") == 1.0
    assert _trace("P. falciparum is 82 percent of the runs.") == 1.0
    assert _trace("About 97.2% are paired-end and 99% Illumina.") == 1.0
    # 0.2 away is out, even when it is the nearest integer.
    assert _trace("About 97% are paired-end.") == 0.0
    assert _trace("P. falciparum is 83% of the runs.") == 0.0
    assert _trace("P. falciparum is 82.4% of the runs.") == 0.0
    # 12% is the right integer for 12.49%, but 0.49 away.
    assert _trace("About 12% are from Malawi.", "Malawi 12.49%") == 0.0


def test_numbers_trace_complement_of_a_percentage():
    # 100 - 80.8 = 19.2: "country recorded for 19.2%" restates the caveat;
    # 19% is 0.2 away and, under the 0.1 rule, does not.
    assert _trace("Country is recorded for only 19.2% of runs.") == 1.0
    assert _trace("Country is recorded for only 19.3% of runs.") == 1.0
    assert _trace("Country is recorded for only 19% of runs.") == 0.0
    assert _trace("Country is recorded for only 25% of runs.") == 0.0


def test_numbers_trace_large_count_leading_digits():
    assert _trace("Roughly 17.6k runs matched.") == 1.0
    assert _trace("Roughly 17,600 runs matched.") == 1.0
    assert _trace("Roughly 18,000 runs matched.") == 1.0
    assert _trace("About 14.5k are P. falciparum.") == 1.0
    assert _trace("Roughly 17.9k runs matched.") == 0.0
    assert _trace("Roughly 1.7k runs matched.") == 0.0


def test_numbers_trace_decimal_scores_round():
    assert _trace("The top hit scored 0.972.") == 1.0
    assert _trace("The top hit scored 0.97.") == 1.0
    assert _trace("The top hit scored 0.95.") == 0.0


def test_numbers_trace_ignores_accessions_job_ids_urls_and_ordinals():
    reply = (
        "1. ERR662077 from PRJEB2136 (study ERP000190), reference GCF_000002765.6\n"
        "2) SRR7590703, strain 3D7\n"
        "See /logan-search?job=fe6f66a714dcbec8&f.country=Malawi or job "
        "fe6f66a714dcbec8 at https://brc-analytics.org/x/123."
    )
    assert _trace(reply) == 1.0


def test_numbers_trace_scores_the_fraction_that_trace():
    # 17,629 and 82.1% trace; 40% does not.
    assert _trace("Of 17,629 runs, 82.1% are P. falciparum and 40% Malawi.") == (
        pytest.approx(2 / 3)
    )


def test_numbers_trace_no_numbers_and_no_context():
    assert _trace("Mostly Plasmodium falciparum.") == 1.0
    assert _trace("It matched 17,629 runs.", context=None) == 0.0


def test_numbers_trace_passes_grounded_logan_replies():
    """Replies in the shape the 2026-08-28 run scored as grounded. That report
    kept scores, not reply text, so these restate its passing answers rather
    than quoting them."""
    cohort = (
        "This search matched **17,629** runs across 191 organisms. The large "
        "majority are *Plasmodium falciparum* (14,473 runs, 82.1%), with "
        "*P. falciparum 3D7* adding another 10.3%. 97.2% are paired-end and "
        "98.9% Illumina."
    )
    geography = (
        "Country is not recorded for 80.8% of the matched runs, so any picture "
        "of geography is partial. Of the runs that do record one, Malawi (754) "
        "and Mozambique (460) lead; 42 countries appear in total."
    )
    assert _trace(cohort) == 1.0
    assert _trace(geography) == 1.0


def test_numbers_trace_fails_an_invented_share():
    """The 2026-08-28 judge failure: a share computed from the 25 hits."""
    reply = (
        "Only 2 of the 25 top hits have a country, so about 8% of runs record "
        "where they came from, mostly Malawi (50%)."
    )
    assert _trace(reply) < 1.0
    from evals.evaluators import untraced_numbers

    # "2" (of the 25) is a tally of the hits too, and nothing in the context says it.
    assert untraced_numbers(reply, _LOGAN_CONTEXT) == ["2", "8%", "50%"]


def test_numbers_trace_on_real_baseline_replies():
    """Replies MiniMax gave in the 2026-11-07 baseline, against the F1 block it
    was given: two grounded ones pass, and the one that misapplied a
    Logan-wide count ("227 saturated samples") to this search does not."""
    import json
    from pathlib import Path

    from app.services.logan_prompt import render_logan_instructions
    from evals.evaluators import untraced_numbers
    from evals.logan_fixture import load_fixture

    data = json.loads(
        (Path(__file__).parent / "data" / "logan_baseline_replies.json").read_text()
    )["replies"]
    context = render_logan_instructions(load_fixture("logan_pfal_18s").snapshot)
    assert _trace(data["what_is_this_cohort"]["reply"], context) == 1.0
    # "19%" for 19.2% recorded is 0.2 off: untraced under the 0.1 rule.
    assert untraced_numbers(data["where_is_the_data_from"]["reply"], context) == ["19%"]
    invented = data["score_meaning"]["reply"]
    assert _trace(invented, context) < 1.0
    assert "227" in untraced_numbers(invented, context)


def test_numbers_trace_bare_counts_do_not_match_shares():
    # 2.7% rounds to 3 and 0.4% to 0, but neither says "3 runs".
    ctx = "Kenya 2.7% of runs, Laos 0.4%, 191 organisms"
    assert _trace("Only 3 runs came from Kenya.", ctx) == 0.0
    assert _trace("There are 0 runs from Laos.", ctx) == 0.0
    assert _trace("191 organisms appear.", ctx) == 1.0
    # A share stated without its sign still traces.
    assert _trace("Kenya is 2.7 of every hundred runs.", ctx) == 1.0


def test_numbers_trace_rounds_half_up():
    # Decimals and large counts round half up; shares use the 0.1 rule.
    assert _trace("A score of 0.13.", "score=0.125") == 1.0
    assert _trace("About 17.7k runs.", "17,650 runs") == 1.0


def test_numbers_trace_bare_counts_do_not_round_from_decimals():
    assert _trace("Only 1 run matched.", "top score 0.9") == 0.0
    assert _trace("3 runs came from Kenya.", "Kenya 2.7") == 0.0
    assert _trace("2 runs look saturated.", "mean ANI 2.4") == 0.0
    assert _trace("Only 1 run matched.", "1 run, score 0.9") == 1.0


def test_units_exponents_and_long_numbers_are_quantities():
    from evals.evaluators import extract_numbers

    assert [n.value for n in extract_numbers("999GB of reads")] == [999.0]
    assert [n.value for n in extract_numbers("1e6 runs")] == [1e6]
    assert [n.value for n in extract_numbers("at 30x coverage")] == [30.0]
    assert [n.value for n in extract_numbers("there are 1234567890123456 runs")] == [
        1234567890123456.0
    ]
    # With nothing in the context to support them, none of them trace.
    assert _trace("999GB of reads.", "17,629 runs") == 0.0
    assert _trace("1e6 runs.", "17,629 runs") == 0.0
    # A job id still has a hex letter in it and is still skipped.
    assert extract_numbers("job 806580fd1ed1cc90 finished") == []


def test_time_and_size_suffixes_are_quantities_not_identifiers():
    from evals.evaluators import extract_numbers

    for text, value in (
        ("took 999ms", 999.0),
        ("took 2.5 sec", 2.5),
        ("in 3 min", 3.0),
        ("over 12h", 12.0),
        ("a 4GiB file", 4.0),
        ("12 days ago", 12.0),
    ):
        assert [n.value for n in extract_numbers(text)] == [value], text
    # Invented, so untraced -- not silently dropped as an identifier.
    assert _trace("The query took 999ms.", "17,629 runs") == 0.0
    assert _trace("The pass took 1.4 sec.", "median 1.4") == 1.0
    # A decade is still not a quantity.
    assert extract_numbers("runs from the 1990s") == []


def test_exponents_keep_their_real_decimal_places():
    from evals.evaluators import extract_numbers

    [tenth] = extract_numbers("a threshold of 1e-1")
    assert (tenth.value, tenth.decimals) == (0.1, 1)
    [big] = extract_numbers("2.5e3 runs")
    assert (big.value, big.decimals) == (2500.0, 0)
    assert _trace("A threshold of 1e-1.", "score >= 0.1") == 1.0
    assert _trace("A threshold of 1e-1.", "score >= 0.25") == 0.0


def test_an_absurd_exponent_is_skipped_not_a_crash():
    from evals.evaluators import extract_numbers

    assert extract_numbers("1e999 runs") == []
    assert extract_numbers("1e-999 runs") == []
    assert extract_numbers("9e99999999999999999999 and 5 runs")[-1].value == 5.0
    assert extract_numbers("1e" + "9" * 5000 + " and 5 runs")[-1].value == 5.0
    assert _trace("1e999 runs, 17,629 in all.", "17,629 runs") == 1.0


def test_numbers_trace_large_counts_keep_two_leading_digits():
    assert _trace("About 20,000 runs.") == 0.0
    assert _trace("About 18,000 runs.") == 1.0


def test_adjacent_numbers_do_not_fuse():
    from evals.evaluators import extract_numbers

    assert [n.value for n in extract_numbers("In 2019 754 runs were released")] == [
        2019.0,
        754.0,
    ]
    assert [n.value for n in extract_numbers("17 629 and 1,823 runs")] == [
        17629.0,
        1823.0,
    ]
    # The accession is skipped; the count after it survives.
    assert [n.value for n in extract_numbers("SRR123 456 runs")] == [456.0]


def test_release_dates_do_not_put_small_counts_in_the_context():
    from app.services.logan_prompt import render_logan_instructions
    from evals.logan_fixture import load_fixture

    # F1's hit list carries 25 release dates. Read as numbers they made every
    # small integer a "count", so these invented ones traced.
    context = render_logan_instructions(load_fixture("logan_pfal_18s").snapshot)
    for reply in ("Only 3 runs came from Kenya.", "14 runs came from Peru."):
        assert _trace(reply, context) == 0.0, reply


@pytest.mark.parametrize("hyphen", ["-", "‐", "‑", "‒", "–", "−"])
def test_a_date_is_an_identifier_whatever_its_hyphen(hyphen):
    date = hyphen.join(["2014", "10", "29"])
    assert extract_numbers(f"released {date}") == []
    assert _trace(f"The top hit was released {date}.", "SRR1 2014-10-29") == 1.0


def test_a_ranked_tables_rank_column_is_an_ordinal():
    ranked = (
        "| # | Accession | Score |\n|---|---|---|\n"
        "| 2 | SRR7590703 | 0.990 |\n|  13 | ERR1 | 0.972 |"
    )
    assert [n.value for n in extract_numbers(ranked)] == [0.99, 0.972]
    # A count in a later cell is still a count.
    assert [n.value for n in extract_numbers("| Malawi | 754 |")] == [754.0]


def test_a_count_first_table_keeps_its_counts():
    counts = "| Runs | Country |\n|---|---|\n| 754 | Malawi |"
    assert [n.value for n in extract_numbers(counts)] == [754.0]
    assert _trace(counts, "nothing here") == 0.0


def test_an_rrna_name_is_not_a_count():
    assert extract_numbers("the 18 S rRNA and the 18S probe") == []
    assert [n.value for n in extract_numbers("18 Samples")] == [18.0]
    # A count before an abbreviated genus is a count.
    assert _trace("Only 1,200 S. enterica runs.", "17,629 runs") == 0.0
    assert _trace("Only 3 S. Typhimurium runs.", "17,629 runs") == 0.0


def test_a_round_count_states_its_leading_digits():
    # 10,000 is 10,212 to two digits, though its zeros hide the second one.
    assert _trace("About 10,000 runs.", "10,212 runs") == 1.0
    assert _trace("About 10k runs.", "10,212 runs") == 1.0
    # One digit is still too few: 9,000 is not 10,212 to two.
    assert _trace("About 9,000 runs.", "10,212 runs") == 0.0
    assert _trace("About 10,000 runs.", "10,712 runs") == 0.0


def test_an_unsigned_decimal_traces_to_a_percentage_within_the_band():
    assert _trace("P. falciparum is 82.1 of every hundred runs.") == 1.0
    assert _trace("P. falciparum is 82.0 of every hundred runs.") == 1.0
    assert _trace("P. falciparum is 82.3 of every hundred runs.") == 0.0


def test_a_bare_count_never_traces_to_a_decimal():
    # 3 and 3.0 are equal, but a context decimal is a measurement, not a count.
    assert _trace("3 runs.", "a score of 3.0") == 0.0
    assert _trace("3 runs.", "3 runs") == 1.0


def test_small_counts_must_be_exact():
    # Leading-digit rounding is for large counts only: 900 is not 912.
    assert _trace("About 900 runs.", "912 runs") == 0.0
    assert _trace("About 9,100 runs.", "9,120 runs") == 1.0


def test_millions_scale_before_they_trace():
    assert _trace("About 1.1M runs.", "1,123,456 runs") == 1.0
    assert _trace("About 1.1 million runs.", "1,123,456 runs") == 1.0
    assert _trace("About 2 million runs.", "2,000,000 runs") == 1.0
    assert _trace("About 1.2M runs.", "1,123,456 runs") == 0.0


def test_a_job_id_is_not_a_number():
    assert extract_numbers("job 0123456789abcdef and job fe6f66a714dcbec8") == []
    # Sixteen decimal digits are a number, not an id.
    assert [n.value for n in extract_numbers("1234567890123456")] == [
        1234567890123456.0
    ]


def test_abbreviated_counts_scale_exactly():
    # 16.1 * 1e3 is 16100.000000000002 in floating point, which never equalled
    # the rounded source.
    for reply, source in (
        ("16.1k", "16,123"),
        ("32.2k", "32,234"),
        ("64.9k", "64,912"),
    ):
        assert _trace(f"About {reply} runs.", f"{source} runs") == 1.0, reply
