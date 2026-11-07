"""Chat-side narrowing of a Logan search: tool or pre-reply extractor?

Same ten cases for both mechanisms; the server's LOGAN_NARROWING_MODE picks
which one runs (`tool`: the model calls query_logan_hits; `extract`: a
tool-less pre-reply pass emits the query and the server injects the result).
Each case is scored on:

- LoganQueryShape -- the query emitted on the case's last turn (a
  query_logan_hits call, or the extractor's query) filters the right fields
  with the right values, and none it shouldn't;
- _ReplyHasCount -- the final reply states the ground-truth count, computed
  here with plain SQL over the fixture parquet (never through the engine
  under test);
- NumbersTraceToContext -- nothing else in the reply is invented;
- _SelectionHas (extract only) -- what the session stored as its selection.

Latency is not a score: it is in every turn's trace (--dump-dir), and the
write-up reads it from there.

Every case runs over F1, whose export is kept whole, so the ground truth is
the job's real count and agrees with the cohort numbers in the same prompt.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Callable

import duckdb
from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from evals.datasets.catalog_query import QueryCatalogShape
from evals.evaluators import NumbersTraceToContext, normalize_numbers
from evals.logan_fixture import load_fixture
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_logan_conversation_task

FIXTURE = "logan_pfal_18s"
TOOL_NAME = "query_logan_hits"


def _last_turn_queries(output) -> list[dict]:
    """Every query the last turn emitted, from either mechanism."""
    turns = getattr(output, "turns", None) or []
    if not turns:
        return []
    last = turns[-1]
    queries = []
    for name, args in getattr(last, "tool_calls", None) or []:
        if name != TOOL_NAME:
            continue
        # pydantic-ai flattens a single-model parameter into the tool's own
        # schema, but a model may still nest it under the parameter's name.
        inner = args.get("query") if isinstance(args.get("query"), dict) else args
        queries.append(inner)
    narrowing = getattr(last, "narrowing", None) or {}
    if narrowing.get("intent") in ("ask", "select") and narrowing.get("query"):
        queries.append(narrowing["query"])
    return queries


@dataclass
class LoganQueryShape(Evaluator):
    """1.0 if some query from the last turn has every `must_filter` predicate
    and no `must_not_filter` one. Predicate specs match as in
    QueryCatalogShape: each given key of {field, op, value} must agree."""

    must_filter: list[dict] = field(default_factory=list)
    must_not_filter: list[dict] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        for q in _last_turn_queries(ctx.output):
            filters = q.get("filters") or []
            if not all(
                any(QueryCatalogShape._filter_matches(p, spec) for p in filters)
                for spec in self.must_filter
            ):
                continue
            if any(
                QueryCatalogShape._filter_matches(p, spec)
                for p in filters
                for spec in self.must_not_filter
            ):
                continue
            return 1.0
        return 0.0


_NUMBER_TOKEN = re.compile(r"(?<![\w.])\d+(?![\w.]*\d)")
_ZERO_WORDS = re.compile(r"\b(no|none|zero|0)\b[^.]{0,40}\b(runs?|matches|results)\b")


@dataclass
class _ReplyHasCount(Evaluator):
    """1.0 if the final reply states the expected count. For zero, a stated
    "0" or "no runs" both count."""

    expected: int = 0

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = normalize_numbers(getattr(ctx.output, "reply", "") or "")
        if self.expected == 0:
            if _ZERO_WORDS.search(text):
                return 1.0
        return 1.0 if str(self.expected) in _NUMBER_TOKEN.findall(text) else 0.0


@dataclass
class _SelectionHas(Evaluator):
    """1.0 if the session's stored selection has every predicate (or, with
    `cleared`, if there is no selection)."""

    must_filter: list[dict] = field(default_factory=list)
    cleared: bool = False

    def evaluate(self, ctx: EvaluatorContext) -> float:
        meta = getattr(ctx.output, "session_metadata", None) or {}
        selection = (meta.get("logan") or {}).get("selection")
        if self.cleared:
            return 1.0 if not selection else 0.0
        filters = ((selection or {}).get("query") or {}).get("filters") or []
        ok = all(
            any(QueryCatalogShape._filter_matches(p, spec) for p in filters)
            for spec in self.must_filter
        )
        return 1.0 if selection and ok else 0.0


SELECT_THAILAND = "Select only the runs from Thailand."

# `truth` is a WHERE clause over the export, run with plain DuckDB below; the
# reply's count is checked against what it returns.
_CASES = [
    {
        "name": "count_country_instrument",
        "turns": [
            "How many runs from Senegal were sequenced on an Illumina NovaSeq 6000?"
        ],
        "must_filter": [
            {"field": "country", "value": "Senegal"},
            {"field": "instrument", "value": "Illumina NovaSeq 6000"},
        ],
        "truth": "country = 'Senegal' AND instrument = 'Illumina NovaSeq 6000'",
    },
    {
        "name": "count_organism_year",
        "turns": ["How many Plasmodium vivax runs were released after 2019?"],
        "must_filter": [
            {"field": "organism", "value": "Plasmodium vivax"},
            {"field": "release_year"},
        ],
        "truth": "organism = 'Plasmodium vivax' AND year(release_date) > 2019",
    },
    {
        "name": "count_score",
        "turns": ["How many runs scored at least 0.9?"],
        "must_filter": [{"field": "score", "op": "gte", "value": 0.9}],
        "truth": "score >= 0.9",
    },
    {
        "name": "count_platform_year",
        "turns": ["How many Oxford Nanopore runs were released in 2020 or later?"],
        "must_filter": [
            {"field": "platform", "value": "OXFORD_NANOPORE"},
            {"field": "release_year"},
        ],
        "truth": "platform = 'OXFORD_NANOPORE' AND year(release_date) >= 2020",
    },
    {
        "name": "select_country",
        "turns": [SELECT_THAILAND],
        "must_filter": [{"field": "country", "value": "Thailand"}],
        "truth": "country = 'Thailand'",
        "selection": [{"field": "country", "value": "Thailand"}],
    },
    {
        "name": "follow_up_narrows_selection",
        "turns": [SELECT_THAILAND, "Of those, how many are WGS?"],
        "must_filter": [
            {"field": "country", "value": "Thailand"},
            {"field": "assay_type", "value": "WGS"},
        ],
        "truth": "country = 'Thailand' AND assay_type = 'WGS'",
    },
    {
        "name": "explicit_clear",
        "turns": [
            SELECT_THAILAND,
            "Forget that selection and go back to all of the runs. How many "
            "are WGS and were released after 2019?",
        ],
        "must_filter": [
            {"field": "assay_type", "value": "WGS"},
            {"field": "release_year"},
        ],
        "must_not_filter": [{"field": "country"}],
        "truth": "assay_type = 'WGS' AND year(release_date) > 2019",
        "selection_cleared": True,
    },
    {
        # "Kenia": the cohort's vocabulary has Kenya, which is what to apply.
        "name": "misspelt_value",
        "turns": ["How many runs are from Kenia?"],
        "must_filter": [{"field": "country", "value": "Kenya"}],
        "truth": "country = 'Kenya'",
    },
    {
        # Both values exist in the search; together they match nothing. (A
        # value the search doesn't have is dropped and reported, not counted.)
        "name": "empty_result",
        "turns": ["How many WGA runs are there from Mozambique?"],
        "must_filter": [
            {"field": "country", "value": "Mozambique"},
            {"field": "assay_type", "value": "WGA"},
        ],
        "truth": "country = 'Mozambique' AND assay_type = 'WGA'",
    },
    {
        # A question about the whole search must not narrow (or replace) the
        # current selection.
        "name": "question_is_not_a_selection",
        "turns": [
            SELECT_THAILAND,
            "Separately, how many runs in the whole search are from Cambodia "
            "and paired-end?",
        ],
        "must_filter": [
            {"field": "country", "value": "Cambodia"},
            {"field": "library_layout", "value": "PAIRED"},
        ],
        "must_not_filter": [{"field": "country", "value": "Thailand"}],
        "truth": "country = 'Cambodia' AND library_layout = 'PAIRED'",
        "selection": [{"field": "country", "value": "Thailand"}],
    },
]


def ground_truth(where: str, fixture: str = FIXTURE) -> int:
    """Count the fixture export's rows matching `where`, in plain DuckDB."""
    parquet = load_fixture(fixture).parquet
    if parquet is None:
        raise RuntimeError(f"fixture {fixture} has no parquet")
    con = duckdb.connect()
    try:
        return con.execute(
            f"SELECT count(*) FROM read_parquet(?) WHERE {where}", [str(parquet)]
        ).fetchone()[0]
    finally:
        con.close()


def _mode() -> str:
    return (os.environ.get("LOGAN_NARROWING_MODE") or "off").lower()


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    mode = _mode()
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        expected = ground_truth(c["truth"])
        evaluators: list[Evaluator] = [
            LoganQueryShape(
                must_filter=c["must_filter"],
                must_not_filter=c.get("must_not_filter", []),
            ),
            _ReplyHasCount(expected=expected),
            NumbersTraceToContext(),
        ]
        if mode == "extract" and c.get("selection"):
            evaluators.append(_SelectionHas(must_filter=c["selection"]))
        if mode == "extract" and c.get("selection_cleared"):
            evaluators.append(_SelectionHas(cleared=True))
        cases.append(
            Case(
                name=c["name"],
                inputs={"fixture": FIXTURE, "turns": c["turns"]},
                metadata={**c, "expected_count": expected, "mode": mode},
                evaluators=evaluators,
            )
        )
    return (
        Dataset(cases=cases),
        make_logan_conversation_task(deps, entry),
        LoganQueryShape.__name__,
    )
