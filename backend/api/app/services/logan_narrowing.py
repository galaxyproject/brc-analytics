"""Narrowing a Logan search from chat (LOGAN_NARROWING_MODE).

"tool" gives the model `query_logan_hits`, offered only in a session opened
from a search, which counts, lists or breaks down any subset of the search's
matched runs over the job's cached export through the logan_hit query engine;
a short note after the Logan block tells the model to use it. "off" (the
default) is the shipped behaviour and adds nothing.

The agent registers the tool and adds TOOL_HINT to a Logan session's
instructions; everything else is here.
"""

# No `from __future__ import annotations`: the agent wraps query_logan_hits
# and pydantic-ai reads its annotations from the wrapper's module, so they must
# be real types, not strings.
import json
import logging
from typing import Optional

from pydantic_ai import RunContext
from pydantic_ai.tools import ToolDefinition

from app.services.logan_export_query import run_export_query
from app.services.tools.catalog_query import ENTITY_SCHEMA, LoganHitQuery, execute
from app.services.tools.catalog_tools import AssistantDeps

logger = logging.getLogger(__name__)

_SCHEMA = ENTITY_SCHEMA["logan_hit"]


def field_list_text() -> str:
    """The logan_hit fields, as the hint and the tool description name them."""
    return ", ".join(
        f"{name} (a number)" if name in _SCHEMA.numeric_fields else name
        for name in _SCHEMA.fields
    )


TOOL_HINT = (
    "## Counting subsets of this search\n\n"
    "To count, list or break down any subset of this search's matched runs, "
    "call `query_logan_hits`. It runs over the whole match set, so its counts "
    "are exact. Never work a subset's count out from the shares above or from "
    "the top hits. Fields: " + field_list_text() + "."
)

TOOL_DESCRIPTION = (
    "Count, list or break down this Logan search's matched runs. Runs over the "
    "search's whole match set (its export), so a count here is exact -- unlike "
    "anything worked out from the cohort shares or the top hits. Filters are "
    "{field, op, value} predicates, ANDed, over: " + field_list_text() + ". Use "
    "values exactly as the search spells them (e.g. platform ILLUMINA, "
    'library_layout PAIRED). operation: "count" (default), "list" (top runs by '
    'score) or "facets" with facet_by. Returns JSON with `total`; a list adds '
    "`rows`, a breakdown adds `facets`. When the search's full match set is not "
    "cached it says so: send the user to the results page."
)


async def only_in_logan_sessions(
    ctx: RunContext[AssistantDeps], tool_def: ToolDefinition
) -> Optional[ToolDefinition]:
    """Offer query_logan_hits only in a session opened from a search."""
    return tool_def if getattr(ctx.deps, "logan", None) else None


async def query_logan_hits(deps: AssistantDeps, query: LoganHitQuery) -> str:
    """See TOOL_DESCRIPTION, which is what the model is shown.

    Args:
        query: the subset to count, list or break down
    """
    logan = deps.logan or {}
    job_id = logan.get("job_id")
    if not job_id or deps.galaxy is None:
        return json.dumps({"error": "This conversation has no Logan search."})
    path = await deps.galaxy.get_cached_kmindex_export(job_id)
    if path is None:
        return json.dumps(
            {
                "status": "export_not_cached",
                "results_url": logan.get("results_url") or "",
                "message": "This search's full match set is not cached. Open "
                "the results page to rebuild it, then ask again.",
            }
        )
    try:
        result = await run_export_query(path, lambda con: execute(query, con))
    except Exception:
        logger.exception("query_logan_hits failed for job %s", job_id)
        return json.dumps({"error": "Query failed; try a simpler filter."})
    result["total_matches"] = logan.get("total_matches")
    return json.dumps(result, default=str)
