"""Workflow recommendation eval (LLMService.suggest_workflows)."""

from __future__ import annotations

from dataclasses import dataclass, field

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext, LLMJudge

from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_workflow_rec_task


@dataclass
class IwcIdInSet(Evaluator):
    """1.0 if any returned iwc_id matches one of the accepted IDs."""

    accepted: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        accepted = {
            a.lower()
            for a in (self.accepted or ctx.metadata.get("accepted_iwc_ids", []))
        }
        if not accepted:
            return 0.0
        ids = {(i or "").lower() for i in (ctx.output.iwc_ids or [])}
        return 1.0 if ids & accepted else 0.0


# Note: keep accepted lists short and curated -- update as new workflows ship.
_CASES = [
    {
        "name": "yeast_rnaseq",
        "request": {
            "dataset_description": "Paired-end Illumina RNA-seq from S. cerevisiae",
            "analysis_goal": "Differential gene expression",
            "organism_taxonomy_id": "4932",
            "experiment_type": "RNA-seq",
        },
        "accepted_iwc_ids": [
            "iwc/transcriptomics/rnaseq",
            "iwc/transcriptomics/rnaseq-hisat2-deseq2",
        ],
    },
    {
        "name": "tb_variant_calling",
        "request": {
            "dataset_description": "Illumina paired-end WGS from Mtb clinical isolates",
            "analysis_goal": "Identify SNPs and small indels",
            "organism_taxonomy_id": "1773",
            "experiment_type": "DNA-seq",
        },
        "accepted_iwc_ids": [
            "iwc/variant-calling/snippy",
            "iwc/variant-calling/bcftools",
        ],
    },
    {
        "name": "consensus_assembly",
        "request": {
            "dataset_description": "Nanopore reads from a viral outbreak sample",
            "analysis_goal": "Generate a consensus sequence",
            "experiment_type": "DNA-seq",
        },
        "accepted_iwc_ids": [
            "iwc/consensus-sequences/nanopore-consensus",
            "iwc/assembly/flye",
        ],
    },
]


_RUBRIC = """\
Score whether the recommendation is a *reasonable* match for the dataset and \
analysis goal. The catalog is authoritative -- any recommended workflow_id must \
plausibly belong to the requested category. Penalize generic answers and \
hallucinated IDs.\
"""


def build(deps: EvalDeps, entry: ModelEntry, judge_model: Model, only=None):
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        cases.append(
            Case(
                name=c["name"],
                inputs=c["request"],
                metadata=c,
                evaluators=[
                    IwcIdInSet(accepted=c["accepted_iwc_ids"]),
                    LLMJudge(rubric=_RUBRIC, model=judge_model),
                ],
            )
        )
    dataset = Dataset(cases=cases)
    task = make_workflow_rec_task(deps, entry)
    return dataset, task, "IwcIdInSet"
