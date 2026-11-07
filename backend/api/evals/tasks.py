"""Adapters that wrap brc-analytics services for use as pydantic-evals tasks.

Each builder takes a (deps, model_entry) and returns a coroutine that
pydantic-evals can call once per case. The deps bundle is the only place
where we instantiate the cache, catalog, etc.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from pydantic_ai.messages import ModelResponse, ToolCallPart

from app.core.cache import CacheService
from app.core.config import Settings, get_settings
from app.models.assistant import AnalysisSchema
from app.models.logan import LoganSnapshot
from app.services.assistant_agent import AssistantAgent
from app.services.logan_prompt import render_logan_instructions
from app.services.sra_mirror import SRAMirrorService
from app.services.tools.catalog_data import CatalogData
from app.services.tools.catalog_tools import AssistantDeps
from evals.judge import build_pydantic_ai_model
from evals.logan_fixture import FixtureGalaxy, load_all_fixtures
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
    sra_mirror: Optional[SRAMirrorService] = None

    def with_fresh_cache(self) -> "EvalDeps":
        return EvalDeps(
            settings=self.settings,
            cache=_make_cache(),
            catalog=self.catalog,
            sra_mirror=self.sra_mirror,
        )


class DatasetRequirementError(RuntimeError):
    """A dataset build() precondition was not met.

    The runner catches this and skips the dataset with a clear message,
    rather than running cases that would score a misleading 0.0.
    """


def require_sra_mirror(deps: EvalDeps) -> None:
    """Guard SRA datasets: without an available mirror, no sra_* tools
    register and every case scores a flat 0.0 that reads like a model
    regression. Fail loudly with an actionable message instead."""
    if deps.sra_mirror is None or not deps.sra_mirror.is_available():
        raise DatasetRequirementError(
            "This dataset requires SRA_MIRROR_PATH to point at a built SRA "
            "mirror. Without it, no sra_* tools register and every case "
            "scores a misleading 0.0. Set SRA_MIRROR_PATH and re-run."
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

    async def get_strict(self, key: str) -> Optional[Any]:
        # SessionService reads through this one. A dict has no backend to fail,
        # so there's nothing to raise -- a miss is just a miss.
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
    sra_mirror = (
        SRAMirrorService(settings.SRA_MIRROR_PATH) if settings.SRA_MIRROR_PATH else None
    )
    return EvalDeps(
        settings=settings, cache=cache, catalog=catalog, sra_mirror=sra_mirror
    )


def _override_model(svc: Any, entry: ModelEntry) -> None:
    """Swap the agent's model(s) to the eval target.

    Mutates `_model` directly because pydantic-ai exposes `model` as a
    read-only property. Covers both the conversational agent and the state
    extractor.

    The extractor's OUTPUT MODE was fixed at init from the deploy's settings,
    not this target -- so after the swap we re-derive it from the target's
    provider (tool for Anthropic, prompted otherwise). Without this a
    mixed-provider run could run the extractor in the wrong mode (e.g. tool mode
    against MiniMax, which loops), skewing ExtractSuccessRate.
    """
    new_model = build_pydantic_ai_model(entry)
    for attr in ("agent", "extract_agent", "narrow_agent"):
        agent = getattr(svc, attr, None)
        if agent is not None:
            agent._model = new_model
    rebuild = getattr(svc, "rebuild_extractor", None)
    if rebuild is not None:
        rebuild("tool" if entry.provider == "anthropic" else "prompted")


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
    aa = AssistantAgent(deps.cache, sra_mirror=deps.sra_mirror)
    _prepare_service(aa, entry)

    async def task(case_input: dict) -> AgentTurnOutput:
        agent_deps = AssistantDeps(
            catalog=aa.catalog, sra_mirror=deps.sra_mirror, con=aa.query_con
        )
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
    aa = AssistantAgent(deps.cache, sra_mirror=deps.sra_mirror)
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


# ---------- Structured channel (extraction pass: reply + state extractor) ----------

# State is captured by a separate extractor, not the conversational reply. The
# crux this task measures per model: the conversational reply produces reliably
# (plain text, ~always), the extractor produces its snapshot reliably, capture
# on state-changing turns, no state leak in the reply, and final-tracker
# correctness. See datasets/structured_channel.py for the metrics.

# A leak is a state TRAILER in the reply -- a SCHEMA_UPDATE:/SUGGESTIONS: marker
# followed by a JSON opener -- not the bare English word. Matching the word
# would false-positive on prose like "here are a few suggestions" and skew
# NoLeak on the extraction pass, where the reply is plain prose.
# \s* before the opener (not just [ \t]*) so a next-line trailer -- SUGGESTIONS:\n
# [...] / SCHEMA_UPDATE:\n{...} -- is still caught; the production parser skips
# any whitespace (incl newlines) between the marker and the JSON opener, so the
# leak detector must too or NoLeak reads clean while a trailer survived (Copilot).
_LEAK_RE = re.compile(
    r"\*{0,2}\b(?:schema_update|suggestions)\b\*{0,2}[ \t]*:?[ \t]*\*{0,2}\s*[\[{]",
    re.IGNORECASE,
)


@dataclass
class TurnTrace:
    """Per-turn instrumentation of the extraction pass."""

    index: int
    expected_change: bool
    reply_produced: bool  # the conversational call returned a reply (no error)
    extract_produced: bool  # the extractor returned a valid snapshot (no error)
    state_nonempty: bool  # applying the updates changed a tracked field's value/status
    leaked: bool  # a state marker survived into the visible reply


@dataclass
class StructuredChannelOutput:
    turns: list[TurnTrace]
    final_schema: dict
    is_complete: bool
    replies: list[str]


def _has_leak_marker(text: str) -> bool:
    return bool(_LEAK_RE.search(text))


def make_structured_channel_task(deps: EvalDeps, entry: ModelEntry) -> Callable:
    """Replay a scripted conversation through the extraction pass, reporting
    per-turn reply/extract production, capture, leak, and the final schema.

    Runs the conversational call and the extractor separately (mirroring chat())
    so an endpoint failure in either scores as a non-production, not a crash. The
    extractor is called directly (not aa._extract_state, which swallows failures)
    so extract-success can be measured.
    """
    from app.services.assistant_agent import (
        _STATE_FIELDS,
        ASSISTANT_TURN_BUDGET_SECONDS,
        EXTRACT_MIN_BUDGET_SECONDS,
        EXTRACT_RUN_TIMEOUT_SECONDS,
    )

    aa = AssistantAgent(deps.cache, sra_mirror=deps.sra_mirror)
    _prepare_service(aa, entry)

    async def task(case_input: dict) -> StructuredChannelOutput:
        schema = AnalysisSchema()
        history: Optional[list] = None
        turns: list[TurnTrace] = []
        replies: list[str] = []
        for i, turn in enumerate(case_input["turns"]):
            agent_deps = AssistantDeps(
                catalog=aa.catalog, sra_mirror=deps.sra_mirror, con=aa.query_con
            )
            augmented = aa._wrap_user_message(schema, turn["text"])
            # Mirror production: truncate restored history before the run so a long
            # eval conversation doesn't feed the model more context than chat()
            # would.
            if history:
                history = aa._truncate_history(history)
            reply_produced = True
            reply_text = ""
            turn_start = time.time()
            try:
                result = await aa._run_agent_with_retry(
                    augmented, deps=agent_deps, message_history=history
                )
                reply_text, _c, _s = aa._parse_structured_output(str(result.output))
                history = result.all_messages()
            except Exception:
                reply_produced = False
                history = None

            # Extractor: a separate focused call. Call it directly so we can see
            # a failure (aa._extract_state would swallow it as copy-forward).
            # Starts False -- if the reply failed the extractor never runs, so
            # the turn genuinely produced no snapshot; it flips True only on a
            # successful extraction.
            extract_produced = False
            state_nonempty = False
            # Mirror production's turn budget: the extractor only runs with the
            # time left after the reply, and is skipped (copy-forward, no capture)
            # if the reply already spent the budget.
            remaining = ASSISTANT_TURN_BUDGET_SECONDS - (time.time() - turn_start)
            if reply_produced and remaining >= EXTRACT_MIN_BUDGET_SECONDS:
                workflows = aa._session_workflows(history)
                payload = aa.build_extract_payload(
                    schema, turn["text"], reply_text, workflows=workflows
                )
                try:
                    # Mirror production chat() exactly: no-retry extractor call
                    # (_run_agent_once) + delta-safe apply (_snapshot_to_updates,
                    # keying off model_fields_set) so an omitted field carries
                    # forward instead of being read as a clear. Building a full
                    # {n: getattr(...)} dict here would collapse the omitted-vs-
                    # explicit-null distinction and make the eval diverge from
                    # real behavior.
                    er = await aa._run_agent_once(
                        payload,
                        agent=aa.extract_agent,
                        timeout=min(EXTRACT_RUN_TIMEOUT_SECONDS, remaining),
                    )
                    updates = aa._snapshot_to_updates(er.output, schema)
                    # "Captured a change" = the apply actually changed a tracked
                    # field. A clear of an already-empty field, or a no-op
                    # restatement, must NOT count (bool(updates) would over-count
                    # those). Compare the tracked fields' (value, status) pre/post.
                    before = {
                        n: (getattr(schema, n).value, getattr(schema, n).status)
                        for n in _STATE_FIELDS
                    }
                    schema = aa._apply_schema_updates(
                        schema, updates, workflows=workflows
                    )
                    state_nonempty = any(
                        before[n]
                        != (getattr(schema, n).value, getattr(schema, n).status)
                        for n in _STATE_FIELDS
                    )
                    extract_produced = True
                except Exception:
                    extract_produced = False

            turns.append(
                TurnTrace(
                    index=i,
                    expected_change=bool(turn.get("expect_state_change", False)),
                    reply_produced=reply_produced,
                    extract_produced=extract_produced,
                    state_nonempty=state_nonempty,
                    leaked=_has_leak_marker(reply_text),
                )
            )
            replies.append(reply_text)

        return StructuredChannelOutput(
            turns=turns,
            final_schema=schema.model_dump(),
            is_complete=schema.is_complete(),
            replies=replies,
        )

    return task


@dataclass
class LoganTurnTrace:
    """One turn of a Logan-bound conversation, as the model saw and answered it."""

    message: str
    reply: str
    # What render_logan_instructions (and anything else on the instructions
    # channel) handed the model on this turn's first request.
    instructions: str
    tool_calls: list[tuple[str, dict]]
    tool_returns: list[str]
    latency_s: float
    # Named sub-timings a mode records for itself (e.g. a pre-reply pass).
    timings: dict[str, float] = field(default_factory=dict)
    # LOGAN_NARROWING_MODE=extract: what the pre-reply pass read out of this
    # turn (intent, query, outcome, latency). Empty in the other modes.
    narrowing: dict = field(default_factory=dict)


@dataclass
class LoganConversationOutput(ConversationOutput):
    # The instructions block of the final turn: the Logan context proper.
    instructions: str
    # Everything the final reply could have drawn a number from: every turn's
    # instructions, the session's intro message, the user's own messages and
    # every tool return. NumbersTraceToContext checks the reply against this.
    context: str
    turns: list[LoganTurnTrace]
    # Flattened across turns, so ToolCallMatch / QueryCatalogShape apply as-is.
    tool_calls: list[tuple[str, dict]]
    session_metadata: dict


def _turn_messages(history: list[dict]) -> list[dict]:
    """This turn's slice of a serialized pydantic-ai history: everything from
    the last request that carries a user prompt."""
    for i in range(len(history) - 1, -1, -1):
        msg = history[i]
        if msg.get("kind") != "request":
            continue
        if any(p.get("part_kind") == "user-prompt" for p in msg.get("parts", [])):
            return history[i:]
    return []


def _trace_parts(messages: list[dict]) -> tuple[str, list, list[str]]:
    """(first instructions, tool calls, tool returns) from a turn's messages."""
    instructions = ""
    calls: list[tuple[str, dict]] = []
    returns: list[str] = []
    for msg in messages:
        if msg.get("kind") == "request" and not instructions:
            instructions = msg.get("instructions") or ""
        for part in msg.get("parts", []):
            kind = part.get("part_kind")
            if kind == "tool-call":
                args = part.get("args")
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {"_raw": args}
                calls.append((part.get("tool_name", ""), args or {}))
            elif kind == "tool-return":
                content = part.get("content")
                returns.append(
                    content
                    if isinstance(content, str)
                    else json.dumps(content, default=str)
                )
    return instructions, calls, returns


