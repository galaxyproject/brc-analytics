import asyncio
import json
import logging

from pydantic_ai import Agent
from pydantic_ai.exceptions import AgentRunError
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.openai import OpenAIProvider
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.models.llm import (
    DatasetQuery,
    LLMResponse,
    WorkflowRecommendation,
    WorkflowSuggestionRequest,
)
from app.services.sambanova_patch import patch_sambanova_compatibility
from app.services.workflow_catalog import WorkflowCatalog

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service for handling LLM interactions using pydantic-ai.

    Configuration:
    - AI_PRIMARY_MODEL (required): Used for reasoning and critical tasks
    - AI_SECONDARY_MODEL (optional): Used for formatting/simple tasks
      If not set, falls back to AI_PRIMARY_MODEL (single-model mode)

    Two-phase process:
    - Phase 1: Primary model analyzes the query and extracts intent
    - Phase 2: Secondary model converts analysis to structured JSON
    """

    def __init__(self, cache: CacheService):
        self.cache = cache
        self.settings = get_settings()

        if not self.settings.AI_API_KEY:
            logger.warning("AI API key not configured - LLM features will be disabled")
            self.primary_model = None
            self.secondary_model = None
            self.reasoning_agent = None
            self.formatting_agent = None
            self.workflow_agent = None
            self.workflow_catalog = None
            return

        try:
            # Detect which model provider to use based on API base URL
            is_anthropic = (
                self.settings.AI_API_BASE_URL
                and "anthropic.com" in self.settings.AI_API_BASE_URL
            )
            is_sambanova = self.settings.AI_API_BASE_URL and (
                "sambanova" in self.settings.AI_API_BASE_URL.lower()
                or "tacc.utexas.edu" in self.settings.AI_API_BASE_URL.lower()
            )

            # Apply SambaNova compatibility patch only when using SambaNova endpoints
            if is_sambanova:
                logger.info("Applying SambaNova compatibility patch")
                patch_sambanova_compatibility()

            if is_anthropic:
                # Use Anthropic's native API with provider
                logger.info("Using Anthropic API")
                anthropic_provider = AnthropicProvider(api_key=self.settings.AI_API_KEY)
                self.primary_model = AnthropicModel(
                    self.settings.AI_PRIMARY_MODEL, provider=anthropic_provider
                )
                self.secondary_model = AnthropicModel(
                    self.settings.AI_SECONDARY_MODEL, provider=anthropic_provider
                )
            else:
                # Use OpenAI-compatible API (OpenAI, LiteLLM, etc.) with provider
                if self.settings.AI_API_BASE_URL:
                    logger.info(
                        f"Using custom OpenAI-compatible API: {self.settings.AI_API_BASE_URL}"
                    )
                else:
                    logger.info("Using OpenAI API")

                openai_provider = OpenAIProvider(
                    api_key=self.settings.AI_API_KEY,
                    base_url=self.settings.AI_API_BASE_URL,
                )
                logger.info(f"Primary model: {self.settings.AI_PRIMARY_MODEL}")
                logger.info(f"Secondary model: {self.settings.AI_SECONDARY_MODEL}")
                self.primary_model = OpenAIChatModel(
                    self.settings.AI_PRIMARY_MODEL, provider=openai_provider
                )
                self.secondary_model = OpenAIChatModel(
                    self.settings.AI_SECONDARY_MODEL, provider=openai_provider
                )

            # Log configuration approach
            if self.settings.AI_PRIMARY_MODEL == self.settings.AI_SECONDARY_MODEL:
                logger.info(
                    f"Initialized LLM service (SINGLE MODEL): {self.settings.AI_PRIMARY_MODEL}"
                )
            else:
                logger.info("Initialized LLM service (DUAL MODEL):")
                logger.info(f"  Primary: {self.settings.AI_PRIMARY_MODEL}")
                logger.info(f"  Secondary: {self.settings.AI_SECONDARY_MODEL}")

            # Initialize reasoning agent for query understanding (uses primary model)
            self.reasoning_agent = Agent[str](
                self.primary_model,
                system_prompt="""You are a bioinformatics data search expert. Analyze the user's query and identify:
