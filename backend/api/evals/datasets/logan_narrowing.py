"""Chat-side narrowing of a Logan search: tool or pre-reply extractor?

Same ten cases for both mechanisms; the server's LOGAN_NARROWING_MODE picks
which one runs (`tool`: the model calls query_logan_hits; `extract`: a
tool-less pre-reply pass emits the query and the server injects the result).
Each case is scored on:

- LoganQueryShape -- the last query the last turn emitted (the last
  query_logan_hits call, or the extractor's query) has exactly the expected
  filters: the right fields, ops and values, nothing missing and nothing
  extra. Equivalent spellings agree: eq x == in [x], and on the integer
  fields gt 2019 == gte 2020.
- _ReplyHasCount -- the final reply states the ground-truth count, computed
  here with plain SQL over the fixture parquet (never through the engine
  under test), and states no other run total;
- NumbersTraceToContext -- nothing else in the reply is invented;
- _SelectionHas (extract only) -- what the session kept as its selection,
  exactly.

Latency is not a score: it is in every turn's trace (--dump-dir), and the
write-up reads it from there.

Every case runs over F1, whose export is kept whole, so the ground truth is
the job's real count and agrees with the cohort numbers in the same prompt
(`build` refuses a trimmed fixture).
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

import duckdb
from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from evals.evaluators import (
    NumbersTraceToContext,
    extract_numbers,
    normalize_numbers,
)
from evals.logan_fixture import load_fixture
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_logan_conversation_task

FIXTURE = "logan_pfal_18s"
TOOL_NAME = "query_logan_hits"

# logan_hit fields holding whole numbers, where gt n and gte n+1 say the same.
_INTEGER_FIELDS = {"release_year", "mbases"}


def canonical_filters(filters: Any) -> Optional[frozenset]:
    """A filter list as a set of (field, op, value) that ignores spelling:
    eq x is in [x], and on an integer field gt n is gte n+1 (lt n, lte n-1).
    None when the list isn't a list of filter objects at all."""
    if not isinstance(filters, list):
        return None
    out = set()
    for f in filters:
        if not isinstance(f, dict):
            return None
        name, op, value = f.get("field"), str(f.get("op", "")).lower(), f.get("value")
        if op in ("eq", "in"):
            values = value if isinstance(value, list) else [value]
            out.add((name, "in", frozenset(str(v) for v in values)))
        elif op in ("gt", "gte", "lt", "lte"):
            try:
                number = float(value)
            except (TypeError, ValueError):
                return None
            if name in _INTEGER_FIELDS and number.is_integer():
                if op == "gt":
                    op, number = "gte", number + 1
                elif op == "lt":
                    op, number = "lte", number - 1
            out.add((name, op, number))
        else:
            out.add((name, op, json.dumps(value, sort_keys=True, default=str)))
    return frozenset(out)


def last_effective_query(output: Any) -> Optional[dict]:
    """The query that answered the last turn: its last query_logan_hits call,
    or else the extractor's query when it asked or selected."""
    turns = getattr(output, "turns", None) or []
    if not turns:
        return None
    last = turns[-1]
    calls = [args for name, args in (last.tool_calls or []) if name == TOOL_NAME]
    if calls:
        args = calls[-1]
        # pydantic-ai flattens a single-model parameter into the tool's own
        # schema, but a model may still nest it under the parameter's name.
        return args.get("query") if isinstance(args.get("query"), dict) else args
    narrowing = getattr(last, "narrowing", None) or {}
    if narrowing.get("intent") in ("ask", "select") and narrowing.get("query"):
        return narrowing["query"]
    return None


@dataclass
class LoganQueryShape(Evaluator):
    """1.0 if the last effective query has exactly the expected filters."""

    expect: list[dict] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        query = last_effective_query(ctx.output)
        if query is None:
            return 0.0
        got = canonical_filters(query.get("filters") or [])
        return 1.0 if got is not None and got == canonical_filters(self.expect) else 0.0


