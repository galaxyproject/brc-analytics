"""The logan_narrowing dataset's scorers and ground truth, offline.

Each wrong answer the review found the old scorers passing is a case here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest
from pydantic_evals.evaluators import EvaluatorContext

from evals.datasets.logan_narrowing import (
    _CASES,
    LoganQueryShape,
    _ReplyHasCount,
    _SelectionHas,
    canonical_filters,
    ground_truth,
    require_whole_export,
    run_total_claims,
)


@dataclass
class _Turn:
    tool_calls: list = field(default_factory=list)
    narrowing: dict = field(default_factory=dict)


@dataclass
class _Out:
    reply: str = ""
    turns: list = field(default_factory=list)
    session_metadata: dict = field(default_factory=dict)


def _ctx(output: Any) -> EvaluatorContext:
    return EvaluatorContext(
        name="case",
        inputs=None,
        output=output,
        expected_output=None,
        metadata={},
        duration=0.0,
        _span_tree=None,
        attributes={},
        metrics={},
    )


def _f(name, op, value):
    return {"field": name, "op": op, "value": value}


def _tool(*filter_lists) -> _Out:
    calls = [("query_logan_hits", {"filters": fl}) for fl in filter_lists]
    return _Out(turns=[_Turn(tool_calls=calls)])


YEAR = LoganQueryShape(
    expect=[_f("organism", "eq", "Plasmodium vivax"), _f("release_year", "gt", 2019)]
)


def test_equivalent_spellings_agree():
    assert canonical_filters([_f("release_year", "gt", 2019)]) == canonical_filters(
        [_f("release_year", "gte", 2020)]
    )
    assert canonical_filters([_f("country", "eq", "Kenya")]) == canonical_filters(
        [_f("country", "in", ["Kenya"])]
    )
    # Score isn't an integer field: gt 0.89 is not gte 0.9.
    assert canonical_filters([_f("score", "gt", 0.89)]) != canonical_filters(
        [_f("score", "gte", 0.9)]
    )
    assert canonical_filters(["junk"]) is None


def test_shape_accepts_the_right_query_in_either_spelling():
    right = [_f("organism", "eq", "Plasmodium vivax"), _f("release_year", "gt", 2019)]
    same = [
        _f("organism", "in", ["Plasmodium vivax"]),
        _f("release_year", "gte", 2020),
    ]
    assert YEAR.evaluate(_ctx(_tool(right))) == 1.0
    assert YEAR.evaluate(_ctx(_tool(same))) == 1.0


def test_shape_rejects_a_wrong_year():
    # "after 2019" answered with "before 1990".
    wrong = [_f("organism", "eq", "Plasmodium vivax"), _f("release_year", "lt", 1990)]
    assert YEAR.evaluate(_ctx(_tool(wrong))) == 0.0


def test_shape_rejects_an_extra_filter():
    shape = LoganQueryShape(expect=[_f("country", "eq", "Senegal")])
    extra = [_f("country", "eq", "Senegal"), _f("platform", "eq", "PACBIO_SMRT")]
    assert shape.evaluate(_ctx(_tool(extra))) == 0.0


def test_shape_scores_the_last_query_of_the_last_turn():
    shape = LoganQueryShape(expect=[_f("country", "eq", "Senegal")])
    # Right, then contradicted by a later call in the same turn.
    later_wrong = _tool([_f("country", "eq", "Senegal")], [_f("country", "eq", "Mali")])
    assert shape.evaluate(_ctx(later_wrong)) == 0.0
    # Right only on an earlier turn.
    early = _Out(
        turns=[
            _Turn(
                tool_calls=[
                    ("query_logan_hits", {"filters": [_f("country", "eq", "Senegal")]})
                ]
            ),
            _Turn(),
        ]
    )
    assert shape.evaluate(_ctx(early)) == 0.0


def test_shape_reads_the_extractor_but_not_intent_none():
    shape = LoganQueryShape(expect=[_f("country", "eq", "Kenya")])
    asked = _Out(
        turns=[
            _Turn(
                narrowing={
                    "intent": "ask",
                    "query": {"filters": [_f("country", "eq", "Kenya")]},
                }
            )
        ]
    )
    none = _Out(
        turns=[
            _Turn(
                narrowing={
                    "intent": "none",
                    "query": {"filters": [_f("country", "eq", "Kenya")]},
                }
            )
        ]
    )
    nested = _Out(
        turns=[
            _Turn(
                tool_calls=[
                    (
                        "query_logan_hits",
                        {"query": {"filters": [_f("country", "eq", "Kenya")]}},
                    )
                ]
            )
        ]
    )
    assert shape.evaluate(_ctx(asked)) == 1.0
    assert shape.evaluate(_ctx(none)) == 0.0
    assert shape.evaluate(_ctx(nested)) == 1.0


def test_count_must_be_stated_as_a_run_total():
    ev = _ReplyHasCount(expected=7744, also_ok=[17629])
    assert (
        ev.evaluate(_ctx(_Out("There are 7,744 runs with a score of 0.9 or more.")))
        == 1.0
    )
    assert ev.evaluate(_ctx(_Out("Of the 17,629 runs, 7,744 runs scored 0.9+."))) == 1.0
    # The number somewhere else, as a share, is not the claim.
    ev42 = _ReplyHasCount(expected=42)
    assert ev42.evaluate(_ctx(_Out("42% are WGS; there are 999 matching runs."))) == 0.0
    assert ev42.evaluate(_ctx(_Out("Top 42 countries."))) == 0.0


def test_a_contradicting_total_fails():
    ev = _ReplyHasCount(expected=181, also_ok=[17629, 231])
    assert ev.evaluate(_ctx(_Out("181 of the 231 Thai runs are WGS."))) == 1.0
    assert ev.evaluate(_ctx(_Out("181 runs match; actually 190 runs."))) == 0.0


def test_zero_needs_a_none_claim_and_no_other_total():
    zero = _ReplyHasCount(expected=0, also_ok=[17629])
    assert zero.evaluate(_ctx(_Out("There are no WGA runs from Mozambique."))) == 1.0
    assert zero.evaluate(_ctx(_Out("I found 0 matching runs."))) == 1.0
    assert zero.evaluate(_ctx(_Out("No change: 50 runs match."))) == 0.0
    assert zero.evaluate(_ctx(_Out("There are 12 runs."))) == 0.0


def test_selection_must_be_exact():
    thai = [_f("country", "eq", "Thailand")]

    def out(filters):
        return _Out(
            session_metadata={
                "logan": {"selection": {"query": {"filters": filters}, "total": 1}}
            }
        )

    ev = _SelectionHas(expect=thai)
    assert ev.evaluate(_ctx(out(thai))) == 1.0
    assert ev.evaluate(_ctx(out(thai + [_f("platform", "eq", "ILLUMINA")]))) == 0.0
    assert ev.evaluate(_ctx(_Out())) == 0.0
    assert _SelectionHas(cleared=True).evaluate(_ctx(out(thai))) == 0.0
    assert _SelectionHas(cleared=True).evaluate(_ctx(_Out())) == 1.0


def test_claims_parse():
    assert run_total_claims(
        "The search has 17,629 matched runs and 5 P. vivax runs."
    ) == [
        17629,
        5,
    ]
    assert run_total_claims("Matching runs: 7 744") == [7744]


def test_the_fixture_is_the_whole_export():
    require_whole_export()


@pytest.mark.parametrize("case", _CASES, ids=[c["name"] for c in _CASES])
def test_the_engine_agrees_with_plain_sql_on_every_expected_query(case):
    """Each case's expected filters, run through the engine under test, give
    the count the case checks the reply against (computed in plain SQL)."""
    from app.services.tools.catalog_query import LoganHitQuery, execute_logan_hits
    from evals.logan_fixture import load_fixture

    q = LoganHitQuery.model_validate({"filters": case["expect"]})
    got = execute_logan_hits(q, load_fixture("logan_pfal_18s").parquet)["total"]
    assert got == ground_truth(case["truth"])


def test_every_expected_value_exists_in_the_export():
    """A value the search lacks would test dropping a value, not counting."""
    import duckdb

    from evals.logan_fixture import load_fixture

    path = str(load_fixture("logan_pfal_18s").parquet)
    con = duckdb.connect()
    for c in _CASES:
        for spec in c["expect"]:
            if spec["field"] in ("score", "release_year"):
                continue
            n = con.execute(
                f'SELECT count(*) FROM read_parquet(?) WHERE "{spec["field"]}" = ?',
                [path, spec["value"]],
            ).fetchone()[0]
            assert n > 0, (c["name"], spec)


def test_claims_in_the_forms_replies_use():
    assert run_total_claims("Of the 231 Thailand runs, **181 are WGS**.") == [231, 181]
    assert run_total_claims(
        "Runs with a score of 0.9 or more: 7,744 out of the 17,629."
    ) == [7744]


def test_context_counts_are_not_contradictions():
    @dataclass
    class _WithContext(_Out):
        context: str = ""

    ev = _ReplyHasCount(expected=0, also_ok=[17629])
    reply = "There are 0 WGA runs from Mozambique; Mozambique has 460 runs in all."
    assert (
        ev.evaluate(_ctx(_WithContext(reply, context="Mozambique: 460 (2.6%)"))) == 1.0
    )
    assert ev.evaluate(_ctx(_WithContext(reply, context="nothing relevant"))) == 0.0
