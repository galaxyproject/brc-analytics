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
            dataset="tool_selection",
            model="claude-sonnet-4-6",
            cases=[
                _StubCase(name="yeast_rnaseq_2023", scores={"FieldEquals": 1.0}),
                _StubCase(name="malaria_wgs", scores={"FieldEquals": 0.0}),
            ],
            failures=[("gibberish", "schema validation", frozenset({"FieldEquals"}))],
            primary_score="FieldEquals",
            duration_seconds=12.34,
        ),
    ]
    md = render_report(runs, sha="abc123")
    assert "# BRC Analytics evals" in md
    assert "abc123" in md
    assert "tool_selection" in md
    assert "claude-sonnet-4-6" in md
    assert "yeast_rnaseq_2023" in md
    # Failure declared FieldEquals: total = 2 cases + 1 failure, score 1.0/3
    assert "1.0/3" in md


def test_failure_only_counts_for_declared_evaluators():
    """A structural failure must only contribute to denominators of evaluators
    actually declared on that case. Otherwise partial-coverage scorers like
    _NoToolCalls (only on off_topic_redirect) get diluted by every unrelated
    failure."""
    runs = [
        RunResult(
            dataset="tool_selection",
            model="m",
            cases=[
                _StubCase(name="a", scores={"ToolCallMatch": 1.0}),
                _StubCase(name="b", scores={"_NoToolCalls": 1.0}),
            ],
            # Failure on case "c" had ToolCallMatch declared, NOT _NoToolCalls.
            failures=[("c", "boom", frozenset({"ToolCallMatch"}))],
            primary_score="ToolCallMatch",
            duration_seconds=1.0,
        ),
    ]
    r = runs[0]
    # ToolCallMatch: 1 passing case + 1 failure (declared) = 2; avg = 1/2
    assert r.evaluator_count("ToolCallMatch") == 2
    assert r.avg("ToolCallMatch") == 0.5
    # _NoToolCalls: 1 passing case, failure did NOT declare it = 1; avg = 1/1
    assert r.evaluator_count("_NoToolCalls") == 1
    assert r.avg("_NoToolCalls") == 1.0


def test_failure_only_evaluators_still_render_summary_columns():
    runs = [
        RunResult(
            dataset="tool_selection",
            model="m",
            cases=[],
            failures=[("x", "boom", frozenset({"FieldEquals", "LLMJudge"}))],
            primary_score="FieldEquals",
            duration_seconds=1.0,
        ),
    ]

    md = render_report(runs, sha="abc123")

    assert "| Model | FieldEquals | LLMJudge | n | duration |" in md
    assert "| m | 0.0/1 (0.00) | 0.0/1 (0.00) | 1 | 1.0s |" in md


def test_duplicate_evaluator_failures_count_by_suffixed_name():
    run = RunResult(
        dataset="tool_selection",
        model="m",
        cases=[
            _StubCase(
                name="ok",
                scores={"FieldEquals": 1.0, "FieldEquals_2": 1.0},
            )
        ],
        failures=[
            ("fail", "boom", frozenset({"FieldEquals", "FieldEquals_2"})),
        ],
        primary_score="FieldEquals",
        duration_seconds=1.0,
    )

    assert run.evaluator_count("FieldEquals") == 2
    assert run.avg("FieldEquals") == 0.5
    assert run.evaluator_count("FieldEquals_2") == 2
    assert run.avg("FieldEquals_2") == 0.5


def test_avg_excludes_cases_without_evaluator():
    """RunResult.avg() must divide by cases that had the evaluator,
    not all cases. Otherwise partial-coverage scorers like _NoToolCalls
    (which only applies to off_topic_redirect) get diluted to ~0."""
    runs = [
        RunResult(
            dataset="x",
            model="m",
            cases=[
                _StubCase(name="a", scores={"Common": 1.0, "Partial": 1.0}),
                _StubCase(name="b", scores={"Common": 1.0}),  # no Partial
                _StubCase(name="c", scores={"Common": 1.0}),  # no Partial
            ],
            failures=[],
            primary_score="Common",
            duration_seconds=1.0,
        ),
    ]
    r = runs[0]
    assert r.avg("Common") == 1.0
    # Partial only applied to 1 case; should average over that 1, not all 3.
    assert r.avg("Partial") == 1.0
    assert r.evaluator_count("Partial") == 1


def test_case_avg_averages_across_evaluators():
    case = _StubCase(name="x", scores={"a": 1.0, "b": 0.0})
    run = RunResult(
        dataset="x",
        model="m",
        cases=[case],
        failures=[],
        primary_score="a",
        duration_seconds=1.0,
    )
    assert run.case_avg(case) == 0.5


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