# A run total as people write one: "181 runs", "181 matching runs", "runs: 181".
_RUN_WORD = r"(?:runs?|matches|matching runs|results|samples|accessions)"
# Up to three words between the number and the noun ("181 WGS runs", "5
# Plasmodium vivax runs"); "181 of the 231", "7,744 out of 17,629" and "181
# are WGS" are claims of their first number.
_TOTAL_CLAIM = re.compile(
    rf"(?<![\w.%])(\d+)\s+(?:[A-Za-z][\w.-]*\s+){{0,3}}?{_RUN_WORD}\b"
    rf"|\b{_RUN_WORD}\s*(?:matched|matching|found|total)?\s*[:=]\s*(\d+)(?![\w.%])"
    r"|(?<![\w.%])(\d+)\s+(?:out\s+)?of\s+(?:the\s+|these\s+|those\s+)?\d+"
    r"|(?<![\w.%])(\d+)\s+(?:are|were|is|match|matched)\b"
)
_ZERO_CLAIM = re.compile(
    rf"\b(?:no|zero|none of the)\s+(?:\w+\s+){{0,3}}?{_RUN_WORD}\b"
    rf"|\bno\s+(?:\w+\s+){{0,3}}?(?:match|matches)\b"
)


def run_total_claims(reply: str) -> list[int]:
    """Every run total the reply states, in order."""
    text = normalize_numbers(reply or "").replace("*", "").replace("_", " ")
    claims = []
    for m in _TOTAL_CLAIM.finditer(text):
        claims.append(int(next(g for g in m.groups() if g is not None)))
    return claims


def _context_counts(context: str) -> set[int]:
    """Whole numbers the model was handed (cohort counts, tool returns)."""
    return {
        int(n.value)
        for n in extract_numbers(context or "")
        if not n.percent and not n.decimals
    }


@dataclass
class _ReplyHasCount(Evaluator):
    """1.0 if the reply states the expected count as a run total (or, for
    zero, says there are none) and states no other total -- except ones the
    case allows (the selection's own size, the search's total, numbers the
    user said) and whole numbers the model's context holds ("Mozambique has
    460 runs"). The last means a wrong total that happens to equal some count
    in the context passes this check; the shape check still catches the
    query behind it."""

    expected: int = 0
    also_ok: list[int] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        reply = getattr(ctx.output, "reply", "") or ""
        claims = run_total_claims(reply)
        allowed = {
            self.expected,
            *self.also_ok,
            *_context_counts(getattr(ctx.output, "context", "") or ""),
        }
        if any(c not in allowed for c in claims):
            return 0.0
        if self.expected in claims:
            return 1.0
        if self.expected == 0:
            text = normalize_numbers(reply).lower().replace("*", "")
            return 1.0 if _ZERO_CLAIM.search(text) else 0.0
        return 0.0


@dataclass
class _SelectionHas(Evaluator):
    """1.0 if the session's stored selection has exactly the expected filters
    (or, with `cleared`, if there is no selection)."""

    expect: list[dict] = field(default_factory=list)
    cleared: bool = False

    def evaluate(self, ctx: EvaluatorContext) -> float:
        meta = getattr(ctx.output, "session_metadata", None) or {}
        selection = (meta.get("logan") or {}).get("selection")
        if self.cleared:
            return 1.0 if not selection else 0.0
        if not isinstance(selection, dict):
            return 0.0
        got = canonical_filters((selection.get("query") or {}).get("filters"))
        return 1.0 if got is not None and got == canonical_filters(self.expect) else 0.0


def _f(field_name: str, op: str, value: Any) -> dict:
    return {"field": field_name, "op": op, "value": value}


SELECT_THAILAND = "Select only the runs from Thailand."
THAILAND = _f("country", "eq", "Thailand")

