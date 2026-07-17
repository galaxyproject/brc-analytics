"""Structured channel eval -- the extraction pass (reply + state extractor).

State is captured by a focused extractor, not the conversational reply, so each
turn is two calls. What varies per model: the conversational reply produces
reliably (plain text, ~always), the extractor produces its snapshot reliably,
capture on state-changing turns, no state leak in the reply, and final-tracker
correctness. Each case is a scripted multi-turn scenario; the evaluators
aggregate the per-turn traces the task collects (see
tasks.make_structured_channel_task).

Metrics (all in [0, 1], higher is better):
  - ReplySuccessRate   -- fraction of turns the conversational call returned a
                          reply (should be ~1.0 -- it's plain text)
  - ExtractSuccessRate -- fraction of turns the extractor produced a snapshot
                          (the make-or-break for capture)
  - CaptureOnChange    -- of turns that should change state, how many the
                          extractor filled (completeness given capture)
  - NoLeak             -- fraction of turns with NO state marker in the visible
                          reply (must be 1.0)
  - FinalSchemaContains -- final tracker fields match expected (correctness)
  - IsCompleteEquals   -- handoff readiness matches expected
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from pydantic_ai.models import Model
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from evals.model_registry import ModelEntry
from evals.tasks import EvalDeps, make_structured_channel_task


@dataclass
class ReplySuccessRate(Evaluator):
    """Fraction of turns the conversational call returned a reply. Plain text,
    so this should be ~1.0 -- a low value means the endpoint itself is flaky."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        turns = ctx.output.turns
        if not turns:
            return 1.0
        return sum(1 for t in turns if t.reply_produced) / len(turns)


@dataclass
class ExtractSuccessRate(Evaluator):
    """Fraction of turns the extractor produced a snapshot (of turns that got a
    reply). The make-or-break for capture -- a stack that 400s on the extractor's
    structured output can't run it."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        turns = [t for t in ctx.output.turns if t.reply_produced]
        if not turns:
            return 1.0
        return sum(1 for t in turns if t.extract_produced) / len(turns)


@dataclass
class CaptureOnChange(Evaluator):
    """Of turns that should change state (and where the extractor ran), how many
    actually changed a tracked field when applied -- completeness given capture
    (fable's check)."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        turns = [
            t for t in ctx.output.turns if t.expected_change and t.extract_produced
        ]
        if not turns:
            return 1.0
        return sum(1 for t in turns if t.state_nonempty) / len(turns)


