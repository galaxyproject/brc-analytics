"""Tests for the structured_channel eval metric evaluators.

Offline: builds synthetic TurnTrace outputs and checks the metric math. No
live model calls -- the make_structured_channel_task loop itself is exercised
by the app-level tests against a FunctionModel."""

from typing import Any

from pydantic_evals.evaluators import EvaluatorContext

from evals.datasets.structured_channel import (
    CaptureOnChange,
    ExtractSuccessRate,
    FinalSchemaContains,
    IsCompleteEquals,
    NoLeak,
    ReplySuccessRate,
    SchemaFieldEmpty,
)
from evals.tasks import StructuredChannelOutput, TurnTrace, _has_leak_marker


def _ctx(output: Any) -> EvaluatorContext:
    return EvaluatorContext(
        name="case",
        inputs=None,
        output=output,
        expected_output=None,
        metadata={},
        duration=0.0,
        _span_tree=None,
        attributes={},
        metrics={},
    )


def _turn(
    *,
    expected_change=False,
    reply_produced=True,
    extract_produced=True,
    state_nonempty=False,
    leaked=False,
) -> TurnTrace:
    return TurnTrace(
        index=0,
        expected_change=expected_change,
        reply_produced=reply_produced,
        extract_produced=extract_produced,
        state_nonempty=state_nonempty,
        leaked=leaked,
    )


def _out(turns, final_schema=None, is_complete=False) -> StructuredChannelOutput:
    return StructuredChannelOutput(
        turns=turns,
        final_schema=final_schema or {},
        is_complete=is_complete,
        replies=[],
    )


# ---------- ReplySuccessRate ----------


def test_reply_success_all_produced():
    turns = [_turn(reply_produced=True), _turn(reply_produced=True)]
    assert ReplySuccessRate().evaluate(_ctx(_out(turns))) == 1.0


def test_reply_success_penalizes_a_failure():
    turns = [_turn(reply_produced=True), _turn(reply_produced=False)]
    assert ReplySuccessRate().evaluate(_ctx(_out(turns))) == 0.5


# ---------- ExtractSuccessRate ----------


def test_extract_success_over_replied_turns():
    turns = [
        _turn(reply_produced=True, extract_produced=True),
        _turn(reply_produced=True, extract_produced=False),
        _turn(reply_produced=False, extract_produced=False),  # excluded (no reply)
    ]
    assert ExtractSuccessRate().evaluate(_ctx(_out(turns))) == 0.5


# ---------- CaptureOnChange ----------


def test_capture_on_change_over_extracted_change_turns():
    turns = [
        _turn(expected_change=True, extract_produced=True, state_nonempty=True),
        _turn(expected_change=True, extract_produced=True, state_nonempty=False),
        _turn(expected_change=False, extract_produced=True),  # excluded
    ]
    assert CaptureOnChange().evaluate(_ctx(_out(turns))) == 0.5


def test_capture_on_change_excludes_failed_extractions():
    turns = [_turn(expected_change=True, extract_produced=False)]
    assert CaptureOnChange().evaluate(_ctx(_out(turns))) == 1.0


def test_capture_on_change_no_change_expected_is_one():
    turns = [_turn(expected_change=False, extract_produced=True)]
    assert CaptureOnChange().evaluate(_ctx(_out(turns))) == 1.0


# ---------- _has_leak_marker ----------


def test_leak_marker_ignores_prose():
    # The bare English word must NOT count as a leak on the prose reply.
    assert _has_leak_marker("Here are a few suggestions for you.") is False
    assert _has_leak_marker("I'll update the schema shortly.") is False


def test_leak_marker_flags_real_trailers():
    assert _has_leak_marker('Done.\nSUGGESTIONS: ["a", "b"]') is True
    assert _has_leak_marker('SCHEMA_UPDATE: {"organism": "yeast"}') is True
    assert _has_leak_marker("suggestions:[1]") is True
    # Markdown-bolded trailers count too.
    assert _has_leak_marker('**SCHEMA_UPDATE:** {"organism": "yeast"}') is True
    assert _has_leak_marker('**SUGGESTIONS**: ["a"]') is True


def test_leak_marker_flags_next_line_trailers():
    # The JSON opener on the NEXT line is still a trailer -- the production parser
    # skips the newline, so the leak detector must catch it too (Copilot).
    assert _has_leak_marker('Done.\nSUGGESTIONS:\n["a", "b"]') is True
    assert _has_leak_marker('Recorded.\nSCHEMA_UPDATE:\n{"organism": "yeast"}') is True


def test_leak_marker_ignores_prose_then_unrelated_bracket():
    # "suggestions:" then a newline then prose (a bracket only later) is NOT a
    # trailer -- the opener must immediately follow the whitespace, so widening
    # to \s* must not false-positive on ordinary prose.
    assert (
        _has_leak_marker("A few suggestions:\nfirst do X, then see [1] for refs.")
        is False
    )


# ---------- NoLeak ----------


def test_no_leak_perfect():
    turns = [_turn(leaked=False), _turn(leaked=False)]
    assert NoLeak().evaluate(_ctx(_out(turns))) == 1.0


def test_no_leak_penalizes_a_leak():
    turns = [_turn(leaked=False), _turn(leaked=True)]
    assert NoLeak().evaluate(_ctx(_out(turns))) == 0.5


# ---------- FinalSchemaContains ----------


def test_final_schema_contains_partial():
    schema = {
        "organism": {"value": "Saccharomyces cerevisiae", "status": "filled"},
        "analysis_type": {"value": "Variant Calling", "status": "filled"},
    }
    ev = FinalSchemaContains(
        expected={"organism": "Saccharomyces", "analysis_type": "Transcriptomics"}
    )
    assert ev.evaluate(_ctx(_out([], final_schema=schema))) == 0.5


def test_final_schema_contains_empty_expected_is_one():
    assert FinalSchemaContains().evaluate(_ctx(_out([]))) == 1.0


# ---------- SchemaFieldEmpty ----------


def test_schema_field_empty_all_cleared():
    schema = {"organism": {"status": "empty"}, "assembly": {}}
    ev = SchemaFieldEmpty(fields=("organism", "assembly"))
    assert ev.evaluate(_ctx(_out([], final_schema=schema))) == 1.0


def test_schema_field_empty_penalizes_a_filled_field():
    schema = {
        "organism": {"value": "yeast", "status": "filled"},
        "assembly": {"status": "empty"},
    }
    ev = SchemaFieldEmpty(fields=("organism", "assembly"))
    assert ev.evaluate(_ctx(_out([], final_schema=schema))) == 0.5


# ---------- IsCompleteEquals ----------


def test_is_complete_equals_matches():
    assert IsCompleteEquals(expected=False).evaluate(_ctx(_out([]))) == 1.0
    assert (
        IsCompleteEquals(expected=True).evaluate(_ctx(_out([], is_complete=True)))
        == 1.0
    )


def test_is_complete_equals_mismatch():
    assert (
        IsCompleteEquals(expected=True).evaluate(_ctx(_out([], is_complete=False)))
        == 0.0
    )
