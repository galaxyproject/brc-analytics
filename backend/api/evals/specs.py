"""Registered DatasetSpec build functions.

Each entry: name -> callable(deps, entry, judge_model, only)
                 -> (Dataset, task, primary_score).
"""

from __future__ import annotations

from typing import Callable

from evals.datasets import (
    assistant_multiturn,
    catalog_query,
    sra_assistant_multiturn,
    sra_tool_selection,
    tool_selection,
)

SPECS: dict[str, Callable] = {
    "tool_selection": tool_selection.build,
    "catalog_query": catalog_query.build,
    "assistant_multiturn": assistant_multiturn.build,
    "sra_tool_selection": sra_tool_selection.build,
    "sra_assistant_multiturn": sra_assistant_multiturn.build,
}