def make_logan_conversation_task(
    deps: EvalDeps, entry: ModelEntry, galaxy: Any = None
) -> Callable:
    """Replay a scripted conversation inside a session opened from a Logan
    snapshot fixture, and report the final state plus a per-turn trace.

    The snapshot is injected, not fetched: a case names its fixture, and the
    snapshot comes from the same `galaxy` that serves the job's reads.
    `galaxy` is a fixture-backed stand-in
    (evals.logan_fixture.FixtureGalaxy) by default, so the session has the same
    Logan tools it has in production and every read they make is served from
    the fixtures -- no network, and an unknown job id is a cache miss.
    """
    if galaxy is None:
        galaxy = FixtureGalaxy(load_all_fixtures())
    aa = AssistantAgent(deps.cache, sra_mirror=deps.sra_mirror, galaxy=galaxy)
    _prepare_service(aa, entry)

    async def task(case_input: dict) -> LoganConversationOutput:
        fixture = galaxy.fixture_named(case_input["fixture"])
        snapshot = LoganSnapshot.model_validate(fixture.snapshot)
        state = await aa.create_logan_session_from_snapshot(snapshot, None)
        session_id = state.session_id
        intro = state.messages[0].content if state.messages else ""
        last_resp = None
        turns: list[LoganTurnTrace] = []
        for turn in case_input["turns"]:
            turn_index = int(state.metadata.get("turn_count", 0) or 0)
            started = time.monotonic()
            last_resp, _telemetry, state = await aa.chat_with_telemetry(
                turn, session_id=session_id
            )
            latency = time.monotonic() - started
            messages = _turn_messages(state.agent_message_history)
            instructions, calls, returns = _trace_parts(messages)
            # Only this turn's record: a turn the pass skipped leaves the
            # previous one in place.
            record = state.metadata.get("logan_narrowing") or {}
            if record.get("turn_index") != turn_index:
                record = {}
            turns.append(
                LoganTurnTrace(
                    message=turn,
                    reply=last_resp.reply,
                    instructions=instructions,
                    tool_calls=calls,
                    tool_returns=returns,
                    latency_s=latency,
                    timings=(
                        {"narrowing_s": record["latency_s"]}
                        if "latency_s" in record
                        else {}
                    ),
                    narrowing=dict(record),
                )
            )
        assert last_resp is not None
        final_instructions = turns[-1].instructions or (
            render_logan_instructions(state.metadata.get("logan")) or ""
        )
        context = "\n\n".join(
            [t.instructions for t in turns]
            + [intro]
            + [t.message for t in turns]
            + [r for t in turns for r in t.tool_returns]
        )
        return LoganConversationOutput(
            final_schema=last_resp.schema_state.model_dump(),
            is_complete=last_resp.is_complete,
            reply=last_resp.reply,
            handoff_url=last_resp.handoff_url,
            instructions=final_instructions,
            context=context,
            turns=turns,
            tool_calls=[c for t in turns for c in t.tool_calls],
            session_metadata=dict(state.metadata),
        )

    return task
