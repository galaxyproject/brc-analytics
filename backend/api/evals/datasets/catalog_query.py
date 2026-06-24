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
    """1.0 if a `query_catalog` call matches the expected *shape* of the IR.

    All set conditions must hold for one call:
      - `entity`      — args entity, defaulting "assembly" when the model omits it
                        (so assembly cases can be asserted, not just organism).
      - `operation`   — args operation; skipped when None (a bare `list` is often
                        left implicit by the model).
      - `must_filter` — structural: for each `{field?, op?, value?}` spec, some
                        predicate in `args["filters"]` must match every provided
                        key. This asserts the model filtered the RIGHT column with
                        the RIGHT value, not merely that a token appears somewhere
                        (the old substring check passed on a value in `sort`, the
                        wrong field, etc.).
      - `must_facet`  — each name must appear in `args["facet_by"]`.
      - `must_contain`— catch-all substrings over the serialized args (word-bounded),
                        for values that aren't filters (kept for flexibility).
    """

    entity: str | None = None
    operation: str | None = None
    must_filter: list[dict] = field(default_factory=list)
    must_facet: list[str] = field(default_factory=list)
    must_contain: list[str] = field(default_factory=list)

    @staticmethod
    def _has(blob: str, token: str) -> bool:
        # Match on word boundaries so a fragment like "level" doesn't spuriously
        # match "taxonomiclevelgenus" and a numeric token like "1773" doesn't
        # match "17730", while a partial value token like "neoformans" still
        # matches inside "cryptococcus neoformans".
        return re.search(rf"\b{re.escape(token)}\b", blob) is not None

    @staticmethod
    def _pred_values(pred: dict) -> list[str]:
        # A predicate value may be scalar or a list (in/contains_any); normalize
        # to lowercased strings so a taxid 1773 matches "1773".
        v = pred.get("value")
        items = v if isinstance(v, list) else [v]
        return [str(x).lower() for x in items if x is not None]

    @classmethod
    def _filter_matches(cls, pred: dict, spec: dict) -> bool:
        for key, want in spec.items():
            if key == "value":
                if str(want).lower() not in cls._pred_values(pred):
                    return False
            elif str(pred.get(key, "")).lower() != str(want).lower():
                return False
        return True

    def evaluate(self, ctx: EvaluatorContext) -> float:
        for name, args in getattr(ctx.output, "tool_calls", None) or []:
            if name != "query_catalog":
                continue
            if (
                self.entity
                and str(args.get("entity", "assembly")).lower() != self.entity.lower()
            ):
                continue
            want_op = self.operation.lower() if self.operation else None
            op = str(args.get("operation", "")).lower()
            if want_op and op != want_op:
                continue
            # A facets call is invalid without facet_by (execute() rejects it), so
            # never credit one — keyed on the call's ACTUAL op, not the expected
            # one, so an invalid facets call isn't credited even by a case that
            # left operation unasserted (operation=None).
            if op == "facets" and not (args.get("facet_by") or []):
                continue
            filters = args.get("filters") or []
            if not all(
                any(self._filter_matches(p, spec) for p in filters)
                for spec in self.must_filter
            ):
                continue
            facet_by = [str(f).lower() for f in (args.get("facet_by") or [])]
            if not all(f.lower() in facet_by for f in self.must_facet):
                continue
            blob = json.dumps(args, default=str).lower()
            if all(self._has(blob, s.lower()) for s in self.must_contain):
                return 1.0
        return 0.0


# Each case: a question + the IR shape the model must build — entity, operation,
# and structural filter/facet assertions (the right column + value, not a token
# anywhere). No exact counts, so cases don't drift with the catalog snapshot.
# `must_filter` specs are partial predicates matched against args["filters"];
# `value`-only specs are used where the target column is legitimately the model's
# choice (e.g. a taxid via speciesTaxonomyId-eq or lineageTaxonomyIds-contains).
_CASES = [
    {
        "name": "count_clade_anopheles",
        "message": "How many assemblies do you have for Anopheles?",
        "entity": "assembly",
        "operation": "count",
        "must_filter": [{"field": "taxonomicLevelGenus", "value": "Anopheles"}],
    },
    {
        # the taxon must actually be applied as a filter (taxid given explicitly)
        "name": "lookup_by_taxid",
        "message": (
            "Show me the genome assemblies for Mycobacterium tuberculosis (taxid 1773)."
        ),
        "entity": "assembly",
        "operation": None,
        "must_filter": [{"value": "1773"}],
    },
    {
        "name": "count_chromosome_total",
        "message": "How many chromosome-level assemblies are there in total?",
        "entity": "assembly",
        "operation": "count",
        "must_filter": [{"field": "level", "value": "Chromosome"}],
    },
    {
        "name": "facets_by_level",
        "message": "How many assemblies are there at each assembly level?",
        "entity": "assembly",
        "operation": "facets",
        "must_facet": ["level"],
    },
    {
        "name": "list_species_and_level",
        "message": (
            "Which complete-genome assemblies do you have for Cryptococcus neoformans?"
        ),
        "entity": "assembly",
        "operation": None,
        "must_filter": [
            {"field": "taxonomicLevelSpecies", "value": "Cryptococcus neoformans"},
            {"field": "level", "value": "Complete Genome"},
        ],
    },
    {
        "name": "empty_intersection_ref_and_complete",
        "message": (
            "Do you have a reference assembly that is also complete-genome "
            "level for Candida albicans?"
        ),
        "entity": "assembly",
        "operation": None,
        "must_filter": [
            {"field": "taxonomicLevelSpecies", "value": "Candida albicans"},
            {"field": "level", "value": "Complete Genome"},
            {"field": "isRef", "value": "Yes"},
        ],
    },
    {
        "name": "reference_only_for_species",
        "message": "Show me the reference assemblies for Plasmodium vivax.",
        "entity": "assembly",
        "operation": None,
        "must_filter": [
            {"field": "taxonomicLevelSpecies", "value": "Plasmodium vivax"},
            {"field": "isRef", "value": "Yes"},
        ],
    },
    {
        # organism entity: "what organisms" is a per-taxon query, not assemblies.
        "name": "list_organisms_clade_anopheles",
        "message": "What organisms do you have for Anopheles?",
        "entity": "organism",
        "operation": None,
        "must_filter": [{"field": "taxonomicLevelGenus", "value": "Anopheles"}],
    },
    {
        # organism count — the headline "28" number is a count over the organism
        # entity, not the assembly entity.
        "name": "count_organisms_clade_anopheles",
        "message": "How many organisms do you have for Anopheles?",
        "entity": "organism",
        "operation": "count",
        "must_filter": [{"field": "taxonomicLevelGenus", "value": "Anopheles"}],
    },
    {
        # broad "what's here" (UC3): summarize a large clade with a facet over the
        # organism entity rather than enumerating. The facet rank (phylum/class/…)
        # is the model's choice, so assert only the kingdom filter + facets op.
        "name": "facets_organisms_broad_fungi",
        "message": "What fungi do you have?",
        "entity": "organism",
        "operation": "facets",
        "must_filter": [{"field": "taxonomicLevelKingdom", "value": "Fungi"}],
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
                        entity=c.get("entity"),
                        operation=c["operation"],
                        must_filter=c.get("must_filter", []),
                        must_facet=c.get("must_facet", []),
                        must_contain=c.get("must_contain", []),
                    )
                ],
            )
        )
    dataset = Dataset(cases=cases)
    task = make_assistant_turn_task(deps, entry)
    return dataset, task, QueryCatalogShape.__name__
