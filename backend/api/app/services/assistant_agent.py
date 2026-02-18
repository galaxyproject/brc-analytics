"""Analysis assistant agent using pydantic-ai."""

import asyncio
import inspect
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

from pydantic_ai import Agent, RunContext, Tool
from pydantic_ai.messages import ModelMessage, ModelMessagesTypeAdapter
from pydantic_core import to_jsonable_python
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.cache import CacheService
from app.core.config import get_settings
from app.models.assistant import (
    AnalysisSchema,
    ChatMessage,
    ChatResponse,
    FieldStatus,
    MessageRole,
    SchemaField,
    SuggestionChip,
    TokenUsage,
)
from app.services.session_service import SessionService
from app.services.tools.catalog_data import CatalogData
from app.services.tools.catalog_tools import (
    AssistantDeps,
    check_compatibility,
    get_assemblies,
    get_assembly_details,
    get_compatible_workflows,
    get_workflow_details,
    get_workflows_in_category,
    list_workflow_categories,
    search_organisms,
)

logger = logging.getLogger(__name__)

# ~20 turn-pairs; tool-heavy turns produce 3-5 messages each, so this
# bounds total context while preserving good conversational continuity.
MAX_HISTORY_MESSAGES = 40

SYSTEM_PROMPT = """\
You are the BRC Analytics Analysis Assistant, an expert in bioinformatics \
who helps researchers discover data and configure analyses for execution in Galaxy.

You serve two purposes in a single conversation:

1. **Exploration** — Help users discover what's available in the BRC Analytics \
catalog: organisms, genome assemblies, workflows, and public sequencing datasets. \
Answer questions, compare options, and explain analysis types.

2. **Guided analysis setup** — When a user has an analysis goal, help them work \
through the decisions needed to configure a workflow: which organism, which \
reference assembly, which workflow, what kind of data they have. Keep track of \
their choices and let them know what's still needed.

Conversations may shift between exploration and guided setup naturally.

## Tools at your disposal

You have tools to search organisms, look up assemblies, browse workflow \
categories, check compatibility between workflows and assemblies, and more. \
**Always use tools** to look up catalog data rather than guessing — the catalog \
has 1,900+ organisms and 5,000+ assemblies, so your training data may be \
out of date.

## Analysis schema

As the user makes decisions, internally track these fields:
- **Organism** — species being studied
- **Assembly** — reference genome to use
- **Analysis type** — category (Transcriptomics, Variant Calling, etc.)
- **Workflow** — specific Galaxy workflow
- **Data source** — user upload or ENA/SRA public data
- **Data characteristics** — paired/single-end, library strategy
- **Gene annotation** — GTF file (if the workflow requires one)

When recommending an assembly, prefer the reference assembly if one exists, \
especially if it has a gene annotation (GTF) available.

## Response guidelines

- Be concise but friendly. Use markdown formatting (lists, bold) for readability.
- When listing options, include relevant details (accession, ploidy, reference status).
- After the user makes a selection, briefly summarize what you've recorded and \
  mention what's still needed.
- When all required fields are filled, tell the user their configuration is \
  complete and they can continue to the workflow setup.
- Don't hallucinate data — if a tool returns no results, say so.
- If the user asks about something outside bioinformatics/BRC Analytics, \
  politely redirect.

## Schema updates

When the user **makes a decision** (selects an organism, picks an assembly, \
chooses an analysis type, etc.), emit a SCHEMA_UPDATE line at the end of your \
response with the fields that changed. Only include fields where the user has \
committed to a choice — do NOT set fields just because you listed options.

Format: a JSON object on its own line prefixed with "SCHEMA_UPDATE:". \
Valid keys: organism, assembly, analysis_type, workflow, data_source, \
data_characteristics, gene_annotation. Each value is a string (the display \
label). For assembly, include the accession. For workflow, include the IWC ID.

Example — user said "I want to work with yeast RNA-seq":
SCHEMA_UPDATE: {"organism": "Saccharomyces cerevisiae", "analysis_type": "Transcriptomics"}

Only emit this when the user has actually chosen something. If the conversation \
is purely exploratory (listing options, answering questions), do NOT emit it.

## Suggestion chips

After each response, suggest 2-4 short phrases the user might want to say next. \
Format them as a JSON array at the very end of your response, on its own line, \
prefixed with "SUGGESTIONS:". For example:
SUGGESTIONS: ["Search ENA for public data", "Use the reference assembly", "Tell me about variant calling"]

If no suggestions are appropriate, omit the SUGGESTIONS line entirely.
"""