- Organism/species (use scientific names, be specific - e.g., "Plasmodium falciparum" not "Plasmodium spp.")
- Experiment type (RNA-seq, WGS, ChIP-seq, etc.)
- Library strategy (RNA-Seq, WGS, WXS, ChIP-Seq)
- Sequencing platform/technology (Illumina, PacBio, Oxford Nanopore, Ion Torrent, etc.)
- Date ranges (e.g., "from 2023" means start: 2023-01-01, end: 2023-12-31)
- Assembly level or completeness (Complete Genome, Chromosome, Scaffold, Contig, draft, complete)
- Other keywords or constraints (strain names, drug resistance, conditions)

IMPORTANT: If the query appears to be nonsense, gibberish, random characters, or completely unrelated to bioinformatics/genomics, clearly state "INVALID_QUERY: This query does not appear to be a valid bioinformatics search request."

Known organisms and their taxonomy IDs:
- Plasmodium falciparum (malaria): 5833
- Mycobacterium tuberculosis (TB): 1773
- Escherichia coli: 562
- Candida albicans: 5476
- Candida auris: 498019

Sequencing platforms:
- Illumina (MiSeq, HiSeq, NextSeq, NovaSeq)
- PacBio (Pacific Biosciences, SMRT sequencing)
- Oxford Nanopore (MinION, GridION, PromethION)
- Ion Torrent (Ion PGM, Ion Proton)

Provide a clear, structured analysis. If the query is invalid or nonsense, clearly indicate this.""",
            )

            # Initialize formatting agent for JSON conversion (uses secondary model)
            self.formatting_agent = Agent[str](
                self.secondary_model,
                system_prompt="""You are a JSON formatting assistant.
Convert the analysis into a structured DatasetQuery JSON object.

Return a JSON object with these exact fields:
- organism: scientific name or null
- taxonomy_id: NCBI taxonomy ID or null (as string, e.g., "5833")
- experiment_type: RNA-seq, DNA-seq, ChIP-seq, ATAC-seq, or null
- library_strategy: WGS, WXS, RNA-Seq, ChIP-Seq, or null
- library_source: GENOMIC, TRANSCRIPTOMIC, or null
- sequencing_platform: Illumina, PacBio, Oxford Nanopore, or null
- date_range: {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} or null
- keywords: array of search keywords
- study_type: type of study or null
- assembly_level: Complete Genome, Chromosome, Scaffold, Contig, or null
- assembly_completeness: complete, draft, incomplete, or null
- confidence: 0.0 to 1.0

CONFIDENCE SCORING:
- 0.0-0.2: nonsense, gibberish, or completely unrelated to bioinformatics
- 0.3-0.5: vague or ambiguous query
- 0.6-0.8: some clear bioinformatics terms but missing details
- 0.9-1.0: specific and clearly describes a bioinformatics search

Output ONLY the JSON object, no markdown, no backticks, no explanations.""",
            )

            # Initialize workflow recommendation agent (uses secondary model)
            self.workflow_agent = Agent[str](
                self.secondary_model,
                system_prompt="""You are a bioinformatics workflow expert helping researchers choose appropriate analysis pipelines.

Based on dataset characteristics and analysis goals, recommend suitable workflows from common bioinformatics pipelines.

You MUST respond with ONLY a valid JSON array matching this EXACT structure:
[
    {
        "workflow_id": "salmon-deseq2",
        "workflow_name": "Salmon Quantification with DESeq2",
        "confidence": 0.95,
        "reasoning": "Detailed explanation of why this workflow is suitable for the specific dataset and analysis goals",
        "parameters": {"bootstrap_samples": "30", "bias_correction": "true"},
        "compatibility_notes": "Works well with paired-end RNA-seq data from eukaryotic organisms"
    }
]

CRITICAL FIELD REQUIREMENTS:
- workflow_id: exact ID from the provided catalog (required)
- workflow_name: human-readable name (required)
- confidence: number between 0.0 and 1.0 (required)
- reasoning: detailed explanation of why this workflow matches the request (required, not "reason")
- parameters: object with key-value pairs or null (optional)
- compatibility_notes: string or null (optional)

