"""Tool-selection eval for the SRA-mirror-backed assistant tools.

Single-turn cases that exercise the four SRA tools registered on the
assistant when `SRA_MIRROR_PATH` is set:

- sra_summary_for_organism       -- "how much data is there"
- search_sra_runs                -- filtered listing
- top_bioprojects_for_organism   -- "biggest study"
- get_sra_study_runs             -- accession lookup

Each case checks the agent picks the right tool with sensible args and
that the natural-language reply mentions the expected number or accession.
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
class _ReplyMustMention(Evaluator):
    """Score keyword presence in `output.reply` (case-insensitive substring)."""

    keywords: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = (getattr(ctx.output, "reply", "") or "").lower()
        if not self.keywords:
            return 0.0
        hits = sum(1 for k in self.keywords if k.lower() in text)
        return hits / len(self.keywords)


@dataclass
class _AnyOfTheseTools(Evaluator):
    """1.0 if any tool in `tools` was called, regardless of args.

    Used when the right tool depends on the model's framing (e.g. asking
    for the biggest study could legitimately call summary OR top-projects)."""

    tools: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        out = ctx.output
        if not hasattr(out, "tool_calls"):
            return 0.0
        called = {name for name, _ in out.tool_calls}
        return 1.0 if any(t in called for t in self.tools) else 0.0


_CASES = [
    {
        # Most basic case: "how much data" -> summary tool.
        "name": "summary_falciparum",
        "message": "How much sequencing data is available for Plasmodium falciparum?",
        "expected_tool": "sra_summary_for_organism",
        "expected_args": {"organism": "falciparum"},
        # Mirror knows ~520K runs; the model rendering "520" or "520,741"
        # should pass. Looser match for thousands separator variation.
        "expected_keywords": ["520"],
    },
    {
        # Synonym resolution -- user uses the OLD name; agent should still
        # call summary, and the reply should mention the current count
        # (30,611) -- proving the name resolution layer works end-to-end.
        "name": "summary_candida_auris_old_name",
        "message": "How much sequencing data is available for Candida auris?",
        "expected_tool": "sra_summary_for_organism",
        "expected_args": {"organism": "auris"},
        "expected_keywords": ["30"],
    },
    {
        # Reverse synonym -- new name should yield identical results.
        "name": "summary_candidozyma_new_name",
        "message": "How much sequencing data is available for Candidozyma auris?",
        "expected_tool": "sra_summary_for_organism",
        "expected_args": {"organism": "auris"},
        "expected_keywords": ["30"],
    },
    {
        # "Biggest study" -- can be answered via summary (which includes
        # top BioProjects) or top_bioprojects directly. Accept either.
        "name": "biggest_tb_project_flexible",
        "message": "What's the biggest sequencing study for Mycobacterium tuberculosis?",
        "any_of_tools": ["top_bioprojects_for_organism", "sra_summary_for_organism"],
        "expected_keywords": ["PRJ"],
    },
    {
        # Study-accession lookup.
        "name": "study_lookup_prjeb2136",
        "message": "Show me a few runs from BioProject PRJEB2136.",
        "expected_tool": "get_sra_study_runs",
        "expected_args": {"accession": "PRJEB2136"},
        "expected_keywords": ["ERR"],
    },
    {
        # Country / geography filter -- discriminating for the mirror
        # vs the live ENA API.
        "name": "country_filter_kenya",
        "message": "Are there any recent Plasmodium falciparum sequencing samples from Kenya?",
        "expected_tool": "search_sra_runs",
        "expected_args": {"organism": "falciparum", "country": "Kenya"},
        "expected_keywords": ["Kenya"],
    },
    {
        # Platform filter -- "nanopore reads for X".
        "name": "platform_filter_nanopore",
        "message": "Are there any Oxford Nanopore reads for Candida auris?",
        "expected_tool": "search_sra_runs",
        "expected_args": {"organism": "auris", "platform": "OXFORD_NANOPORE"},
    },
    {
        # SARS-CoV-2 -- the catalog has it under the NEW name
        # "Betacoronavirus pandemicum" but SRA tags submissions with the
        # OLD name. Mirror handles this via the taxid_names table.
        "name": "summary_sars_cov_2_via_old_name",
        "message": "How much data is there for SARS-CoV-2 (severe acute respiratory syndrome coronavirus 2)?",
        "expected_tool": "sra_summary_for_organism",
        "expected_args": {"organism": "coronavirus"},
        "expected_keywords": ["million", "7"],  # 7.57M runs
    },
]


def build(
    deps: EvalDeps,
    entry: ModelEntry,
    judge_model: Model,
    only: list[str] | None = None,
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        evaluators: list[Evaluator] = []
        if "any_of_tools" in c:
            evaluators.append(_AnyOfTheseTools(tools=c["any_of_tools"]))
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
