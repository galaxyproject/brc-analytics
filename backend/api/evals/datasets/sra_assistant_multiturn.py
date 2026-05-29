"""Multi-turn flows that exercise the SRA tools alongside catalog tools.

These are the scripted versions of the spike-test scenarios that
demonstrated the most value: synonym handling across turns, drill-down
from summary to study runs, and the end-to-end "scope an analysis"
flow that fills the analysis schema.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext, LLMJudge

from evals.datasets.assistant_multiturn import FinalSchemaContains, IsCompleteEquals
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_assistant_conversation_task, require_sra_mirror


@dataclass
class _ReplyMustMention(Evaluator):
    keywords: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = (getattr(ctx.output, "reply", "") or "").lower()
        if not self.keywords:
            return 0.0
        hits = sum(1 for k in self.keywords if k.lower() in text)
        return hits / len(self.keywords)


_CASES = [
    {
        # Synonym handling across turns: same data should appear under
        # both names. Reply for turn 2 should explicitly acknowledge the
        # synonym relationship rather than confabulate different stats.
        "name": "synonym_across_turns",
        "turns": [
            "How much data is there for Candida auris?",
            "What about Candidozyma auris?",
        ],
        "reply_keywords": ["synonym", "30"],
        "expected_complete": False,
    },
    {
        # Drill-down: summary -> "show me runs from that project".
        # Tests that the assistant carries the BioProject accession
        # from turn 1 into turn 2's tool call.
        "name": "drilldown_to_study_runs",
        "turns": [
            "What's the biggest sequencing study for Mycobacterium tuberculosis?",
            "Show me a few runs from that project.",
        ],
        "reply_keywords": ["SRR", "WGS"],
        "expected_complete": False,
    },
    {
        # End-to-end variant calling on TB. Should fill organism,
        # assembly, analysis_type, workflow, data_source, and ideally
        # data_characteristics. Most demanding case in the suite -- it
        # combines catalog (assemblies, workflows) and SRA (data
        # availability, run filter) in one conversation.
        "name": "tb_variant_calling_end_to_end",
        "turns": [
            "I want to set up variant calling for tuberculosis. What reference assemblies do you have, and how much sequencing data exists?",
            "Use the H37Rv assembly. I want to filter to Oxford Nanopore runs from the last year.",
        ],
        "expected_schema": {
            "organism": "tuberculosis",
            "assembly": "GCF_000195955",
            "analysis_type": "Variant Calling",
            "data_source": "SRA",
        },
        "expected_complete": True,  # handoff URL should be buildable
    },
    {
        # Cross-organism comparison -- requires two tool calls and
        # synthesizing a comparison statement.
        "name": "compare_pf_vs_pv",
        "turns": [
            "Compare the available SRA data for Plasmodium falciparum and Plasmodium vivax. Which has more recent activity?",
        ],
        "reply_keywords": ["falciparum", "vivax", "recent"],
        "expected_complete": False,
    },
]


_RUBRIC = """\
Score whether the assistant's final reply makes sense given the entire \
conversation. Specifically: (1) Did it use SRA data (run counts, BioProject \
accessions, real numbers) rather than confabulating? (2) Did it correctly \
carry context across turns (e.g. accessions referenced earlier)? (3) When the \
user used a synonym, did it acknowledge the equivalence rather than treat the \
two names as different organisms? Penalize hallucinated numbers and ignored \
user statements.\
"""


def build(
    deps: EvalDeps,
    entry: ModelEntry,
    judge_model: Model,
    only: list[str] | None = None,
) -> tuple[Dataset, Callable, str]:
    require_sra_mirror(deps)
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
        if c.get("reply_keywords"):
            evaluators.append(_ReplyMustMention(keywords=c["reply_keywords"]))
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
    primary_score = (
        FinalSchemaContains.__name__ if any(c.get("expected_schema") for c in _CASES)
        else _ReplyMustMention.__name__
    )
    return dataset, task, primary_score