Provide 1-3 recommendations ranked by confidence.
The workflow catalog will be provided in each request - select only from that catalog.

Return ONLY the JSON array. No markdown code blocks, no explanations, no extra text.""",
            )

            # Load workflow catalog for recommendations
            try:
                self.workflow_catalog = WorkflowCatalog(self.settings.CATALOG_PATH)
                logger.info(
                    f"Loaded {self.workflow_catalog.count()} workflows from catalog"
                )
            except Exception as catalog_error:
                logger.warning(f"Failed to load workflow catalog: {catalog_error}")
                self.workflow_catalog = None

            logger.info("LLM service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            self.primary_model = None
            self.secondary_model = None
            self.reasoning_agent = None
            self.formatting_agent = None
            self.workflow_agent = None
            self.workflow_catalog = None

    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.primary_model is not None and self.secondary_model is not None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception,)),
        reraise=True,
    )
    async def _call_agent_with_retry(
        self, agent: Agent, prompt: str, timeout: float = 60.0
    ):
        """
        Call an LLM agent with automatic retry on transient failures and timeout.

        Args:
            agent: The pydantic-ai Agent to call
            prompt: The prompt to send to the agent
            timeout: Maximum time in seconds to wait for a response (default: 60s)

        Retries up to 3 times with exponential backoff (2s, 4s, 8s max).
        Only retries on exceptions (network errors, timeouts, etc).
        Re-raises the exception after all retries are exhausted.
        """
        import time

        start_time = time.time()
        logger.info("=== LLM CALL START ===")
        logger.info(f"Timeout: {timeout}s")
        logger.info(f"Prompt length: {len(prompt)} chars")
        logger.info(f"Prompt preview: {prompt[:200]}...")
        try:
            result = await asyncio.wait_for(agent.run(prompt), timeout=timeout)
            elapsed = time.time() - start_time
            logger.info(f"=== LLM CALL SUCCESS === Took {elapsed:.2f}s")
            return result
        except asyncio.TimeoutError as e:
            elapsed = time.time() - start_time
            logger.error(
                f"=== LLM CALL TIMEOUT === After {elapsed:.2f}s (limit: {timeout}s)"
            )
            raise Exception(f"LLM request timed out after {timeout} seconds") from e

    def _clean_json_response(self, raw_output: str) -> str:
        """
        Remove markdown formatting from LLM JSON responses.

        LLMs often wrap JSON in markdown code blocks like:
        ```json
        {"key": "value"}
        ```

        This method strips the markdown formatting and returns clean JSON.
        """
        json_str = raw_output.strip()
        if json_str.startswith("```"):
            # Remove markdown code blocks
            json_str = json_str.split("```")[1]
            if json_str.startswith("json"):
                json_str = json_str[4:]
            json_str = json_str.strip()
        return json_str

    async def interpret_search_query(self, user_query: str) -> LLMResponse:
        """Interpret a natural language search query into structured parameters using hybrid approach"""
        if not self.is_available():
            return LLMResponse(
                success=False,
                error="LLM service not available - check inference service API key configuration",
            )

        # Input validation
        if not user_query or not user_query.strip():
            return LLMResponse(success=False, error="Query cannot be empty")

        # Sanitize and validate length
        user_query = user_query.strip()
        if len(user_query) > 1000:
            return LLMResponse(
                success=False, error="Query too long (maximum 1000 characters)"
            )

        # Remove null bytes and other potentially problematic characters
        user_query = user_query.replace("\x00", "")

        # Check cache first
        cache_key = self.cache.make_key("llm:interpret", {"query": user_query})
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for LLM interpretation: {user_query[:50]}...")
            cached_data = cached_result["data"]
            # Defensive check: if cached data is somehow a string, try to parse it
            # This should not happen with proper cache serialization
            if isinstance(cached_data, str):
                logger.warning(
                    "Unexpected string in cache data - attempting JSON parse"
                )
                try:
                    cached_data = json.loads(cached_data)
                except json.JSONDecodeError:
                    logger.error("Failed to parse cached data string as JSON")
                    # Treat as cache miss
                    cached_result = None
            if cached_result:
                return LLMResponse(
                    success=True,
                    data=DatasetQuery(**cached_data),
                    raw_response=cached_result.get("raw_response"),
                    tokens_used=cached_result.get("tokens_used"),
                    model_used=cached_result.get("model_used"),
                    cached=True,
                )

        try:
            logger.info(
                f"Starting hybrid interpretation of query: {user_query[:100]}..."
            )

            # PHASE 1: Use pre-initialized reasoning agent for understanding (with retry)
            reasoning_result = await self._call_agent_with_retry(
                self.reasoning_agent, user_query
            )
            logger.info(f"Reasoning output: {reasoning_result.output[:200]}...")

            # Check if the reasoning agent detected an invalid query
            if "INVALID_QUERY:" in reasoning_result.output:
                logger.info(f"Invalid query detected: {user_query}")
                # Return a response with low confidence and null values
                invalid_data = DatasetQuery(
                    organism=None,
                    taxonomy_id=None,
                    experiment_type=None,
                    library_strategy=None,
                    library_source=None,
                    sequencing_platform=None,
                    date_range=None,
                    keywords=[],
                    study_type=None,
                    assembly_level=None,
                    assembly_completeness=None,
                    confidence=0.0,
                )
                return LLMResponse(
                    success=False,
                    error="Invalid query: The provided query does not appear to be a valid bioinformatics search request.",
                    data=invalid_data,
                    raw_response=reasoning_result.output,
                    tokens_used=reasoning_result.usage().total_tokens
                    if hasattr(reasoning_result, "usage")
                    else 0,
                    model_used=self.settings.AI_PRIMARY_MODEL,
                )

            # PHASE 2: Use pre-initialized formatting agent to create structured JSON
            formatting_prompt = f"""Based on this analysis: {reasoning_result.output}

