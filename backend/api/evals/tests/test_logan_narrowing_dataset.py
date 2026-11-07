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
    call_returns: list = field(default_factory=list)


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


OK = '{"total": 1}'


def _tool(*filter_lists, returns=None) -> _Out:
    calls = [("query_logan_hits", {"filters": fl}) for fl in filter_lists]
    if returns is None:
        returns = [OK] * len(calls)
    return _Out(turns=[_Turn(tool_calls=calls, call_returns=returns)])


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
                ],
                call_returns=[OK],
            ),
            _Turn(),
        ]
    )
    assert shape.evaluate(_ctx(early)) == 0.0


def _narrowed(**record) -> _Out:
    return _Out(turns=[_Turn(narrowing=record)])


KENYA = {"filters": [_f("country", "eq", "Kenya")]}


def test_shape_reads_an_extractor_query_only_when_it_was_counted_and_applied():
    shape = LoganQueryShape(expect=[_f("country", "eq", "Kenya")])
    assert (
        shape.evaluate(
            _ctx(_narrowed(intent="ask", outcome="ask", query=KENYA, total=3))
        )
        == 1.0
    )
    assert (
        shape.evaluate(
            _ctx(_narrowed(intent="select", outcome="select", query=KENYA, total=3))
        )
        == 1.0
    )
    # Read out but never applied: nothing was counted for the reply.
    for record in (
        {"intent": "none", "outcome": "none", "query": KENYA},
        {"intent": "ask", "outcome": "unresolved", "query": KENYA},
        {"intent": "ask", "outcome": "timeout", "query": KENYA},
        {"intent": "ask", "outcome": "error", "query": KENYA},
        {"intent": "ask", "outcome": "ask", "query": KENYA},  # no total
    ):
        assert shape.evaluate(_ctx(_narrowed(**record))) == 0.0, record


def test_shape_scores_the_last_tool_call_that_returned_a_count():
    shape = LoganQueryShape(expect=[_f("country", "eq", "Kenya")])
    kenya, mali = [_f("country", "eq", "Kenya")], [_f("country", "eq", "Mali")]
    # A later call that failed doesn't displace the one that answered.
    for bad in (
        '{"error": "Query failed; try a simpler filter."}',
        '{"status": "export_not_cached"}',
        None,  # a validation retry: no return at all
        "not json",
    ):
        out = _tool(kenya, mali, returns=[OK, bad])
        assert shape.evaluate(_ctx(out)) == 1.0, bad
    # A turn none of whose calls returned a count has no query.
    assert shape.evaluate(_ctx(_tool(kenya, returns=['{"error": "x"}']))) == 0.0
    # The parameter may arrive nested under its name.
    nested = _Out(
        turns=[
            _Turn(
                tool_calls=[("query_logan_hits", {"query": KENYA})], call_returns=[OK]
            )
        ]
    )
    assert shape.evaluate(_ctx(nested)) == 1.0


def test_an_unpaired_trace_falls_back_to_position_only_when_counts_agree():
    @dataclass
    class _Old:
        tool_calls: list
        tool_returns: list
        narrowing: dict = field(default_factory=dict)

    shape = LoganQueryShape(expect=[_f("country", "eq", "Kenya")])
    call = ("query_logan_hits", KENYA)
    assert shape.evaluate(_ctx(_Out(turns=[_Old([call], [OK])]))) == 1.0
    assert shape.evaluate(_ctx(_Out(turns=[_Old([call], [])]))) == 0.0


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


def test_an_allowed_total_stated_as_the_answer_fails():
    ev = _ReplyHasCount(expected=42, also_ok=[999, 17629])
    for reply in (
        "42 runs were expected; actually 999 matching runs.",
        "42 runs? No: 999 runs match.",
        "999 of the 17,629 runs match; earlier I said 42 runs.",
        "Matching runs: 999 (42 runs in the selection).",
    ):
        assert ev.evaluate(_ctx(_Out(reply))) == 0.0, reply
    # Beside the answer, as the group it is drawn from, they are fine.
    for reply in (
        "42 of the 999 runs match.",
        "There are 42 matching runs (out of 17,629 total matched runs).",
        "Of the 999 matching runs, 42 are WGS.",
        "42 runs are WGS; all 999 are from the selection.",
    ):
        assert ev.evaluate(_ctx(_Out(reply))) == 1.0, reply

    # A breakdown beside the answer is not a second answer.
    @dataclass
    class _WithContext(_Out):
        context: str = ""

    breakdown = _WithContext(
        "Of the 999 Thai runs, 42 are WGS and 957 are WGA.", context="WGA: 957"
    )
    assert ev.evaluate(_ctx(breakdown)) == 1.0


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


def _copy_fixture(tmp_path, trim, rows=None, total_matches=None):
    import json

    import duckdb

    from evals.logan_fixture import EXTRAS_KEY, FIXTURE_DIR, load_fixture

    src = load_fixture("logan_pfal_18s")
    raw = json.loads((FIXTURE_DIR / "logan_pfal_18s.json").read_text())
    extras = dict(raw[EXTRAS_KEY])
    if trim is None:
        extras.pop("trim", None)
    else:
        extras["trim"] = trim
    raw[EXTRAS_KEY] = extras
    if total_matches is not None:
        raw["total_matches"] = total_matches
    (tmp_path / "logan_pfal_18s.json").write_text(json.dumps(raw))
    limit = f"LIMIT {rows}" if rows is not None else ""
    con = duckdb.connect()
    con.execute(
        f"COPY (SELECT * FROM read_parquet('{src.parquet}') {limit}) "
        f"TO '{tmp_path / extras['parquet']}' (FORMAT parquet)"
    )
    con.close()


@pytest.mark.parametrize(
    "trim, rows, total_matches, why",
    [
        (None, None, None, "no trim record"),
        ({}, None, None, "lacks its row counts"),
        ({"rows_kept": 17629}, None, None, "lacks its row counts"),
        ({"rows_kept": 5000, "rows_total": 17629}, None, None, "trimmed"),
        # Says whole, but the file was cut after the fact.
        ({"rows_kept": 17629, "rows_total": 17629}, 100, None, "has 100 rows"),
        # Whole file, but not the search's whole match set.
        ({"rows_kept": 17629, "rows_total": 17629}, None, 20000, "matched 20000"),
    ],
)
def test_a_fixture_that_cant_be_shown_whole_is_refused(
    tmp_path, monkeypatch, trim, rows, total_matches, why
):
    import evals.datasets.logan_narrowing as ln
    from evals.logan_fixture import load_fixture

    _copy_fixture(tmp_path, trim, rows, total_matches)
    monkeypatch.setattr(
        ln, "load_fixture", lambda name: load_fixture(name, fixture_dir=tmp_path)
    )
    with pytest.raises(RuntimeError, match=why):
        ln.require_whole_export()


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
