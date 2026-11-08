"""Deterministic evaluators for the brc-analytics evals harness.

Each evaluator returns 1.0 (pass) or 0.0 (fail), or a fractional score for
partial matches. Custom evaluators may pull expected values from either their
own constructor args or `ctx.metadata` -- whichever is set on the case.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
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


# ---------- Numbers in a reply trace to the context the model was given ----------

# Models group thousands however they like -- "17,629", "17 629" (thin or
# no-break space), "17629". Matching the literal string scored a correct
# answer as a miss, so both sides are normalised to bare digits first. The
# number has to be a well-formed grouping -- one to three leading digits that
# don't follow a letter, then groups of exactly three -- so "1, 2", "in 2019
# 754 runs" and "SRR123 456" never fuse into one number.
_GROUPED = re.compile(r"(?<![\w.])\d{1,3}(?:[,\u00a0\u202f\u2009 ]\d{3})+(?!\d)")
_SEP = re.compile(r"[,\u00a0\u202f\u2009 ]")


def _ungroup(text: str) -> str:
    return _GROUPED.sub(lambda m: _SEP.sub("", m.group(0)), text)


def normalize_numbers(text: str) -> str:
    """Drop thousands separators and lower-case, for substring matching."""
    return _ungroup(text).lower()


# Spans whose digits are identifiers, not quantities. Removed before numbers
# are pulled out of either side.
_URL = re.compile(r"https?://\S+|/[\w./-]*\?\S*")
# 16 hex characters with at least one letter: a 16-digit decimal is a number.
_JOB_ID = re.compile(r"\b(?=[0-9]*[a-f])[0-9a-f]{16}\b")
# A line-leading list marker ("1.", "2)", "**3.**") or a table's leading rank
# cell ("| 2 |"), not a quantity.
_ORDINAL = re.compile(
    r"(?m)^\s*(?:[-*]\s*)?\**\d{1,3}[.)]\**(?=\s)|^\s*\|\s*\d{1,3}\s*(?=\|)"
)
# An ISO date, with any of the hyphens models write (U+2010-2013, U+2212).
# Read as numbers, a page of release dates puts every integer from 1 to 31
# into the context, and an invented "3 runs" traces to a day of the month.
_DATE = re.compile(r"\b\d{4}[-\u2010-\u2013\u2212]\d{2}[-\u2010-\u2013\u2212]\d{2}\b")
# An rRNA name written with a space ("18 S"); "18S" is already a mixed token.
_RRNA = re.compile(r"(?<![\w.])\d+\s?S\b")
# "17.6k", "1.1M", "2 million": abbreviations a model uses for a large count.
_ABBREV = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)\s?(k|K|M|thousand|million)(?![\w])")
_ABBREV_SCALE = {"k": 1e3, "K": 1e3, "thousand": 1e3, "M": 1e6, "million": 1e6}
# Quantities written with a unit or an exponent ("999GB", "30x", "999ms",
# "1e6"). Read before identifiers are stripped, which would otherwise take
# them for one.
_UNIT = re.compile(
    r"(?<![\w.])(\d+(?:\.\d+)?)\s?"
    r"(?:[KMGT]i?B|kB|[kKMG]bp?|bp|[MG]bases|x|X"
    # No bare "s": "the 1990s" is a decade, not 1990 seconds.
    r"|[mµun]s|secs?|seconds?|mins?|minutes?|h|hrs?|hours?|days?)(?![\w])"
)
# Past this a float overflows (or underflows to 0); no count is that size.
_MAX_EXPONENT = 300
# A full stop after the exponent ends the sentence; a digit after one doesn't.
_SCI = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)[eE]([+-]?\d+)(?!\w|\.\d)")
# A token mixing letters and digits: SRR123, PRJEB2136, GCF_000002765.6, 3D7.
_MIXED_TOKEN = re.compile(r"\b(?=[\w.]*[A-Za-z])(?=[\w.]*\d)[\w.]*\w")
_NUMBER = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)(\s*(?:%|percent\b))?")


@dataclass(frozen=True)
class _Num:
    value: float
    decimals: int
    percent: bool
    text: str


def _strip_identifiers(text: str) -> str:
    text = _URL.sub(" ", text)
    text = _DATE.sub(" ", text)
    text = _JOB_ID.sub(" ", text)
    text = _RRNA.sub(" ", text)
    text = _ORDINAL.sub(" ", text)
    return text


def extract_numbers(text: str) -> list[_Num]:
    """Every quantity in `text`: plain numbers, percentages, and k/M counts.

    Digits inside identifiers (accessions, job ids, URLs) and list ordinals
    are not quantities and are skipped.
    """
    text = _strip_identifiers(_ungroup(text or ""))
    out: list[_Num] = []

    def _abbrev(m: re.Match) -> str:
        value = float(m.group(1)) * _ABBREV_SCALE[m.group(2)]
        out.append(_Num(value=value, decimals=0, percent=False, text=m.group(0)))
        return " "

    def _sci(m: re.Match) -> str:
        # Length first: int() refuses a digit string past 4,300 characters.
        if len(m.group(2)) <= 5 and abs(int(m.group(2))) <= _MAX_EXPONENT:
            exact = Decimal(f"{m.group(1)}e{m.group(2)}")
            # 1e-1 is 0.1, one decimal place; 2.5e3 is 2500, none.
            decimals = max(0, -exact.as_tuple().exponent)
            out.append(
                _Num(
                    value=float(exact),
                    decimals=decimals,
                    percent=False,
                    text=m.group(0),
                )
            )
        return " "

    def _unit(m: re.Match) -> str:
        raw = m.group(1)
        decimals = len(raw.split(".")[1]) if "." in raw else 0
        out.append(
            _Num(value=float(raw), decimals=decimals, percent=False, text=m.group(0))
        )
        return " "

    text = _ABBREV.sub(_abbrev, text)
    text = _SCI.sub(_sci, text)
    text = _UNIT.sub(_unit, text)
    text = _MIXED_TOKEN.sub(" ", text)
    for m in _NUMBER.finditer(text):
        raw = m.group(1)
        decimals = len(raw.split(".")[1]) if "." in raw else 0
        out.append(
            _Num(
                value=float(raw),
                decimals=decimals,
                percent=bool(m.group(2)),
                text=m.group(0).strip(),
            )
        )
    return out


def _round_half_up(value: float, decimals: int) -> float:
    """Round as people do (12.5 -> 13), not as round() does (12.5 -> 12)."""
    quantum = Decimal(1).scaleb(-decimals)
    return float(Decimal(repr(value)).quantize(quantum, rounding=ROUND_HALF_UP))


def _sig_round(value: float, digits: int) -> float:
    if value == 0 or digits <= 0:
        return value
    exponent = Decimal(repr(value)).adjusted()
    return _round_half_up(value, digits - 1 - exponent)


def _significant_digits(n: _Num) -> int:
    """Digits a large count was stated to: 17,600 -> 3, 17,629 -> 5. Only
    whole counts reach here; 17.6k arrives already scaled to 17,600."""
    return len(str(int(n.value)).rstrip("0")) or 1


def _rounds_from(reply: _Num, source: float, source_decimals: int) -> bool:
    """A decimal restated, or rounded to fewer places (0.97 for 0.972)."""
    if abs(reply.value - source) < 1e-9:
        return True
    return (
        reply.decimals < source_decimals
        and abs(_round_half_up(source, reply.decimals) - reply.value) < 1e-9
    )


def _count_rounds_from(reply: _Num, source: float) -> bool:
    """A large count stated to at least two of its leading digits: 17.6k or
    17,600 for 17,629, never "20,000". The reply's own trailing zeros don't
    say how many digits it kept, so 10,000 for 10,212 is 10,212 to two."""
    if source < 1000 or reply.value < 100:
        return False
    width = len(str(int(source)))
    return any(
        _sig_round(source, digits) == reply.value
        for digits in range(max(2, _significant_digits(reply)), width)
    )


def number_traces(reply: _Num, context: list[_Num]) -> bool:
    """One reply quantity against the context's: the rules NumbersTraceToContext
    applies, exposed so they can be tested one at a time.

    - A percentage traces to a context percentage, or its complement, within
      0.1 and no further. Rounding to fewer places is deliberately not
      allowed: "97%" for 97.2% stays untraced, as would "12%" for 12.49%.
    - A bare integer is a count. It traces only to an integer count, exactly
      or as a large count stated to its leading digits; letting it round from a
      decimal or a share would pass "3 runs" against a score of 2.7.
    - A decimal stated without a sign traces to a percentage within 0.1, or to
      a decimal it restates or rounds (0.97 for a score of 0.972).
    """
    for c in context:
        if reply.percent:
            if c.percent and any(
                abs(reply.value - source) <= 0.1 + 1e-9
                for source in (c.value, 100.0 - c.value)
            ):
                return True
        elif reply.decimals == 0:
            if c.percent or c.decimals:
                continue
            if abs(reply.value - c.value) < 1e-9 or _count_rounds_from(reply, c.value):
                return True
        elif c.percent:
            if abs(reply.value - c.value) <= 0.1 + 1e-9:
                return True
        elif _rounds_from(reply, c.value, c.decimals):
            return True
    return False


@dataclass
class NumbersTraceToContext(Evaluator):
    """Fraction of the reply's numbers that trace to the model's context.

    A number traces when it appears in the context (after separator
    normalisation) or is a permitted restatement of one: a percentage within
    0.1 of a context percentage or its complement (100 - x) -- strictly, so
    "97%" for 97.2% does not trace -- a decimal rounded to fewer places, a
    large count to at least two leading digits. A bare
    integer only ever traces to a count (see number_traces). Digits in
    accessions, job ids, URLs and list ordinals are ignored. A reply with no
    numbers scores 1.0.

    The output must expose `reply_field` and `context_field` (by default
    `reply` and `context`); a missing context scores 0.0, since nothing can
    trace to it.
    """

    reply_field: str = "reply"
    context_field: str = "context"

    def evaluate(self, ctx: EvaluatorContext) -> float:
        reply = _coerce_str(_get_field(ctx.output, self.reply_field))
        context = _get_field(ctx.output, self.context_field)
        numbers = extract_numbers(reply)
        if not numbers:
            return 1.0
        if not context:
            return 0.0
        pool = extract_numbers(_coerce_str(context))
        traced = sum(1 for n in numbers if number_traces(n, pool))
        return traced / len(numbers)


def untraced_numbers(reply: str, context: str) -> list[str]:
    """The reply's numbers that do not trace -- for reports and debugging."""
    pool = extract_numbers(context)
    return [n.text for n in extract_numbers(reply) if not number_traces(n, pool)]
