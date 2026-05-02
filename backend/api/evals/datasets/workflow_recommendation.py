"""Workflow recommendation eval (LLMService.suggest_workflows)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

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


# Accepted IDs are real BRC catalog workflow IDs. Re-curate when the
# catalog changes -- run a quick `python -c "from app.services.workflow_catalog
# import WorkflowCatalog; ..."` to dump current IDs.
_CASES = [
    {
        "name": "yeast_rnaseq_pe",
        "request": {
            "dataset_description": "Paired-end Illumina RNA-seq from S. cerevisiae",
            "analysis_goal": "Differential gene expression",
            "organism_taxonomy_id": "4932",
            "experiment_type": "RNA-seq",
        },
        "accepted_iwc_ids": ["rnaseq-pe-main", "rnaseq-sr-main"],
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
            "haploid-variant-calling-wgs-pe-main",
            "ploidy-aware-genotype-calling-main",
        ],
    },
    {
        "name": "covid_consensus",
        "request": {
            "dataset_description": (
                "Paired-end Illumina WGS from a SARS-CoV-2 clinical sample"
            ),
            "analysis_goal": "Variant calling and consensus sequence",
            "experiment_type": "DNA-seq",
        },
        "accepted_iwc_ids": [
            "sars-cov-2-pe-illumina-wgs-variant-calling-covid-19-pe-wgs-illumina",
            "sars-cov-2-pe-illumina-artic-variant-calling-covid-19-pe-artic-illumina",
            "generic-non-segmented-viral-variant-calling-main",
        ],
    },
    {
        "name": "atac_seq",
        "request": {
            "dataset_description": "Paired-end Illumina ATAC-seq from human cells",
            "analysis_goal": "Profile chromatin accessibility",
            "experiment_type": "ATAC-seq",
        },
        "accepted_iwc_ids": ["atacseq-main"],
    },
    {
        "name": "flu_consensus",
        "request": {
            "dataset_description": "Illumina sequencing from influenza A isolate",
            "analysis_goal": "Subtyping and consensus sequence",
            "experiment_type": "DNA-seq",
        },
        "accepted_iwc_ids": ["influenza-isolates-consensus-and-subtyping-main"],
    },
]


_RUBRIC = """\
Score whether the recommendation is a *reasonable* match for the dataset and \
analysis goal. The catalog is authoritative -- any recommended workflow_id must \
plausibly belong to the requested category. Penalize generic answers and \
hallucinated IDs.\
"""


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
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
                    LLMJudge(rubric=_RUBRIC, model=judge_model, include_input=True),
                ],
            )
        )
    dataset = Dataset(cases=cases)
    task = make_workflow_rec_task(deps, entry)
    return dataset, task, IwcIdInSet.__name__