@dataclass
class NoLeak(Evaluator):
    """Fraction of turns with no SCHEMA_UPDATE/SUGGESTIONS marker in the visible
    reply. This is the acceptance criterion -- it must be 1.0."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        turns = ctx.output.turns
        if not turns:
            return 1.0
        return sum(1 for t in turns if not t.leaked) / len(turns)


@dataclass
class FinalSchemaContains(Evaluator):
    """Fraction of expected schema fields whose value contains the needle."""

    expected: dict[str, str] = field(default_factory=dict)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        expected = self.expected
        if not expected:
            return 1.0
        schema = ctx.output.final_schema or {}
        hits = 0
        for key, needle in expected.items():
            field_obj = schema.get(key) or {}
            actual = (
                field_obj.get("value") if isinstance(field_obj, dict) else ""
            ) or ""
            if str(needle).lower() in str(actual).lower():
                hits += 1
        return hits / len(expected)


@dataclass
class SchemaFieldEmpty(Evaluator):
    """Fraction of the named fields that ended EMPTY -- for scenarios where the
    model should NOT have committed anything (pure exploration, or a field the
    user cleared)."""

    fields: tuple[str, ...] = ()

    def evaluate(self, ctx: EvaluatorContext) -> float:
        if not self.fields:
            return 1.0
        schema = ctx.output.final_schema or {}
        empty = 0
        for name in self.fields:
            field_obj = schema.get(name) or {}
            status = field_obj.get("status") if isinstance(field_obj, dict) else None
            if status in (None, "empty"):
                empty += 1
        return empty / len(self.fields)


@dataclass
class IsCompleteEquals(Evaluator):
    expected: bool = False

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return 1.0 if bool(ctx.output.is_complete) == bool(self.expected) else 0.0


# Each turn: (text, expect_state_change). expect_state_change gates
# CaptureOnChange -- True on turns where a committed decision should show up in
# the extractor's snapshot. The scenarios lean on real catalog organisms so the
# conversational model can resolve assemblies/workflows through its tools.
_CASES = [
    {
        # Build up a couple of decisions.
        "name": "build_decision",
        "turns": [
            ("I want to analyze yeast", True),
            ("Gene expression, specifically", True),
        ],
        "expected_schema": {
            "organism": "Saccharomyces",
            "analysis_type": "Transcriptomics",
        },
        "expected_complete": False,
    },
    {
        # Switch a high-level choice: analysis_type changes, workflow (if any)
        # and derived fields must clear.
        "name": "switch_decision",
        "turns": [
            ("I want to do RNA-seq on yeast", True),
            ("Actually, I want variant calling instead", True),
        ],
        "expected_schema": {
            "organism": "Saccharomyces",
            "analysis_type": "Variant",
        },
        "expected_complete": False,
    },
    {
        # Targeted clear: the user backs out of just the organism but keeps the
        # analysis type -- so the snapshot isn't all-null (which the wipe guard
        # would copy forward). organism clears, analysis_type stays.
        "name": "clear_field",
        "turns": [
            ("Let's work with yeast for gene expression", True),
            ("On second thought, forget the organism -- I'm not sure which yet", True),
        ],
        "expected_schema": {"analysis_type": "Transcriptomics"},
        "clear_fields": ("organism",),
        "expected_complete": False,
    },
    {
        # Full happy path to handoff readiness -- the scenario is designed to
        # reach a complete config, so expected_complete is True. A model that
        # can't drive to completion scores 0 here; that's the measurement.
        "name": "complete_handoff",
        "turns": [
            ("I'd like to find variants in TB clinical isolates", True),
            (
                "Use the reference Mycobacterium tuberculosis H37Rv assembly",
                True,
            ),
            ("Pick a suitable variant calling workflow for me", True),
            ("I'll pull my reads from ENA", True),
        ],
        "expected_schema": {
            "organism": "Mycobacterium tuberculosis",
            "analysis_type": "Variant",
        },
        "expected_complete": True,
    },
    {
        # Pure exploration: nothing is committed, so the schema must stay empty.
        "name": "explore_only",
        "turns": [
            ("What kinds of analyses can I run?", False),
            ("Tell me more about variant calling", False),
        ],
        "clear_fields": ("organism", "analysis_type", "workflow", "assembly"),
        "expected_complete": False,
    },
    {
        # Offered != committed: the assistant lists assemblies but the user
        # doesn't pick one, so the tracker must NOT record an assembly. This is
        # the one regression the extraction pass can introduce (a context-poor
        # extractor promoting an offered option to selected).
        "name": "offered_not_committed",
        "turns": [
            ("What Plasmodium falciparum assemblies do you have?", False),
        ],
        "clear_fields": ("assembly", "organism"),
        "expected_complete": False,
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
        turns = [{"text": t, "expect_state_change": chg} for t, chg in c["turns"]]
        evaluators: list[Evaluator] = [
            ReplySuccessRate(),
            ExtractSuccessRate(),
            CaptureOnChange(),
            NoLeak(),
            IsCompleteEquals(expected=c.get("expected_complete", False)),
        ]
        if c.get("expected_schema"):
            evaluators.append(FinalSchemaContains(expected=c["expected_schema"]))
        if c.get("clear_fields"):
            evaluators.append(SchemaFieldEmpty(fields=tuple(c["clear_fields"])))
        cases.append(
            Case(
                name=c["name"],
                inputs={"turns": turns},
                metadata=c,
                evaluators=evaluators,
            )
        )
    dataset = Dataset(cases=cases)
    task = make_structured_channel_task(deps, entry)
    return dataset, task, ExtractSuccessRate.__name__
