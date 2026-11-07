"""The logan_narrowing dataset's evaluators and ground truth, offline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from pydantic_evals.evaluators import EvaluatorContext

from evals.datasets.logan_narrowing import (
    _CASES,
    LoganQueryShape,
    _ReplyHasCount,
    _SelectionHas,
    ground_truth,
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


THAI_WGS = [
    {"field": "country", "op": "eq", "value": "Thailand"},
    {"field": "assay_type", "op": "eq", "value": "WGS"},
]
SHAPE = LoganQueryShape(
    must_filter=[
        {"field": "country", "value": "Thailand"},
        {"field": "assay_type", "value": "WGS"},
    ]
)


def test_shape_reads_a_tool_call_flat_or_nested():
    flat = _Out(turns=[_Turn(tool_calls=[("query_logan_hits", {"filters": THAI_WGS})])])
    nested = _Out(
        turns=[
            _Turn(tool_calls=[("query_logan_hits", {"query": {"filters": THAI_WGS}})])
        ]
    )
    other_tool = _Out(
        turns=[_Turn(tool_calls=[("query_catalog", {"filters": THAI_WGS})])]
    )
    assert SHAPE.evaluate(_ctx(flat)) == 1.0
    assert SHAPE.evaluate(_ctx(nested)) == 1.0
    assert SHAPE.evaluate(_ctx(other_tool)) == 0.0


def test_shape_reads_the_extractors_query_but_not_intent_none():
    asked = _Out(
        turns=[_Turn(narrowing={"intent": "ask", "query": {"filters": THAI_WGS}})]
    )
    none = _Out(
        turns=[_Turn(narrowing={"intent": "none", "query": {"filters": THAI_WGS}})]
    )
    assert SHAPE.evaluate(_ctx(asked)) == 1.0
    assert SHAPE.evaluate(_ctx(none)) == 0.0


def test_shape_scores_only_the_last_turn():
    early = _Out(
        turns=[
            _Turn(narrowing={"intent": "ask", "query": {"filters": THAI_WGS}}),
            _Turn(),
        ]
    )
    assert SHAPE.evaluate(_ctx(early)) == 0.0


def test_shape_must_not_filter():
    shape = LoganQueryShape(
        must_filter=[{"field": "assay_type", "value": "WGS"}],
        must_not_filter=[{"field": "country"}],
    )
    with_country = _Out(
        turns=[_Turn(tool_calls=[("query_logan_hits", {"filters": THAI_WGS})])]
    )
    without = _Out(
        turns=[_Turn(tool_calls=[("query_logan_hits", {"filters": THAI_WGS[1:]})])]
    )
    assert shape.evaluate(_ctx(with_country)) == 0.0
    assert shape.evaluate(_ctx(without)) == 1.0


def test_reply_count():
    assert (
        _ReplyHasCount(expected=7744).evaluate(_ctx(_Out("There are 7,744 runs.")))
        == 1.0
    )
    assert _ReplyHasCount(expected=181).evaluate(_ctx(_Out("About 18 or 1810."))) == 0.0
    # A score in the reply is not the count.
    assert (
        _ReplyHasCount(expected=9).evaluate(_ctx(_Out("scores of 0.9 or more"))) == 0.0
    )
    zero = _ReplyHasCount(expected=0)
    assert (
        zero.evaluate(_ctx(_Out("There are no runs from Mozambique that are WGA.")))
        == 1.0
    )
    assert zero.evaluate(_ctx(_Out("I found 0 matching runs."))) == 1.0
    assert zero.evaluate(_ctx(_Out("There are 12 runs."))) == 0.0


def test_selection_has_and_cleared():
    selected = _Out(
        session_metadata={
            "logan": {"selection": {"query": {"filters": THAI_WGS}, "total": 181}}
        }
    )
    assert (
        _SelectionHas(must_filter=[{"field": "country", "value": "Thailand"}]).evaluate(
            _ctx(selected)
        )
        == 1.0
    )
    assert _SelectionHas(cleared=True).evaluate(_ctx(selected)) == 0.0
    assert _SelectionHas(cleared=True).evaluate(_ctx(_Out())) == 1.0
    assert (
        _SelectionHas(must_filter=[{"field": "country"}]).evaluate(_ctx(_Out())) == 0.0
    )


def test_ground_truth_is_plain_sql_over_the_fixture():
    truths = {c["name"]: ground_truth(c["truth"]) for c in _CASES}
    assert len(_CASES) == 10
    assert truths["empty_result"] == 0
    assert truths["misspelt_value"] > 0
    # The follow-up narrows the selection, so it can only shrink it.
    assert truths["follow_up_narrows_selection"] <= truths["select_country"]
    # Every value a case expects in a filter exists in the export: one the
    # search lacks would test dropping a value, not counting.
    import duckdb

    from evals.logan_fixture import load_fixture

    path = str(load_fixture("logan_pfal_18s").parquet)
    con = duckdb.connect()
    for c in _CASES:
        for spec in c["must_filter"]:
            if "value" not in spec or spec["field"] in ("score", "release_year"):
                continue
            n = con.execute(
                f'SELECT count(*) FROM read_parquet(?) WHERE "{spec["field"]}" = ?',
                [path, spec["value"]],
            ).fetchone()[0]
            assert n > 0, (c["name"], spec)
