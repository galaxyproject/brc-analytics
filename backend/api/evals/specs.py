"""Registered DatasetSpec build functions.

Each entry: name -> callable(deps, entry, judge_model, only)
                 -> (Dataset, task, primary_score).
"""

from __future__ import annotations

from typing import Callable

from evals.datasets import (
    assistant_multiturn,
    search_interpretation,
    tool_selection,
    workflow_recommendation,
)

SPECS: dict[str, Callable] = {
    "search_interpretation": search_interpretation.build,
    "tool_selection": tool_selection.build,
    "workflow_recommendation": workflow_recommendation.build,
    "assistant_multiturn": assistant_multiturn.build,
}
