"""Deterministic evaluators for the brc-analytics evals harness.

Each evaluator returns 1.0 (pass) or 0.0 (fail), or a fractional score for
partial matches. Custom evaluators may pull expected values from either their
own constructor args or `ctx.metadata` -- whichever is set on the case.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from pydantic_evals.evaluators import Evaluator, EvaluatorContext


def _coerce_str(v: Any) -> str:
    return "" if v is None else str(v)


def _get_field(out: Any, name: str) -> Any:
    """Look up a field on either a dict-like or attribute-bearing output."""
    if isinstance(out, dict):
        return out.get(name)
    return getattr(out, name, None)


@dataclass
class FieldEquals(Evaluator):
    """Check a single field on a dict-like or pydantic output equals expected."""

    field: str = ""
    expected: Any | None = None

    def evaluate(self, ctx: EvaluatorContext) -> float:
        actual = _get_field(ctx.output, self.field)
        expected = self.expected
        if expected is None:
            expected = (ctx.metadata or {}).get(f"expected_{self.field}")
        if expected is None:
            return 0.0
        return (
            1.0 if _coerce_str(actual).lower() == _coerce_str(expected).lower() else 0.0
        )


@dataclass
class MustMention(Evaluator):
    """Check that a free-text output mentions all listed keywords (case-insensitive).

    Returns the fraction of keywords found (1.0 = all, 0.0 = none).
    """

    keywords: list[str] = field(default_factory=list)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        keywords = self.keywords or (ctx.metadata or {}).get("expected_keywords", [])
        if not keywords:
            return 0.0
        text = _coerce_str(ctx.output).lower()
        hits = sum(1 for kw in keywords if kw.lower() in text)
        return hits / len(keywords)


@dataclass
class LowConfidence(Evaluator):
    """1.0 if the output's `confidence` field is at or below `threshold`.

    Useful for gibberish / off-topic cases where the *correct* behavior is
    for the model to flag the query as low-confidence rather than confabulate.
    """

    threshold: float = 0.3

    def evaluate(self, ctx: EvaluatorContext) -> float:
        conf = _get_field(ctx.output, "confidence")
        if conf is None:
            return 0.0
        try:
            return 1.0 if float(conf) <= self.threshold else 0.0
        except (TypeError, ValueError):
            return 0.0


@dataclass
class ToolCallMatch(Evaluator):
    """Check the agent invoked a specific tool, optionally with substring args.

    Expects ctx.output to expose `.tool_calls`: list[tuple[str, dict]] where the
    first element is the tool name and the second the call args.
    """

    tool: str = ""
    arg_substrings: dict[str, str] = field(default_factory=dict)

    def evaluate(self, ctx: EvaluatorContext) -> float:
        out = ctx.output
        if not hasattr(out, "tool_calls"):
            return 0.0
        meta = ctx.metadata or {}
        target_tool = self.tool or meta.get("expected_tool", "")
        target_args = self.arg_substrings or meta.get("expected_args", {})
        if not target_tool:
            return 0.0
        for tool_name, args in out.tool_calls:
            if tool_name != target_tool:
                continue
            ok = True
            for k, needle in target_args.items():
                hay = _coerce_str(args.get(k)).lower()
                if str(needle).lower() not in hay:
                    ok = False
                    break
            if ok:
                return 1.0
        return 0.0
