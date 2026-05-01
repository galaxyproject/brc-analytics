"""Adapters that wrap brc-analytics services for use as pydantic-evals tasks.

Each builder takes a (deps, model_entry) and returns a coroutine that
pydantic-evals can call once per case. The deps bundle is the only place
where we instantiate the cache, catalog, etc.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Callable, Optional
from unittest.mock import AsyncMock

from app.core.cache import CacheService
from app.core.config import Settings, get_settings
from app.services.assistant_agent import AssistantAgent
from app.services.llm_service import LLMService
from app.services.tools.catalog_data import CatalogData
from app.services.tools.catalog_tools import AssistantDeps
from evals.judge import build_pydantic_ai_model
from evals.model_registry import ModelEntry


# AssistantAgent's eager init calls pydantic-ai with a model-name string when
# no base_url is configured; pydantic-ai then needs ANTHROPIC_API_KEY in the
# environment. We never use this key for real calls -- _override_model swaps
# the model immediately after construction. But init must not crash.
_STUB_INIT_KEY = "sk-stub-for-evals-init-only"


def _ensure_init_env() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        os.environ["ANTHROPIC_API_KEY"] = _STUB_INIT_KEY
    if not os.environ.get("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = _STUB_INIT_KEY


@dataclass
class EvalDeps:
    """Shared per-run state -- one instance per CLI invocation."""

    settings: Settings
    cache: CacheService
    catalog: CatalogData


@dataclass
class SearchOutput:
    organism: Optional[str]
    taxonomy_id: Optional[str]
    library_strategy: Optional[str]
    sequencing_platform: Optional[str]
    confidence: float
    raw: dict


@dataclass
class WorkflowRecOutput:
    iwc_ids: list[str]
    raw: list[dict]


@dataclass
class AgentTurnOutput:
    reply: str
    schema_state: dict
    suggestions: list[str]
    tool_calls: list[tuple[str, dict]]


@dataclass
class ConversationOutput:
    final_schema: dict
    is_complete: bool
    reply: str
    handoff_url: Optional[str]


def _stub_cache() -> CacheService:
    """Build a no-op cache so evals don't share state between cases."""
    cache = AsyncMock(spec=CacheService)
    cache.get.return_value = None
    cache.set.return_value = None

    def make_key(prefix: str, payload: Any) -> str:  # noqa: ARG001
        return f"{prefix}:{id(payload)}"

    cache.make_key = make_key
    return cache


def build_deps() -> EvalDeps:
    _ensure_init_env()
    settings = get_settings()
    cache = _stub_cache()
    catalog = CatalogData(settings.CATALOG_PATH)
    return EvalDeps(settings=settings, cache=cache, catalog=catalog)


def _override_model(svc: Any, entry: ModelEntry) -> None:
    """Swap agent models on a service to the eval target.

    Mutates `_model` directly because pydantic-ai exposes `model` as a
    read-only property. All three legacy LLMService agents share the same
    candidate model -- we score the candidate end-to-end, not the
    primary/secondary split.
    """
    new_model = build_pydantic_ai_model(entry)
    if hasattr(svc, "primary_model"):
        svc.primary_model = new_model
    if hasattr(svc, "secondary_model"):
        svc.secondary_model = new_model
    for attr in ("reasoning_agent", "formatting_agent", "workflow_agent"):
        agent = getattr(svc, attr, None)
        if agent is not None:
            agent._model = new_model
    if getattr(svc, "agent", None) is not None:
        svc.agent._model = new_model


# ---------- Search query interpretation ----------


