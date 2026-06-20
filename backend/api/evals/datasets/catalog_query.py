"""Catalog-query eval: does the model author a correct `query_catalog` IR?

Distinct from `tool_selection` (which only checks *which* tool fires): these
cases check the *shape* of the query the model builds for assembly questions —
the operation and the key filter fields/values — without asserting exact counts,
so they don't drift as the catalog snapshot changes.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_assistant_turn_task


@dataclass
class QueryCatalogShape(Evaluator):
    """1.0 if a `query_catalog` call matches the expected operation and contains
    every required substring in its (serialized) args.

    `operation` is checked only when given (a bare `list` is often left implicit
    by the model). `must_contain` is matched against the JSON-serialized args, so
    it catches filter field names ("isRef") and values ("Complete Genome") alike.
    """

    operation: str | None = None
    must_contain: list[str] = field(default_factory=list)

    @staticmethod
    def _has(blob: str, token: str) -> bool:
        # Match at alpha boundaries so a field fragment like "level" doesn't
        # spuriously match "taxonomiclevelgenus", while a partial value token
        # like "neoformans" still matches inside "cryptococcus neoformans".
        return re.search(rf"(?<![a-z]){re.escape(token)}(?![a-z])", blob) is not None

    def evaluate(self, ctx: EvaluatorContext) -> float:
        for name, args in getattr(ctx.output, "tool_calls", None) or []:
            if name != "query_catalog":
                continue
            op = str(args.get("operation", "")).lower()
            if self.operation and op != self.operation:
                continue
            blob = json.dumps(args, default=str).lower()
            if all(self._has(blob, s.lower()) for s in self.must_contain):
                return 1.0
        return 0.0


# Each case: a question, the expected operation (or None), and substrings that
# must appear in the query_catalog args. Prompts adapted from the dev spike.
_CASES = [
    {
        "name": "count_clade_anopheles",
        "message": "How many assemblies do you have for Anopheles?",
        "operation": "count",
        "must_contain": ["anopheles"],
    },
    {
        "name": "count_chromosome_total",
        "message": "How many chromosome-level assemblies are there in total?",
        "operation": "count",
        "must_contain": ["chromosome"],
    },
    {
        "name": "facets_by_level",
        "message": "How many assemblies are there at each assembly level?",
        "operation": "facets",
        "must_contain": ["level"],
    },
    {
        "name": "list_species_and_level",
        "message": (
            "Which complete-genome assemblies do you have for Cryptococcus neoformans?"
        ),
        "operation": None,
        "must_contain": ["complete genome", "neoformans"],
    },
    {
        "name": "empty_intersection_ref_and_complete",
        "message": (
            "Do you have a reference assembly that is also complete-genome "
            "level for Candida albicans?"
        ),
        "operation": None,
        "must_contain": ["isref", "complete genome", "albicans"],
    },
    {
        "name": "reference_only_for_species",
        "message": "Show me the reference assemblies for Plasmodium vivax.",
        "operation": None,
        "must_contain": ["isref", "vivax"],
    },
]


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
                inputs={"message": c["message"]},
                metadata=c,
                evaluators=[
                    QueryCatalogShape(
                        operation=c["operation"],
                        must_contain=c["must_contain"],
                    )
                ],
            )
        )
    dataset = Dataset(cases=cases)
    task = make_assistant_turn_task(deps, entry)
    return dataset, task, QueryCatalogShape.__name__
