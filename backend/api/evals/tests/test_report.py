"""Tests for the markdown report renderer."""

from dataclasses import dataclass

from evals.report import RunResult, render_report


@dataclass
class _StubCase:
    name: str
    scores: dict[str, float]


def test_render_report_basic():
    runs = [
        RunResult(
            dataset="search_interpretation",
            model="claude-sonnet-4-6",
            cases=[
                _StubCase(name="yeast_rnaseq_2023", scores={"FieldEquals": 1.0}),
                _StubCase(name="malaria_wgs", scores={"FieldEquals": 0.0}),
            ],
            failures=[("gibberish", "schema validation")],
            primary_score="FieldEquals",
            duration_seconds=12.34,
        ),
    ]
    md = render_report(runs, sha="abc123")
    assert "# BRC Analytics evals" in md
    assert "abc123" in md
    assert "search_interpretation" in md
    assert "claude-sonnet-4-6" in md
    assert "yeast_rnaseq_2023" in md
    # Failures count as wrong: total = 2 cases + 1 failure, score 1/3
    assert "1/3" in md


def test_render_report_multi_model():
    runs = [
        RunResult(
            dataset="tool_selection",
            model="claude-sonnet-4-6",
            cases=[_StubCase(name="x", scores={"ToolCallMatch": 1.0})],
            failures=[],
            primary_score="ToolCallMatch",
            duration_seconds=2.0,
        ),
        RunResult(
            dataset="tool_selection",
            model="gpt-5",
            cases=[_StubCase(name="x", scores={"ToolCallMatch": 0.0})],
            failures=[],
            primary_score="ToolCallMatch",
            duration_seconds=3.0,
        ),
    ]
    md = render_report(runs, sha="def456")
    assert "claude-sonnet-4-6" in md
    assert "gpt-5" in md
