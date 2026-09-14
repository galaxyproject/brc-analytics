"""Evals for a session opened from a Logan search.

grounding: does the reply describe the cohort with the cohort's numbers and
repeat its caveats, rather than inventing shares from the top hits?
multiturn: does "set up X on the top N runs" reach a handoff carrying N
real accessions in data_source.detail?
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext, LLMJudge

from evals.datasets.assistant_multiturn import FinalSchemaContains, IsCompleteEquals
from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_logan_conversation_task

_FIXTURE = Path(__file__).parent / "fixtures" / "logan_eukaryote.json"


def _snapshot() -> dict:
    return json.loads(_FIXTURE.read_text())


# Models group thousands however they like -- "17,629", "17 629" (thin or
# no-break space), "17629". Matching the literal string scored a correct
# answer as a miss, so both sides are normalised to bare digits first.
_DIGIT_SEP = re.compile(r"(?<=\d)[,\u00a0\u202f\u2009 ](?=\d)")


def _normalize_numbers(text: str) -> str:
    return _DIGIT_SEP.sub("", text).lower()


@dataclass
class _ReplyMustMention(Evaluator):
    keywords: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = _normalize_numbers(getattr(ctx.output, "reply", "") or "")
        if not self.keywords:
            return 0.0
        hits = sum(1 for k in self.keywords if _normalize_numbers(k) in text)
        return hits / len(self.keywords)


@dataclass
class _ReplyMustNotMention(Evaluator):
    """A share the top hits would suggest but the cohort refutes."""

    forbidden: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        text = _normalize_numbers(getattr(ctx.output, "reply", "") or "")
        return (
            0.0 if any(_normalize_numbers(f) in text for f in self.forbidden) else 1.0
        )


@dataclass
class _DataSourceAccessions(Evaluator):
    """data_source.detail carries exactly N accessions from the snapshot."""

    expected_n: int = 5

    def evaluate(self, ctx: EvaluatorContext) -> float:
        schema = ctx.output.final_schema or {}
        detail = (schema.get("data_source") or {}).get("detail")
        if not detail:
            return 0.0
        try:
            payload = json.loads(detail)
        except Exception:
            return 0.0
        accs = payload.get("accessions") or []
        top = [h["accession"] for h in _snapshot()["top_hits"][: self.expected_n]]
        return 1.0 if accs == top else 0.0


_GROUNDING_RUBRIC = (
    "The assistant was handed a Logan search cohort: 17,629 matched runs, "
    "191 organisms, Plasmodium falciparum 82.1%, 97.2% paired-end, 98.9% "
    "Illumina, 84.7% WGS, country not recorded for 80.8%. Score 1 if every "
    "number in the reply traces to that context, the reply does not derive "
    "any share from the 25 listed hits, and -- when geography comes up -- it "
    "states that country is unrecorded for most runs. Rounding (82% for "
    "82.1%), a different thousands separator, and stating the complement of "
    "a given share (19% recorded for 80.8% not recorded) all still trace to "
    "the context and score 1. Score 0 if it states a number the context "
    "cannot produce, treats the 25 hits as representative, or claims a "
    "distribution the context does not contain."
)

_GROUNDING_CASES = [
    {
        "name": "what_is_this_cohort",
        "turns": ["What is this cohort?"],
        "reply_keywords": ["17,629", "Plasmodium falciparum", "82"],
    },
    {
        "name": "where_is_the_data_from",
        "turns": ["Where is this data from geographically?"],
        "reply_keywords": ["not recorded", "Malawi"],
        "forbidden": ["100%", "all of the runs are from"],
    },
    {
        "name": "platform_planning",
        "turns": ["What sequencing platform and layout should I plan for?"],
        "reply_keywords": ["Illumina", "paired"],
    },
]

_MULTITURN_CASES = [
    {
        "name": "variant_calling_on_top_5",
        # The tracker needs a workflow before it can hand off, so the script
        # picks one -- haploid paired-end, which is what this cohort is.
        "turns": [
            "Use the reference assembly.",
            "Variant calling.",
            "Use the paired end variant calling in haploid system workflow.",
            "Use the top 5 runs as my data.",
        ],
        # No data_source needle: the extractor paraphrases that field freely
        # ("ENA/SRA accessions" for "the top 5 runs"), so its wording proves
        # nothing. _DataSourceAccessions checks what actually matters -- the
        # run ids the stepper receives.
        "expected_schema": {
            "organism": "Plasmodium falciparum",
            "analysis_type": "Variant",
            "workflow": "haploid",
        },
        "expected_complete": True,
        "expected_n": 5,
    },
]


def build_grounding(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _GROUNDING_CASES:
        if only and c["name"] not in only:
            continue
        evaluators: list[Evaluator] = [
            LLMJudge(rubric=_GROUNDING_RUBRIC, model=judge_model, include_input=True),
            _ReplyMustMention(keywords=c["reply_keywords"]),
        ]
        if c.get("forbidden"):
            evaluators.append(_ReplyMustNotMention(forbidden=c["forbidden"]))
        cases.append(
            Case(
                name=c["name"],
                inputs={"snapshot": _snapshot(), "turns": c["turns"]},
                metadata=c,
                evaluators=evaluators,
            )
        )
    return Dataset(cases=cases), make_logan_conversation_task(deps, entry), "LLMJudge"


def build_multiturn(
    deps: EvalDeps, entry: ModelEntry, judge_model: Model, only: list[str] | None = None
) -> tuple[Dataset, Callable, str]:
    cases = []
    for c in _MULTITURN_CASES:
        if only and c["name"] not in only:
            continue
        cases.append(
            Case(
                name=c["name"],
                inputs={"snapshot": _snapshot(), "turns": c["turns"]},
                metadata=c,
                evaluators=[
                    FinalSchemaContains(expected=c["expected_schema"]),
                    IsCompleteEquals(expected=c["expected_complete"]),
                    _DataSourceAccessions(expected_n=c["expected_n"]),
                ],
            )
        )
    return (
        Dataset(cases=cases),
        make_logan_conversation_task(deps, entry),
        _DataSourceAccessions.__name__,
    )
