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

from pydantic_ai.messages import ModelResponse, ToolCallPart

from app.core.cache import CacheService
from app.core.config import Settings, get_settings
from app.services.assistant_agent import AssistantAgent
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
    rebuilt per (dataset, model) run via `with_fresh_cache()` so that one
    model's session state can't leak into another model's input.
    """

    settings: Settings
    cache: CacheService
    catalog: CatalogData

    def with_fresh_cache(self) -> "EvalDeps":
        return EvalDeps(
            settings=self.settings, cache=_make_cache(), catalog=self.catalog
        )


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
    SessionService. Persists for the lifetime of the run so multi-turn
    conversations can actually load their session between turns. Naturally
    case-isolated because session_ids are minted fresh per case."""

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
        hash_val = hashlib.md5(param_str.encode(), usedforsecurity=False).hexdigest()[
            :16
        ]
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
    """Swap the agent's model to the eval target.

    Mutates `_model` directly because pydantic-ai exposes `model` as a
    read-only property.
    """
    new_model = build_pydantic_ai_model(entry)
    if getattr(svc, "agent", None) is not None:
        svc.agent._model = new_model


def _prepare_service(svc: Any, entry: ModelEntry) -> None:
    """Verify the service initialized and swap in the eval-target model."""
    if not svc.is_available():
        raise RuntimeError(
            f"{type(svc).__name__} failed to initialize -- check AI_API_KEY in env"
        )
    _override_model(svc, entry)


# ---------- Single-turn assistant tool selection ----------


def _extract_tool_calls(result: Any) -> list[tuple[str, dict]]:
    """Pull tool calls from a pydantic-ai run result."""
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
    _prepare_service(aa, entry)

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
    _prepare_service(aa, entry)

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