def _wrap_tool(fn):
    """Wrap a tool function so it receives AssistantDeps from RunContext."""

    async def wrapper(ctx: RunContext[AssistantDeps], **kwargs) -> str:
        return fn(ctx.deps, **kwargs)

    wrapper.__name__ = fn.__name__
    wrapper.__doc__ = fn.__doc__
    sig = inspect.signature(fn)
    params = {k: v for k, v in sig.parameters.items() if k != "deps"}
    wrapper.__signature__ = sig.replace(
        parameters=[
            inspect.Parameter(
                "ctx",
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                annotation=RunContext[AssistantDeps],
            ),
            *params.values(),
        ]
    )
    annotations = {k: v for k, v in fn.__annotations__.items() if k != "deps"}
    annotations["ctx"] = RunContext[AssistantDeps]
    wrapper.__annotations__ = annotations
    return wrapper


class AssistantAgent:
    """High-level wrapper around the pydantic-ai Agent for the analysis assistant."""

    def __init__(self, cache: CacheService):
        self.settings = get_settings()
        self.session_service = SessionService(cache)
        self.catalog = CatalogData(self.settings.CATALOG_PATH)

        self.agent: Optional[Agent] = None
        self._init_agent()

    def _init_agent(self) -> None:
        settings = self.settings
        if not settings.AI_API_KEY:
            logger.warning("AI_API_KEY not set — assistant agent unavailable")
            return

        # Build model the same way LLMService does
        model = self._build_model(settings.AI_PRIMARY_MODEL)
        if model is None:
            return

        tool_fns = [
            search_organisms,
            get_assemblies,
            get_assembly_details,
            list_workflow_categories,
            get_workflows_in_category,
            get_compatible_workflows,
            get_workflow_details,
            check_compatibility,
        ]

        tools = [Tool(_wrap_tool(fn), takes_ctx=True) for fn in tool_fns]

        self.agent = Agent(
            model,
            deps_type=AssistantDeps,
            system_prompt=SYSTEM_PROMPT,
            tools=tools,
        )
        logger.info("Assistant agent initialized")

    def _build_model(self, model_name: str):
        """Build a pydantic-ai model from the configured provider.

        TODO: Shares logic with LLMService.__init__; extract a shared utility.
        """
        settings = self.settings
        base_url = settings.AI_API_BASE_URL

        try:
            if base_url and "anthropic" in base_url.lower():
                from pydantic_ai.models.anthropic import AnthropicModel
                from pydantic_ai.providers.anthropic import AnthropicProvider

                provider = AnthropicProvider(api_key=settings.AI_API_KEY)
                return AnthropicModel(model_name, provider=provider)
            else:
                # Default: assume model string like "openai:gpt-4o" or
                # "anthropic:claude-sonnet-4-20250514" handled by pydantic-ai
                # auto-detection. If a base_url is set, use OpenAI-compatible.
                if base_url:
                    import httpx
                    from pydantic_ai.models.openai import OpenAIChatModel
                    from pydantic_ai.providers.openai import OpenAIProvider

                    http_client = httpx.AsyncClient(
                        verify=not settings.AI_SKIP_SSL_VERIFY
                    )
                    provider = OpenAIProvider(
                        api_key=settings.AI_API_KEY,
                        base_url=base_url,
                        http_client=http_client,
                    )
                    return OpenAIChatModel(model_name, provider=provider)
                else:
                    # Let pydantic-ai resolve the model string (supports
                    # "openai:gpt-4o", "anthropic:claude-...", etc.)
                    return model_name
        except Exception:
            logger.exception("Failed to build LLM model for assistant")
            return None

    def is_available(self) -> bool:
        return self.agent is not None

    @staticmethod
    def _truncate_history(messages: list[ModelMessage]) -> list[ModelMessage]:
        """Keep history within MAX_HISTORY_MESSAGES.

        Preserves the first message (original user intent) plus the most
        recent MAX_HISTORY_MESSAGES messages so the agent retains enough
        context without blowing up the token budget.
        """
        if len(messages) <= MAX_HISTORY_MESSAGES:
            return messages
        logger.info(
            "Truncating agent history from %d to %d messages",
            len(messages),
            MAX_HISTORY_MESSAGES + 1,
        )
        return messages[:1] + messages[-MAX_HISTORY_MESSAGES:]

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((Exception,)),
        reraise=True,
    )
    async def _run_agent_with_retry(
        self,
        message: str,
        deps: AssistantDeps,
        message_history: Optional[list] = None,
        timeout: float = 120.0,
    ):
        """Run the pydantic-ai agent with timeout and automatic retry.

        Args:
            message: User message to send.
            deps: Agent dependencies (catalog data).
            message_history: Prior pydantic-ai messages to restore context.
            timeout: Maximum seconds to wait (default 120s, matches frontend).

        Retries up to 3 times with exponential backoff (2s, 4s, 8s).
        """
        start_time = time.time()
        logger.info("Agent run starting (timeout=%ss)", timeout)
        try:
            result = await asyncio.wait_for(
                self.agent.run(message, deps=deps, message_history=message_history),
                timeout=timeout,
            )
            elapsed = time.time() - start_time
            logger.info("Agent run completed in %.2fs", elapsed)
            return result
        except asyncio.TimeoutError as e:
            elapsed = time.time() - start_time
            logger.error(
                "Agent run timed out after %.2fs (limit: %ss)", elapsed, timeout
            )
            raise RuntimeError(
                f"Assistant request timed out after {timeout} seconds"
            ) from e

    async def chat(
        self, message: str, session_id: Optional[str] = None
    ) -> ChatResponse:
        """Process one user message and return the assistant's reply.

        Creates a new session if session_id is None or not found.
        """
        if not self.is_available():
            raise RuntimeError("Assistant agent is not available (check AI_API_KEY)")

        # Get or create session
        state = None
        if session_id:
            state = await self.session_service.get_session(session_id)
        if state is None:
            state = await self.session_service.create_session()

        # Record user message
        state.messages.append(ChatMessage(role=MessageRole.USER, content=message))

        # Restore pydantic-ai message history from session
        agent_history = None
        if state.agent_message_history:
            try:
                agent_history = ModelMessagesTypeAdapter.validate_python(
                    state.agent_message_history
                )
                agent_history = self._truncate_history(agent_history)
            except Exception:
                logger.warning(
                    "Failed to restore agent message history, starting fresh"
                )
                agent_history = None

        # Run the agent (with timeout + retry)
        deps = AssistantDeps(catalog=self.catalog)
        result = await self._run_agent_with_retry(
            message, deps=deps, message_history=agent_history
        )

        raw_reply = result.output

        # Extract token usage
        usage = result.usage()
        token_usage = TokenUsage(
            input_tokens=usage.input_tokens or 0,
            output_tokens=usage.output_tokens or 0,
            requests=usage.requests,
            tool_calls=usage.tool_calls,
            total_tokens=usage.total_tokens or 0,
        )
        logger.info(
            "Token usage: %d in / %d out / %d total (%d requests, %d tool calls)",
            token_usage.input_tokens,
            token_usage.output_tokens,
            token_usage.total_tokens,
            token_usage.requests,
            token_usage.tool_calls,
        )

        # Parse structured lines from the end of the reply
        reply_text, suggestions, schema_updates = self._parse_structured_output(
            raw_reply
        )

        # Apply LLM-emitted schema updates
        schema_state = self._apply_schema_updates(state.schema_state, schema_updates)

        # Record assistant message
        state.messages.append(
            ChatMessage(role=MessageRole.ASSISTANT, content=reply_text)
        )

        # Persist updated state
        state.schema_state = schema_state
        state.agent_message_history = to_jsonable_python(result.all_messages())
        await self.session_service.save_session(state)

        is_complete = schema_state.is_complete()
        handoff_url = None
        if is_complete:
            # Build URL to the workflow stepper with pre-populated params
            accession = schema_state.assembly.detail or ""
            trs_id = schema_state.workflow.detail or ""
            if accession and trs_id:
                handoff_url = f"/data/assemblies/{accession}/{trs_id}"

        return ChatResponse(
            session_id=state.session_id,
            reply=reply_text,
            schema_state=schema_state,
            suggestions=suggestions,
            is_complete=is_complete,
            handoff_url=handoff_url,
            token_usage=token_usage,
        )

    def _parse_structured_output(
        self, raw_reply: str
    ) -> tuple[str, List[SuggestionChip], Dict[str, str]]:
        """Extract SCHEMA_UPDATE and SUGGESTIONS lines from the reply.

        Handles common LLM formatting variations: bold markdown wrapping,
        mixed case, extra whitespace around the prefix.
        """
        suggestions: List[SuggestionChip] = []
        schema_updates: Dict[str, str] = {}
        reply_lines = []

        # Match SUGGESTIONS or SCHEMA_UPDATE with optional markdown bold/italic.
        # The colon may be inside or outside the bold markers:
        #   SUGGESTIONS: ...  |  **SUGGESTIONS:** ...  |  **SUGGESTIONS**: ...
        suggestions_re = re.compile(
            r"^\s*\*{0,2}suggestions:?\*{0,2}:?\s*", re.IGNORECASE
        )
        schema_re = re.compile(r"^\s*\*{0,2}schema_update:?\*{0,2}:?\s*", re.IGNORECASE)

        for line in raw_reply.rstrip().split("\n"):
            s_match = suggestions_re.match(line)
            u_match = schema_re.match(line)
            if s_match:
                try:
                    json_str = line[s_match.end() :].strip()
                    items = json.loads(json_str)
                    suggestions = [SuggestionChip(label=s, message=s) for s in items]
                except (json.JSONDecodeError, TypeError):
                    reply_lines.append(line)
            elif u_match:
                try:
                    json_str = line[u_match.end() :].strip()
                    schema_updates = json.loads(json_str)
                except (json.JSONDecodeError, TypeError):
                    reply_lines.append(line)
            else:
                reply_lines.append(line)

        return "\n".join(reply_lines).rstrip(), suggestions, schema_updates

    def _apply_schema_updates(
        self,
        current: AnalysisSchema,
        updates: Dict[str, str],
    ) -> AnalysisSchema:
        """Apply LLM-emitted schema updates to the current schema."""
        if not updates:
            return current

        schema = current.model_copy(deep=True)
        valid_fields = {
            "organism",
            "assembly",
            "analysis_type",
            "workflow",
            "data_source",
            "data_characteristics",
            "gene_annotation",
        }

        for key, value in updates.items():
            if key not in valid_fields or not value:
                continue

            field = SchemaField(value=str(value), status=FieldStatus.FILLED)

            # For assembly, try to look up extra detail (accession)
            if key == "assembly":
                acc_match = re.search(r"(GC[AF]_\d{9}\.\d+)", str(value))
                if acc_match:
                    field.detail = acc_match.group(1)

            # For workflow, try to look up the trs_id
            if key == "workflow":
                for cat in self.catalog.workflows_by_category:
                    for wf in cat.get("workflows", []):
                        if wf.get("iwcId") and wf["iwcId"] in str(value):
                            field.detail = wf.get("trsId", wf["iwcId"])
                            break

            setattr(schema, key, field)

        return schema
