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


# All four SRA tools -- used by negative cases to assert "none of these
# were called". Kept here so a future renamed/added SRA tool fails loudly
# rather than silently being allowed in catalog-only contexts.
_ALL_SRA_TOOLS = (
    "sra_summary_for_organism",
    "search_sra_runs",
    "top_bioprojects_for_organism",
    "get_sra_study_runs",
)


@dataclass
class _NoneOfTheseTools(Evaluator):
    """1.0 if none of the named tools were called.

    Negative tool-selection check: locks in that adding SRA tools doesn't
    poach catalog-only queries (e.g. asking about workflow categories or
    assembly compatibility should not trigger an SRA tool call)."""

    tools: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        out = ctx.output
        if not hasattr(out, "tool_calls"):
            return 1.0  # nothing called == nothing poached
        called = {name for name, _ in out.tool_calls}
        return 0.0 if any(t in called for t in self.tools) else 1.0


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
        # Platform filter -- explicit "list" phrasing forces search_sra_runs
        # over summary (summary alone would answer a yes/no but not a list).
        "name": "platform_filter_nanopore",
        "message": "List a few Oxford Nanopore runs for Candida auris with their accession numbers.",
        "expected_tool": "search_sra_runs",
        "expected_args": {"organism": "auris", "platform": "OXFORD_NANOPORE"},
    },
    {
        # SARS-CoV-2 -- the catalog has it under the NEW name
        # "Betacoronavirus pandemicum" but SRA tags submissions with the
        # OLD name. The mirror handles this via the taxid_names table,
        # and the abbreviation "SARS-CoV-2" itself resolves via the
        # curated alias map. The model can pass either form -- accept
        # the tool call without a strict args check; number-formatting
        # variation made the reply-keyword check brittle.
        "name": "summary_sars_cov_2_via_old_name",
        "message": "How much data is there for SARS-CoV-2?",
        "expected_tool": "sra_summary_for_organism",
    },
    {
        # Alias path for a common abbreviation (TB) that NCBI doesn't list
        # as a taxonomy name. The agent should call the summary tool, and
        # the reply should identify what TB is -- catches the case where
        # the alias resolves silently to the wrong organism.
        "name": "alias_tb_abbreviation",
        "message": "How much TB sequencing data is in the SRA mirror?",
        "expected_tool": "sra_summary_for_organism",
        "expected_keywords": ["tuberculosis"],
    },
    {
        # Same alias path for HIV (resolves to HIV-1 by curated default).
        "name": "alias_hiv_abbreviation",
        "message": "How much HIV sequencing data is in the SRA mirror?",
        "expected_tool": "sra_summary_for_organism",
        "expected_keywords": ["immunodeficiency"],
    },
    # ----------- Negative cases: SRA tools must NOT be called -----------
    # These lock in that the new tools don't poach catalog-only queries.
    # Each asserts (a) the right catalog tool was called, (b) zero SRA
    # tools were called.
    {
        "name": "negative_workflow_categories",
        "message": "What analysis workflow categories are available?",
        "expected_tool": "list_workflow_categories",
        "no_sra_tools": True,
    },
    {
        "name": "negative_assembly_details",
        "message": "Tell me about assembly GCF_000005845.2.",
        "expected_tool": "get_assembly_details",
        "expected_args": {"accession": "GCF_000005845.2"},
        "no_sra_tools": True,
    },
    {
        "name": "negative_workflow_compatibility",
        "message": "Is the variant-calling workflow compatible with assembly GCF_000146045.2?",
        "any_of_tools": ["check_compatibility", "get_compatible_workflows"],
        "no_sra_tools": True,
    },
    {
        "name": "negative_transcriptomics_workflows",
        "message": "Show me the available transcriptomics workflows.",
        "expected_tool": "get_workflows_in_category",
        "expected_args": {"category": "TRANSCRIPTOMICS"},
        "no_sra_tools": True,
    },
    {
        "name": "negative_organism_search",
        "message": "What yeast organisms are in the catalog?",
        "expected_tool": "search_organisms",
        "expected_args": {"query": "yeast"},
        "no_sra_tools": True,
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
        if c.get("no_sra_tools"):
            evaluators.append(_NoneOfTheseTools(tools=list(_ALL_SRA_TOOLS)))
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