def make_search_task(deps: EvalDeps, entry: ModelEntry) -> Callable:
    _ensure_init_env()
    svc = LLMService(deps.cache)
    if not svc.is_available():
        raise RuntimeError(
            "LLMService failed to initialize -- check AI_API_KEY in env"
        )
    _override_model(svc, entry)

    async def task(case_input: dict) -> SearchOutput:
        resp = await svc.interpret_search_query(case_input["query"])
        if not resp.success or resp.data is None:
            raise RuntimeError(resp.error or "LLMService returned failure")
        d = resp.data
        return SearchOutput(
            organism=d.organism,
            taxonomy_id=d.taxonomy_id,
            library_strategy=d.library_strategy,
            sequencing_platform=d.sequencing_platform,
            confidence=float(d.confidence or 0.0),
            raw=d.model_dump(),
        )

    return task


# ---------- Workflow recommendation ----------


def make_workflow_rec_task(deps: EvalDeps, entry: ModelEntry) -> Callable:
    from app.models.llm import WorkflowSuggestionRequest

    _ensure_init_env()
    svc = LLMService(deps.cache)
    if not svc.is_available():
        raise RuntimeError(
            "LLMService failed to initialize -- check AI_API_KEY in env"
        )
    _override_model(svc, entry)

    async def task(case_input: dict) -> WorkflowRecOutput:
        req = WorkflowSuggestionRequest(**case_input)
        resp = await svc.suggest_workflows(req)
        if not resp.success or resp.data is None:
            raise RuntimeError(resp.error or "suggest_workflows returned failure")
        return WorkflowRecOutput(
            iwc_ids=[r.workflow_id for r in resp.data],
            raw=[r.model_dump() for r in resp.data],
        )

    return task


# ---------- Single-turn assistant tool selection ----------


def _extract_tool_calls(result: Any) -> list[tuple[str, dict]]:
    """Pull tool calls from a pydantic-ai run result."""
    from pydantic_ai.messages import ModelResponse, ToolCallPart

    calls: list[tuple[str, dict]] = []
    for msg in result.all_messages():
        if not isinstance(msg, ModelResponse):
            continue
        for part in msg.parts:
            if isinstance(part, ToolCallPart):
                try:
                    args = part.args_as_dict()
                except Exception:
                    args = {"_raw": str(part.args)}
                calls.append((part.tool_name, args or {}))
    return calls


def make_assistant_turn_task(deps: EvalDeps, entry: ModelEntry) -> Callable:
    """Single-turn assistant: takes a user message, returns reply + tool calls."""
    _ensure_init_env()
    aa = AssistantAgent(deps.cache)
    if not aa.is_available():
        raise RuntimeError(
            "AssistantAgent failed to initialize -- check AI_API_KEY in env"
        )
    _override_model(aa, entry)

    async def task(case_input: dict) -> AgentTurnOutput:
        agent_deps = AssistantDeps(catalog=aa.catalog)
        result = await aa._run_agent_with_retry(
            case_input["message"], deps=agent_deps, message_history=None
        )
        reply_text, suggestions, schema_updates = aa._parse_structured_output(
            result.output
        )
        return AgentTurnOutput(
            reply=reply_text,
            schema_state=schema_updates,
            suggestions=[s.label for s in suggestions],
            tool_calls=_extract_tool_calls(result),
        )

    return task


# ---------- Multi-turn assistant ----------


def make_assistant_conversation_task(deps: EvalDeps, entry: ModelEntry) -> Callable:
    """Replay a scripted conversation and report the final accumulated state."""
    _ensure_init_env()
    aa = AssistantAgent(deps.cache)
    if not aa.is_available():
        raise RuntimeError(
            "AssistantAgent failed to initialize -- check AI_API_KEY in env"
        )
    _override_model(aa, entry)

    async def task(case_input: dict) -> ConversationOutput:
        session_id: Optional[str] = None
        last_resp = None
        for turn in case_input["turns"]:
            last_resp = await aa.chat(turn, session_id=session_id)
            session_id = last_resp.session_id
        assert last_resp is not None
        return ConversationOutput(
            final_schema=last_resp.schema_state.model_dump(),
            is_complete=last_resp.is_complete,
            reply=last_resp.reply,
            handoff_url=last_resp.handoff_url,
        )

    return task
