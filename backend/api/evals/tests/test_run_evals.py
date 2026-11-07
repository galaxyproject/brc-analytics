"""Tests for eval runner helpers."""

from pydantic_evals import Case
from pydantic_evals.evaluators import LLMJudge

from evals.evaluators import FieldEquals
from evals.run_evals import _declared_evaluator_names


def test_declared_evaluator_names_match_duplicate_suffixing():
    case = Case(
        name="x",
        inputs={},
        evaluators=(
            FieldEquals(field="taxonomy_id", expected="4932"),
            FieldEquals(field="library_strategy", expected="RNA-Seq"),
        ),
    )

    assert _declared_evaluator_names(case, []) == frozenset(
        {"FieldEquals", "FieldEquals_2"}
    )


def test_declared_evaluator_names_include_llm_judge_score_and_pass_names():
    case = Case(
        name="x",
        inputs={},
        evaluators=(
            LLMJudge(
                rubric="reasonable",
                score={},
                assertion={},
            ),
        ),
    )

    assert _declared_evaluator_names(case, []) == frozenset(
        {"LLMJudge_score", "LLMJudge_pass"}
    )


def test_write_dump_keeps_outputs_and_drops_the_snapshot(tmp_path):
    import json
    from dataclasses import dataclass, field
    from types import SimpleNamespace

    from evals.run_evals import write_dump

    @dataclass
    class _Out:
        reply: str
        session_metadata: dict = field(default_factory=dict)

    out = _Out(
        reply="17,629 runs",
        session_metadata={
            "logan": {"job_id": "x", "top_hits": [1, 2], "selection": {"n": 3}},
            "turn_count": 1,
        },
    )
    report = SimpleNamespace(
        cases=[
            SimpleNamespace(
                name="c [1/2]",
                scores={"NumbersTraceToContext": SimpleNamespace(value=0.5)},
                assertions={},
                task_duration=1.5,
                output=out,
            )
        ],
        failures=[SimpleNamespace(name="d", error_message="boom")],
    )
    path = tmp_path / "x.jsonl"
    write_dump(path, report)
    first, second = [json.loads(line) for line in path.read_text().splitlines()]
    assert first["case"] == "c [1/2]"
    assert first["scores"] == {"NumbersTraceToContext": 0.5}
    assert first["output"]["reply"] == "17,629 runs"
    assert first["output"]["session_metadata"]["logan"] == {"selection": {"n": 3}}
    assert first["output"]["session_metadata"]["turn_count"] == 1
    assert second == {"case": "d", "error": "boom"}
