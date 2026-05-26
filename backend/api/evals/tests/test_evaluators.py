"""Tests for deterministic evaluators."""

from dataclasses import dataclass
from typing import Any

from pydantic_evals.evaluators import EvaluatorContext

from evals.evaluators import FieldEquals, LowConfidence, MustMention, ToolCallMatch


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
