"""Tool-selection eval for the AssistantAgent.

Each case sends one user message and inspects the resulting tool call trace.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from evals.evaluators import ToolCallMatch
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_assistant_turn_task


@dataclass
class _NoToolCalls(Evaluator):
    """1.0 if the agent made zero tool calls."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return 0.0 if getattr(ctx.output, "tool_calls", None) else 1.0


@dataclass
class _ReplyMustMention(Evaluator):
    """Score keyword presence in `output.reply` (case-insensitive substring)."""

    keywords: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = (getattr(ctx.output, "reply", "") or "").lower()
        if not self.keywords:
            return 0.0
        hits = sum(1 for k in self.keywords if k.lower() in text)
        return hits / len(self.keywords)


_CASES = [
    {
        "name": "list_yeast_assemblies",
        "message": "What yeast assemblies do you have?",
        "expected_tool": "search_organisms",
        "expected_args": {"query": "yeast"},
        "expected_keywords": ["Saccharomyces"],
    },
    {
        "name": "lookup_tb_assemblies_by_taxid",
        "message": (
            "Show me the genome assemblies for Mycobacterium tuberculosis (taxid 1773)."
        ),
        "expected_tool": "query_catalog",
    },
    {
        "name": "list_workflow_categories",
        "message": "What kinds of analyses can I run?",
        "expected_tool": "list_workflow_categories",
    },
    {
        "name": "transcriptomics_workflows",
        "message": "What transcriptomics workflows do you have?",
        "expected_tool": "get_workflows_in_category",
        "expected_args": {"category": "TRANSCRIPTOMICS"},
    },
    {
        "name": "compatibility_check",
        "message": (
            "Is the RNA-seq workflow compatible with assembly GCF_000146045.2?"
        ),
        "expected_tool": "check_compatibility",
        "expected_args": {"accession": "GCF_000146045.2"},
    },
    {
        "name": "assembly_details",
        "message": "Tell me about assembly GCF_000005845.2.",
        "expected_tool": "get_assembly_details",
        "expected_args": {"accession": "GCF_000005845.2"},
    },
    {
        "name": "compatible_workflows_haploid",
        "message": "Which workflows can I run on a haploid genome?",
        "expected_tool": "get_compatible_workflows",
        "expected_args": {"organism_ploidies": "HAPLOID"},
    },
    {
        "name": "off_topic_redirect",
        "message": "What's the weather in Paris today?",
        "expected_no_tool_call": True,
        "expected_keywords": ["BRC", "bioinformatics"],
    },
]


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        evaluators: list[Evaluator] = []
        if c.get("expected_no_tool_call"):
            evaluators.append(_NoToolCalls())
        else:
            evaluators.append(
                ToolCallMatch(
                    tool=c["expected_tool"],
                    arg_substrings=c.get("expected_args", {}),
                )
            )
        if "expected_keywords" in c:
            evaluators.append(_ReplyMustMention(keywords=c["expected_keywords"]))
        cases.append(
            Case(
                name=c["name"],
                inputs={"message": c["message"]},
                metadata=c,
                evaluators=evaluators,
            )
        )
    dataset = Dataset(cases=cases)
    task = make_assistant_turn_task(deps, entry)
    return dataset, task, ToolCallMatch.__name__
