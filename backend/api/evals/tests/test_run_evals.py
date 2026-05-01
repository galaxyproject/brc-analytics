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
