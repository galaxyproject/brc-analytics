"""Multi-turn assistant flow eval -- scripted conversations end-to-end."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext, LLMJudge

from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_assistant_conversation_task


@dataclass
class FinalSchemaContains(Evaluator):
    """Score the fraction of expected schema fields whose value contains the needle."""

    expected: dict[str, str] = field(default_factory=dict)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        meta = ctx.metadata or {}
        expected = self.expected or meta.get("expected_schema", {})
        if not expected:
            return 0.0
        schema = ctx.output.final_schema or {}
        hits = 0
        for key, needle in expected.items():
            field_obj = schema.get(key) or {}
            actual = (
                field_obj.get("value") if isinstance(field_obj, dict) else ""
            ) or ""
            if str(needle).lower() in str(actual).lower():
                hits += 1
        return hits / len(expected)


@dataclass
class IsCompleteEquals(Evaluator):
    expected: bool = True

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return 1.0 if bool(ctx.output.is_complete) == bool(self.expected) else 0.0


_CASES = [
    {
        "name": "yeast_rnaseq_happy_path",
        "turns": [
            "I want to analyze yeast",
            "Gene expression",
            "I have my own paired-end data",
            "Use the reference assembly",
        ],
        "expected_schema": {
            "organism": "Saccharomyces",
            "analysis_type": "Transcriptomics",
            "data_source": "user",
        },
        "expected_complete": False,
    },
    {
        "name": "tb_variant_calling",
        "turns": [
            "I'd like to find variants in TB clinical isolates",
            "Use the reference Mycobacterium tuberculosis H37Rv assembly",
            "I'll pull data from ENA",
        ],
        "expected_schema": {
            "organism": "Mycobacterium tuberculosis",
            "analysis_type": "Variant Calling",
        },
        "expected_complete": False,
    },
    {
        "name": "exploration_only",
        "turns": [
            "What kinds of analyses can I run?",
            "Tell me more about variant calling",
        ],
        # User never committed to an organism / workflow -- schema should be empty.
        "expected_schema": {},
        "expected_complete": False,
    },
]


_RUBRIC = """\
Score whether the assistant's final reply makes sense given the entire \
conversation: did it correctly summarize the user's choices, ask for the next \
piece of information, or offer to continue to setup? Penalize hallucinated data \
and ignored user statements.\
"""


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        evaluators: list[Evaluator] = [
            IsCompleteEquals(expected=c.get("expected_complete", False)),
            LLMJudge(rubric=_RUBRIC, model=judge_model, include_input=True),
        ]
        if c.get("expected_schema"):
            evaluators.insert(0, FinalSchemaContains(expected=c["expected_schema"]))
        cases.append(
            Case(
                name=c["name"],
                inputs={"turns": c["turns"]},
                metadata=c,
                evaluators=evaluators,
            )
        )
    dataset = Dataset(cases=cases)
    task = make_assistant_conversation_task(deps, entry)
    return dataset, task, FinalSchemaContains.__name__