# `expect` is the exact filter set the answering query must have; `truth` is
# the same subset as a WHERE clause over the export, run with plain DuckDB
# below for the reply's count. `selection` (extract mode) is what the session
# must hold afterwards; `selection_truth` names a subset whose size the reply
# may also quote.
_CASES = [
    {
        "name": "count_country_instrument",
        "turns": [
            "How many runs from Senegal were sequenced on an Illumina NovaSeq 6000?"
        ],
        "expect": [
            _f("country", "eq", "Senegal"),
            _f("instrument", "eq", "Illumina NovaSeq 6000"),
        ],
        "truth": "country = 'Senegal' AND instrument = 'Illumina NovaSeq 6000'",
    },
    {
        "name": "count_organism_year",
        "turns": ["How many Plasmodium vivax runs were released after 2019?"],
        "expect": [
            _f("organism", "eq", "Plasmodium vivax"),
            _f("release_year", "gt", 2019),
        ],
        "truth": "organism = 'Plasmodium vivax' AND year(release_date) > 2019",
    },
    {
        "name": "count_score",
        "turns": ["How many runs scored at least 0.9?"],
        "expect": [_f("score", "gte", 0.9)],
        "truth": "score >= 0.9",
    },
    {
        "name": "count_platform_year",
        "turns": ["How many Oxford Nanopore runs were released in 2020 or later?"],
        "expect": [
            _f("platform", "eq", "OXFORD_NANOPORE"),
            _f("release_year", "gte", 2020),
        ],
        "truth": "platform = 'OXFORD_NANOPORE' AND year(release_date) >= 2020",
    },
    {
        "name": "select_country",
        "turns": [SELECT_THAILAND],
        "expect": [THAILAND],
        "truth": "country = 'Thailand'",
        "selection": [THAILAND],
    },
    {
        "name": "follow_up_narrows_selection",
        "turns": [SELECT_THAILAND, "Of those, how many are WGS?"],
        "expect": [THAILAND, _f("assay_type", "eq", "WGS")],
        "truth": "country = 'Thailand' AND assay_type = 'WGS'",
        "selection": [THAILAND],
        "selection_truth": "country = 'Thailand'",
    },
    {
        "name": "explicit_clear",
        "turns": [
            SELECT_THAILAND,
            "Forget that selection and go back to all of the runs. How many "
            "are WGS and were released after 2019?",
        ],
        "expect": [_f("assay_type", "eq", "WGS"), _f("release_year", "gt", 2019)],
        "truth": "assay_type = 'WGS' AND year(release_date) > 2019",
        "selection_cleared": True,
        "selection_truth": "country = 'Thailand'",
    },
    {
        # "Kenia": the cohort's vocabulary has Kenya, which is what to apply.
        "name": "misspelt_value",
        "turns": ["How many runs are from Kenia?"],
        "expect": [_f("country", "eq", "Kenya")],
        "truth": "country = 'Kenya'",
    },
    {
        # Both values exist in the search; together they match nothing. (A
        # value the search doesn't have is reported, not counted.)
        "name": "empty_result",
        "turns": ["How many WGA runs are there from Mozambique?"],
        "expect": [_f("country", "eq", "Mozambique"), _f("assay_type", "eq", "WGA")],
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
        "expect": [
            _f("country", "eq", "Cambodia"),
            _f("library_layout", "eq", "PAIRED"),
        ],
        "truth": "country = 'Cambodia' AND library_layout = 'PAIRED'",
        "selection": [THAILAND],
        "selection_truth": "country = 'Thailand'",
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


def require_whole_export(fixture: str = FIXTURE) -> None:
    """Counts over a trimmed export are a sample's, not the job's."""
    trim = load_fixture(fixture).extras.get("trim") or {}
    if trim.get("rows_kept") != trim.get("rows_total"):
        raise RuntimeError(f"{fixture}'s export is trimmed; counts would be wrong")


def allowed_totals(case: dict, total_matches: int) -> list[int]:
    """Run totals a correct reply may quote besides the answer: the search's
    total, a selection's size, and numbers the user said."""
    ok = [total_matches]
    if case.get("selection_truth"):
        ok.append(ground_truth(case["selection_truth"]))
    for turn in case["turns"]:
        ok += [int(n) for n in re.findall(r"(?<![\w.])\d+(?![\w.])", turn)]
    return ok


def _mode() -> str:
    return (os.environ.get("LOGAN_NARROWING_MODE") or "off").lower()


def build(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    require_whole_export()
    mode = _mode()
    total_matches = load_fixture(FIXTURE).snapshot["total_matches"]
    cases = []
    for c in _CASES:
        if only and c["name"] not in only:
            continue
        expected = ground_truth(c["truth"])
        evaluators: list[Evaluator] = [
            LoganQueryShape(expect=c["expect"]),
            _ReplyHasCount(expected=expected, also_ok=allowed_totals(c, total_matches)),
            NumbersTraceToContext(),
        ]
        if mode == "extract" and c.get("selection"):
            evaluators.append(_SelectionHas(expect=c["selection"]))
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
