"""LOGAN_NARROWING_MODE=off leaves a Logan session exactly as it was.

The golden file was captured from the agent before narrowing modes existed:
the system prompt, the instructions and the tool definitions the model was
handed on one turn of a session opened from the F1 fixture, with the Logan
tools registered (Galaxy available) and with them absent. The test re-captures
the same turn with the setting off -- and with it unset -- and compares.

To regenerate (only when a change to the prompt or tools is intended, never
to make a narrowing change pass): REGENERATE_LOGAN_OFF_GOLDEN=1 pytest this.
"""

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import asdict
from pathlib import Path

import pytest

from app.core.config import get_settings

GOLDEN = Path(__file__).parent / "data" / "logan_narrowing_off_golden.json"


def _capture(monkeypatch, tmp_path, galaxy_available: bool) -> dict:
    from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart
    from pydantic_ai.models.function import FunctionModel

    from app.services.assistant_agent import AssistantAgent
    from evals.logan_fixture import FixtureGalaxy, load_all_fixtures, load_fixture
    from evals.tasks import _make_cache

    monkeypatch.setenv("CATALOG_PATH", str(tmp_path))
    monkeypatch.setenv("AI_API_KEY", "stub")
    monkeypatch.setenv("ASSISTANT_OUTPUT_MODE", "tool")
    get_settings.cache_clear()

    seen: dict = {}

    def model_fn(messages, info):
        if info.output_tools:  # the tracker extractor
            return ModelResponse(parts=[ToolCallPart(info.output_tools[0].name, {})])
        system = [
            p.content
            for m in messages
            for p in getattr(m, "parts", [])
            if p.part_kind == "system-prompt"
        ]
        seen["system_prompt"] = "\n".join(system)
        seen["instructions"] = getattr(messages[-1], "instructions", None)
        seen["tools"] = sorted(
            (
                json.loads(json.dumps(asdict(t), default=str))
                for t in info.function_tools
            ),
            key=lambda t: t["name"],
        )
        return ModelResponse(parts=[TextPart("ok")])

    monkeypatch.setattr(
        AssistantAgent, "_build_model", lambda self, name: FunctionModel(model_fn)
    )
    galaxy = FixtureGalaxy(load_all_fixtures()) if galaxy_available else None
    agent = AssistantAgent(_make_cache(), galaxy=galaxy)

    async def go():
        from app.models.logan import LoganSnapshot

        snap = LoganSnapshot.model_validate(load_fixture("logan_pfal_18s").snapshot)
        state = await agent.create_logan_session_from_snapshot(snap, None)
        await agent.chat("How many runs are from Malawi?", session_id=state.session_id)

    try:
        asyncio.run(go())
    finally:
        get_settings.cache_clear()
    return seen


def _golden() -> dict:
    return json.loads(GOLDEN.read_text())


@pytest.mark.parametrize("galaxy_available", [True, False])
@pytest.mark.parametrize("mode", [None, "off"])
def test_off_matches_the_pre_narrowing_capture(
    monkeypatch, tmp_path, galaxy_available, mode
):
    if mode is None:
        monkeypatch.delenv("LOGAN_NARROWING_MODE", raising=False)
    else:
        monkeypatch.setenv("LOGAN_NARROWING_MODE", mode)
    key = "galaxy" if galaxy_available else "no_galaxy"
    seen = _capture(monkeypatch, tmp_path, galaxy_available)

    if os.environ.get("REGENERATE_LOGAN_OFF_GOLDEN") and mode is None:
        data = _golden() if GOLDEN.exists() else {}
        data[key] = seen
        GOLDEN.write_text(json.dumps(data, indent=1, sort_keys=True) + "\n")

    golden = _golden()[key]
    assert seen["system_prompt"] == golden["system_prompt"]
    assert seen["instructions"] == golden["instructions"]
    assert seen["tools"] == golden["tools"]
    # Not vacuous: the capture saw the Logan block and a real tool list.
    assert "## Logan search context" in seen["instructions"]
    assert any(t["name"] == "query_catalog" for t in seen["tools"])
    assert any(t["name"] == "logan_cohort" for t in seen["tools"]) is galaxy_available
