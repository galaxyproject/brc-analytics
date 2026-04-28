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
- Each message includes the current analysis state in brackets. Use this to \
  know what's already filled and what still needs to be decided. Don't re-ask \
  about filled fields unless the user wants to change something.

## When data is missing

Stay focused on the happy path: the data, assemblies, and annotations we \
already have in the BRC Analytics catalog. If the catalog doesn't have what \
the user needs (for example, a GTF for an assembly, or a particular workflow \
input), do NOT instruct them to manually download files from third-party \
sources (VEuPath, NCBI, Ensembl, etc.) and upload them. Format conversion \
and provenance for those files is non-trivial and we don't want to send \
people down that road blind.

Instead:
- Be honest that the data isn't available in the catalog.
- Suggest alternatives that ARE available (a different assembly, a different \
  workflow that doesn't need that input, etc.) when reasonable.
- Point them to the community forum at https://help.brc-analytics.org or \
  the GitHub repo at https://github.com/galaxyproject/brc-analytics/issues \
  to request the missing data.

Do not invent workarounds or suggest external download URLs as a substitute \
for catalog data.

## Schema updates

When the user **makes a decision** (selects an organism, picks an assembly, \
chooses an analysis type, etc.), emit a SCHEMA_UPDATE line at the end of your \
response with the fields that changed. Only include fields where the user has \
committed to a choice — do NOT set fields just because you listed options.

Format: a JSON object on its own line prefixed with "SCHEMA_UPDATE:". \
Valid keys: organism, assembly, analysis_type, workflow, data_source, \
data_characteristics, gene_annotation. Each value is a string (the display \
label) or null to clear a field. For assembly, include the accession. \
For workflow, include the IWC ID.

To clear a field (e.g., the user changed their mind), set its value to null. \
When a user changes a high-level choice like organism or analysis_type, also \
clear dependent downstream fields that may no longer be valid. The dependency \
chain is: organism -> assembly -> analysis_type -> workflow -> \
data_characteristics, gene_annotation. The data_source field is independent.

Example — user said "I want to work with yeast RNA-seq":
SCHEMA_UPDATE: {"organism": "Saccharomyces cerevisiae", "analysis_type": "Transcriptomics"}

Example — user switches from RNA-seq to variant calling:
SCHEMA_UPDATE: {"analysis_type": "Variant Calling", "workflow": null, "data_characteristics": null, "gene_annotation": null}

Only emit this when the user has actually chosen or changed something. If the \
conversation is purely exploratory (listing options, answering questions), do \
NOT emit it.

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
    def compute_handoff(schema_state: AnalysisSchema) -> tuple[bool, Optional[str]]:
        """Compute is_complete and handoff_url from schema state."""
        handoff_url = None
        if schema_state.is_complete():
            accession = schema_state.assembly.detail or ""
            trs_id = schema_state.workflow.detail or ""
            if accession and trs_id:
                handoff_url = f"/data/assemblies/{accession}/{trs_id}"
        return handoff_url is not None, handoff_url

    @staticmethod
    def _build_context_prefix(schema: AnalysisSchema) -> str:
        """Serialize current schema state so the LLM knows what's been decided."""
        parts = []
        for name in (
            "organism",
            "assembly",
            "analysis_type",
            "workflow",
            "data_source",
            "data_characteristics",
            "gene_annotation",
        ):
            field = getattr(schema, name)
            if field.status == FieldStatus.FILLED:
                parts.append(f"{name}={field.value} (filled)")
            elif field.status == FieldStatus.NEEDS_ATTENTION:
                parts.append(f"{name}={field.value} (needs attention)")
            else:
                parts.append(f"{name}=pending")
        return f"[Analysis progress: {', '.join(parts)}]"

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

        # Prepend current schema state so the LLM knows what's been decided
        context_prefix = self._build_context_prefix(state.schema_state)
        augmented_message = f"{context_prefix}\n\n{message}"

        # Run the agent (with timeout + retry)
        deps = AssistantDeps(catalog=self.catalog)
        result = await self._run_agent_with_retry(
            augmented_message, deps=deps, message_history=agent_history
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
        state.suggestions = suggestions
        state.agent_message_history = to_jsonable_python(result.all_messages())
        await self.session_service.save_session(state)

        is_complete, handoff_url = self.compute_handoff(schema_state)

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
    ) -> tuple[str, List[SuggestionChip], Dict[str, Optional[str]]]:
        """Extract SCHEMA_UPDATE and SUGGESTIONS lines from the reply.

        Handles common LLM formatting variations: bold markdown wrapping,
        mixed case, extra whitespace around the prefix.
        """
        suggestions: List[SuggestionChip] = []
        schema_updates: Dict[str, Optional[str]] = {}
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
                    if isinstance(items, list) and all(
                        isinstance(s, str) for s in items
                    ):
                        suggestions = [
                            SuggestionChip(label=s, message=s) for s in items
                        ]
                    else:
                        reply_lines.append(line)
                except (json.JSONDecodeError, TypeError):
                    reply_lines.append(line)
            elif u_match:
                try:
                    json_str = line[u_match.end() :].strip()
                    data = json.loads(json_str)
                    if isinstance(data, dict) and all(
                        isinstance(k, str) and (isinstance(v, str) or v is None)
                        for k, v in data.items()
                    ):
                        schema_updates = data
                    else:
                        reply_lines.append(line)
                except (json.JSONDecodeError, TypeError):
                    reply_lines.append(line)
            else:
                reply_lines.append(line)

        return "\n".join(reply_lines).rstrip(), suggestions, schema_updates

    def _apply_schema_updates(
        self,
        current: AnalysisSchema,
        updates: Dict[str, Optional[str]],
    ) -> AnalysisSchema:
        """Apply LLM-emitted schema updates to the current schema.

        Values of None clear the field back to EMPTY (supports mid-conversation
        corrections when the user changes their mind).
        """
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
            if key not in valid_fields:
                continue
            if value is None:
                setattr(schema, key, SchemaField())
                continue
            if not value:
                continue

            field = SchemaField(value=str(value), status=FieldStatus.FILLED)

            # For assembly, try to extract accession from the value string,
            # falling back to a catalog search by name if the regex misses.
            if key == "assembly":
                acc_match = re.search(r"(GC[AF]_\d{9}\.\d+)", str(value))
                if acc_match:
                    field.detail = acc_match.group(1)
                else:
                    field.detail = self._find_assembly_accession(str(value), schema)

            # For workflow, try to match iwcId in the value string, falling
            # back to a case-insensitive name match against the catalog.
            if key == "workflow":
                workflow_value = str(value)
                for cat in self.catalog.workflows_by_category:
                    for wf in cat.get("workflows", []):
                        iwc_id = wf.get("iwcId")
                        if iwc_id and iwc_id in workflow_value:
                            field.detail = wf.get("trsId", iwc_id)
                            break
                    if field.detail:
                        break
                if not field.detail:
                    field.detail = self._find_workflow_trs_id(workflow_value)

            setattr(schema, key, field)

        return schema

    def _find_assembly_accession(
        self, value: str, schema: AnalysisSchema
    ) -> Optional[str]:
        """Fallback: search the catalog for an assembly matching the LLM value."""
        val_lower = value.lower()
        # If we already know the organism, narrow the search
        tax_id = None
        if schema.organism.detail:
            tax_id = schema.organism.detail
        elif schema.organism.status == FieldStatus.FILLED and schema.organism.value:
            for org in self.catalog.organisms:
                species = (org.get("taxonomicLevelSpecies") or "").lower()
                if species and species in schema.organism.value.lower():
                    tax_id = str(org.get("ncbiTaxonomyId"))
                    break

        candidates: list[dict] = []
        for org in self.catalog.organisms:
            org_tax = str(org.get("ncbiTaxonomyId", ""))
            if tax_id and org_tax != tax_id:
                continue
            for g in org.get("genomes", []):
                strain = (g.get("strainName") or "").strip().lower()
                if strain and strain in val_lower:
                    candidates.append(g)

        # If no strain match, don't guess from species alone -- too ambiguous
        # when an organism has many assemblies.
        if not candidates:
            logger.warning("Assembly fallback found no match for '%s'", value)
            return None

        # Prefer reference assemblies when multiple candidates match
        for c in candidates:
            if c.get("isRef") == "Yes":
                logger.info(
                    "Assembly fallback matched reference '%s'", c.get("accession")
                )
                return c.get("accession")

        accession = candidates[0].get("accession")
        logger.info("Assembly fallback matched '%s'", accession)
        return accession

    def _find_workflow_trs_id(self, value: str) -> Optional[str]:
        """Fallback: match a workflow by name when iwcId isn't in the value."""
        val_lower = value.lower()
        for cat in self.catalog.workflows_by_category:
            for wf in cat.get("workflows", []):
                wf_name = (wf.get("workflowName") or "").lower()
                if wf_name and (wf_name in val_lower or val_lower in wf_name):
                    logger.info("Workflow fallback matched name '%s'", wf_name)
                    return wf.get("trsId", wf.get("iwcId"))
        logger.warning("Workflow fallback found no match for '%s'", value)
        return None
