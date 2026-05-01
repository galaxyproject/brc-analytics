"""Adapters that wrap brc-analytics services for use as pydantic-evals tasks.

Each builder takes a (deps, model_entry) and returns a coroutine that
pydantic-evals can call once per case. The deps bundle is the only place
where we instantiate the cache, catalog, etc.
"""

from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

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


def _ensure_init_env(skip_env_vars: Optional[set[str]] = None) -> None:
    """Set stub keys so AssistantAgent's eager pydantic-ai init doesn't crash.

    Skip any env var the registry references for a real model -- otherwise
    the stub would silently masquerade as a real eval key.
    """
    skip = skip_env_vars or set()
    for var in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY"):
        if var in skip:
            continue
        if not os.environ.get(var):
            os.environ[var] = _STUB_INIT_KEY


@dataclass
class EvalDeps:
    """Shared per-run state.

    Settings and catalog are reused across the whole CLI invocation; cache is
    rebuilt per (dataset, model) run via `with_fresh_cache()` so that
    LLMService's content-keyed cache entries (llm:interpret, llm:workflow)
    can't leak from one model's output into another model's input.
    """

    settings: Settings
    cache: CacheService
    catalog: CatalogData

    def with_fresh_cache(self) -> "EvalDeps":
        return EvalDeps(
            settings=self.settings, cache=_make_cache(), catalog=self.catalog
        )


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


@dataclass
class _InMemoryCache:
    """Dict-backed cache that satisfies the CacheService surface used by
    SessionService and LLMService. Persists for the lifetime of the run so
    multi-turn conversations can actually load their session between turns.
    Naturally case-isolated because session_ids are minted fresh per case."""

    _store: dict[str, Any] = field(default_factory=dict)

    async def get(self, key: str) -> Optional[Any]:
        return self._store.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:  # noqa: ARG002
        self._store[key] = value
        return True

    async def delete(self, key: str) -> bool:
        return self._store.pop(key, None) is not None

    async def exists(self, key: str) -> bool:
        return key in self._store

    def make_key(self, prefix: str, params: Any) -> str:
        param_str = json.dumps(params, sort_keys=True, default=str)
        hash_val = hashlib.md5(param_str.encode()).hexdigest()[:16]
        return f"{prefix}:{hash_val}"


def _make_cache() -> CacheService:
    """In-memory cache (typed as CacheService for the rest of the app)."""
    return _InMemoryCache()  # type: ignore[return-value]


def build_deps(skip_env_vars: Optional[set[str]] = None) -> EvalDeps:
    _ensure_init_env(skip_env_vars)
    settings = get_settings()
    cache = _make_cache()
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
    svc = LLMService(deps.cache)
    if not svc.is_available():
        raise RuntimeError("LLMService failed to initialize -- check AI_API_KEY in env")
    _override_model(svc, entry)

    async def task(case_input: dict) -> SearchOutput:
        resp = await svc.interpret_search_query(case_input["query"])
        # LLMService returns success=False with low-confidence data for
        # INVALID_QUERY (gibberish, off-topic). Surface that as a SearchOutput
        # so evaluators can score "did the model correctly reject this?"
        # rather than the harness counting it as a structural failure.
        if resp.data is None:
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

    svc = LLMService(deps.cache)
    if not svc.is_available():
        raise RuntimeError("LLMService failed to initialize -- check AI_API_KEY in env")
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
