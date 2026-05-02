"""Search query interpretation eval (LLMService.interpret_search_query)."""

from __future__ import annotations

from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import LLMJudge

from evals.evaluators import FieldEquals, LowConfidence
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_search_task

_CASES = [
    {
        "name": "yeast_rnaseq_2023",
        "query": "RNA-seq data for yeast from 2023",
        "expected_taxonomy_id": "4932",
        "expected_library_strategy": "RNA-Seq",
    },
    {
        "name": "malaria_wgs",
        "query": "whole-genome sequencing of Plasmodium falciparum",
        "expected_taxonomy_id": "5833",
        "expected_library_strategy": "WGS",
    },
    {
        "name": "tb_chipseq",
        "query": "ChIP-seq experiments on Mycobacterium tuberculosis",
        "expected_taxonomy_id": "1773",
        "expected_library_strategy": "ChIP-Seq",
    },
    {
        "name": "ecoli_illumina",
        "query": "E. coli sequencing on Illumina platforms",
        "expected_taxonomy_id": "562",
        "expected_sequencing_platform": "Illumina",
    },
    {
        "name": "candida_auris_drug_resistance",
        "query": "Candida auris isolates with drug resistance",
        "expected_taxonomy_id": "498019",
    },
    {
        "name": "nanopore_pacbio_long_reads",
        "query": "long-read sequencing of any organism using Nanopore",
        "expected_sequencing_platform": "Oxford Nanopore",
    },
    {
        "name": "gibberish",
        "query": "asdkjfh qwerty 12345 nonsense",
        "expected_low_confidence": True,
    },
    {
        "name": "yeast_common_name",
        "query": "baker's yeast transcriptomics",
        "expected_taxonomy_id": "4932",
        "expected_library_strategy": "RNA-Seq",
    },
    {
        "name": "tb_variant_calling_intent",
        "query": "TB samples sequenced for variant calling",
        "expected_taxonomy_id": "1773",
    },
    {
        "name": "atac_seq_chromatin",
        "query": "ATAC-seq chromatin accessibility data",
        "expected_library_strategy": "ATAC-seq",
    },
]


_RUBRIC = """\
Score whether the interpreted DatasetQuery is a *reasonable* interpretation of \
the natural-language query, given the case metadata. Consider whether all \
clearly-stated entities (organism, library strategy, platform, date range) are \
captured. Ignore optional fields the user didn't mention. \
For gibberish queries, a low confidence (<= 0.3) is the correct interpretation.\
"""


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        evaluators = []
        if "expected_taxonomy_id" in c:
            evaluators.append(
                FieldEquals(field="taxonomy_id", expected=c["expected_taxonomy_id"])
            )
        if "expected_library_strategy" in c:
            evaluators.append(
                FieldEquals(
                    field="library_strategy", expected=c["expected_library_strategy"]
                )
            )
        if "expected_sequencing_platform" in c:
            evaluators.append(
                FieldEquals(
                    field="sequencing_platform",
                    expected=c["expected_sequencing_platform"],
                )
            )
        if c.get("expected_low_confidence"):
            evaluators.append(LowConfidence(threshold=0.3))
        evaluators.append(
            LLMJudge(rubric=_RUBRIC, model=judge_model, include_input=True)
        )
        cases.append(
            Case(
                name=c["name"],
                inputs={"query": c["query"]},
                metadata=c,
                evaluators=evaluators,
            )
        )
    dataset = Dataset(cases=cases)
    task = make_search_task(deps, entry)
    return dataset, task, FieldEquals.__name__