Create a JSON object with this EXACT structure:
{{
    "organism": "scientific name or null",
    "taxonomy_id": "string taxonomy ID or null",
    "experiment_type": "RNA-seq/DNA-seq/etc or null",
    "library_strategy": "RNA-Seq/WGS/etc or null",
    "library_source": null,
    "sequencing_platform": "Illumina/PacBio/etc or null",
    "date_range": {{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}} or null,
    "keywords": [],
    "study_type": null,
    "assembly_level": null,
    "assembly_completeness": null,
    "confidence": 0.9
}}

IMPORTANT: taxonomy_id must be a string (e.g., "5833") not a number

Return ONLY valid JSON, no markdown or explanations."""

            result = await self._call_agent_with_retry(
                self.formatting_agent, formatting_prompt
            )

            # Parse the JSON string output
            try:
                logger.info(f"Formatting agent output: {result.output[:200]}...")
                # Clean up the output in case it has markdown formatting
                json_str = self._clean_json_response(result.output)

                parsed_json = json.loads(json_str)
                data = DatasetQuery(**parsed_json)
                logger.info("Successfully parsed DatasetQuery from JSON")
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse JSON from formatting agent: {e}")
                logger.error(f"Raw output: {result.output}")
                return LLMResponse(
                    success=False,
                    error=f"Failed to parse LLM response as JSON: {str(e)}",
                )

            response = LLMResponse(
                success=True,
                data=data,  # Use the parsed/extracted data
                raw_response=f"Reasoning: {reasoning_result.output[:100]}...",
                tokens_used=(
                    reasoning_result.usage().total_tokens
                    if hasattr(reasoning_result, "usage")
                    else 0
                )
                + (result.usage().total_tokens if hasattr(result, "usage") else 0),
                model_used=f"{self.settings.AI_PRIMARY_MODEL} + {self.settings.AI_SECONDARY_MODEL}",
            )

            # Cache the result
            cache_data = {
                "data": data.model_dump() if hasattr(data, "model_dump") else str(data),
                "raw_response": response.raw_response,
                "tokens_used": response.tokens_used,
                "model_used": response.model_used,
            }
            await self.cache.set(cache_key, cache_data, ttl=CacheTTL.ONE_HOUR)

            logger.info(f"Successfully interpreted query: {user_query[:50]}...")
            return response

        except AgentRunError as e:
            logger.error(f"Pydantic AI error: {e}")
            return LLMResponse(
                success=False, error=f"LLM interpretation failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in LLM interpretation: {e}")
            return LLMResponse(success=False, error=f"Unexpected error: {str(e)}")

    async def suggest_workflows(
        self, request: WorkflowSuggestionRequest
    ) -> LLMResponse:
        """Suggest appropriate workflows for a dataset and analysis goal"""
        if not self.is_available():
            return LLMResponse(
                success=False,
                error="LLM service not available - check inference service API key configuration",
            )

        # Create cache key from request parameters
        cache_key = self.cache.make_key("llm:workflow", request.model_dump())
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            logger.info(
                f"Cache hit for workflow suggestion: {request.dataset_description[:50]}..."
            )
            recommendations = [
                WorkflowRecommendation(**rec) for rec in cached_result["data"]
            ]
            return LLMResponse(
                success=True,
                data=recommendations,
                raw_response=cached_result.get("raw_response"),
                tokens_used=cached_result.get("tokens_used"),
                model_used=cached_result.get("model_used"),
                cached=True,
            )

        try:
            # Get available workflows (filter by organism if specified)
            if self.workflow_catalog and request.organism_taxonomy_id:
                available_workflows = self.workflow_catalog.get_workflows_for_organism(
                    request.organism_taxonomy_id
                )
            elif self.workflow_catalog:
                available_workflows = self.workflow_catalog.workflows
            else:
                available_workflows = []

            # Create detailed prompt for workflow recommendation
            workflows_context = (
                json.dumps(available_workflows, indent=2)
                if available_workflows
                else "No workflows available"
            )

            prompt = f"""
            Available workflows in our catalog:
            {workflows_context}

            Dataset Description: {request.dataset_description}
            Analysis Goal: {request.analysis_goal}

            Additional Context:
            - Organism Taxonomy ID: {request.organism_taxonomy_id or "Not specified"}
            - Experiment Type: {request.experiment_type or "Not specified"}
            - Data Format: {request.data_format or "Not specified"}

            Please recommend 1-3 workflows from the above catalog that best match this analysis.
            IMPORTANT: You must ONLY recommend workflows that exist in the catalog above. Use the exact "id" value from the catalog as the workflow_id.
            """

            logger.info(
                f"Requesting workflow suggestions for: {request.dataset_description[:100]}..."
            )
            result = await self._call_agent_with_retry(self.workflow_agent, prompt)

            # Parse the JSON string output
            try:
                logger.info(f"Workflow output: {result.output[:200]}...")
                # Clean up the output in case it has markdown formatting
                json_str = self._clean_json_response(result.output)

                parsed = json.loads(json_str)
                # Create WorkflowRecommendation models from parsed JSON
                data = [WorkflowRecommendation(**rec) for rec in parsed]
                logger.info(
                    f"Successfully parsed {len(data)} workflow recommendations from JSON"
                )
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse workflow JSON: {e}")
                logger.error(f"Raw output: {result.output}")
                return LLMResponse(
                    success=False,
                    error=f"LLM returned invalid JSON: {result.output[:200]}",
                )

            response = LLMResponse(
                success=True,
                data=data,
                raw_response=str(result.output),
                tokens_used=result.usage().total_tokens
                if hasattr(result, "usage")
                else None,
                model_used=self.settings.AI_SECONDARY_MODEL,
            )

            # Cache the result
            cache_data = {
                "data": [rec.model_dump() for rec in data],
                "raw_response": response.raw_response,
                "tokens_used": response.tokens_used,
                "model_used": response.model_used,
            }
            await self.cache.set(cache_key, cache_data, ttl=CacheTTL.ONE_HOUR)

            logger.info(f"Successfully generated {len(data)} workflow recommendations")
            return response

        except AgentRunError as e:
            logger.error(f"Pydantic AI error in workflow suggestion: {e}")
            return LLMResponse(
                success=False, error=f"LLM workflow suggestion failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in workflow suggestion: {e}")
            return LLMResponse(success=False, error=f"Unexpected error: {str(e)}")
