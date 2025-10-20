import logging
import os
from typing import Any, Dict, List, Optional

from pydantic_ai import Agent
from pydantic_ai.exceptions import AgentRunError
from pydantic_ai.models.openai import OpenAIChatModel

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.models.llm import (
    DatasetQuery,
    LLMResponse,
    WorkflowRecommendation,
    WorkflowSuggestionRequest,
)
from app.services.sambanova_patch import patch_sambanova_compatibility

# Apply SambaNova compatibility patch
patch_sambanova_compatibility()

logger = logging.getLogger(__name__)


class LLMService:
    """Service for handling LLM interactions using pydantic-ai"""

    def __init__(self, cache: CacheService):
        self.cache = cache
        self.settings = get_settings()

        if not self.settings.AI_API_KEY:
            logger.warning("AI API key not configured - LLM features will be disabled")
            self.reasoning_model = None
            self.formatting_model = None
            self.model = None
            self.search_agent = None
            self.workflow_agent = None
            return

        try:
            # Initialize AI models using environment variables
            # Set OpenAI-compatible environment variables for pydantic-ai
            os.environ["OPENAI_API_KEY"] = self.settings.AI_API_KEY

            # Configure base URL if provided (for LiteLLM proxy or custom endpoints)
            if self.settings.AI_API_BASE_URL:
                os.environ["OPENAI_BASE_URL"] = self.settings.AI_API_BASE_URL
                logger.info(
                    f"Using custom AI API base URL: {self.settings.AI_API_BASE_URL}"
                )

            # Initialize models for hybrid approach
            self.reasoning_model = OpenAIChatModel(self.settings.AI_REASONING_MODEL)
            self.formatting_model = OpenAIChatModel(self.settings.AI_FORMATTING_MODEL)
            self.model = self.formatting_model  # Default to formatting model

            logger.info(f"Initialized hybrid models:")
            logger.info(f"  Reasoning: {self.settings.AI_REASONING_MODEL}")
            logger.info(f"  Formatting: {self.settings.AI_FORMATTING_MODEL}")

            # Initialize search interpretation agent
            self.search_agent = Agent[DatasetQuery](
                self.model,
                system_prompt="""
                You are a bioinformatics assistant that helps researchers find sequencing datasets. 
                
                Parse natural language queries and extract structured search parameters for the European Nucleotide Archive (ENA).
                
                You MUST respond with ONLY a valid JSON object matching this exact structure, with no additional text:
                {
                    "organism": "scientific name or null",
                    "taxonomy_id": "NCBI taxonomy ID or null",
                    "experiment_type": "RNA-seq/DNA-seq/ChIP-seq/ATAC-seq or null",
                    "library_strategy": "WGS/WXS/RNA-Seq/ChIP-Seq or null",
                    "sequencing_platform": "Illumina/PacBio/Oxford Nanopore/Ion Torrent or null",
                    "date_range": {"start": "YYYY-MM-DD or null", "end": "YYYY-MM-DD or null"} or null,
                    "keywords": ["keyword1", "keyword2"] or [],
                    "assembly_level": "Complete Genome/Chromosome/Scaffold/Contig or null",
                    "assembly_completeness": "complete/draft/incomplete or null",
                    "confidence": 0.0 to 1.0
                }
                
                Guidelines:
                - Extract organism names and convert to scientific names when possible
                - Identify experiment types (RNA-seq, DNA-seq, ChIP-seq, ATAC-seq, WGS, WXS, etc.)
                - Recognize library strategies (WGS, WXS, RNA-Seq, ChIP-Seq, etc.) 
                - Identify sequencing platforms/technologies (Illumina, PacBio, Oxford Nanopore, Ion Torrent, 454, SOLiD)
                - Identify assembly level queries (Complete Genome, Chromosome, Scaffold, Contig)
                - Parse date ranges from natural language (e.g., "from 2023" = {"start": "2023-01-01", "end": "2023-12-31"})
                - Extract relevant keywords including technology terms, strain names, conditions, assembly completeness
                - Set confidence based on how well you understand the query (0.0 to 1.0)
                
                Common organism mappings:
                - "malaria", "malaria parasite" → "Plasmodium falciparum" (taxonomy_id: "5833")
                - "tuberculosis", "TB" → "Mycobacterium tuberculosis" (taxonomy_id: "1773")
                - "E. coli" → "Escherichia coli" (taxonomy_id: "562")
                - "yeast" → "Saccharomyces cerevisiae" (taxonomy_id: "4932")
                - "Candida" → "Candida albicans" (taxonomy_id: "5476") or "Candida auris" (taxonomy_id: "498019")
                - "Aspergillus" → "Aspergillus fumigatus" (taxonomy_id: "746128")
                - "Cryptococcus" → "Cryptococcus neoformans" (taxonomy_id: "5207")
                
                IMPORTANT: For malaria/Plasmodium, default to "Plasmodium falciparum" not "Plasmodium spp."
                Include taxonomy IDs when you know them, as they provide more accurate searches.
                
                CRITICAL: Return ONLY the JSON object, no explanations or additional text.
                """,
            )

            # Initialize workflow recommendation agent
            self.workflow_agent = Agent[List[WorkflowRecommendation]](
                self.model,
                system_prompt="""
                You are a bioinformatics workflow expert helping researchers choose appropriate analysis pipelines.
                
                Based on dataset characteristics and analysis goals, recommend suitable workflows from common bioinformatics pipelines.
                
                You MUST respond with ONLY a valid JSON array of workflow recommendations, with no additional text:
                [
                    {
                        "workflow_name": "workflow name",
                        "reason": "why this workflow is suitable",
                        "confidence": 0.0 to 1.0,
                        "parameters": {"param1": "value1"} or {}
                    }
                ]
                
                Consider:
                - Data type (RNA-seq, DNA-seq, ChIP-seq, ATAC-seq, etc.)
                - Organism type (prokaryotic vs eukaryotic, model vs non-model)
                - Analysis goals (differential expression, variant calling, peak calling, etc.)
                - Data format and quality
                - Computational requirements
                
                Common workflow types:
                - RNA-seq: salmon, kallisto, HISAT2-StringTie, STAR-RSEM
                - DNA-seq: BWA-GATK, Bowtie2, minimap2
                - ChIP-seq: MACS2, SICER, HOMER
                - ATAC-seq: MACS2, genrich
                - Variant calling: GATK, FreeBayes, bcftools
                
                Provide 1-3 recommendations ranked by confidence, with clear reasoning.
                
                CRITICAL: Return ONLY the JSON array, no explanations or additional text.
                """,
            )

            logger.info("LLM service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            self.reasoning_model = None
            self.formatting_model = None
            self.model = None
            self.search_agent = None
            self.workflow_agent = None

    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.reasoning_model is not None and self.formatting_model is not None

    async def interpret_search_query(self, user_query: str) -> LLMResponse:
        """Interpret a natural language search query into structured parameters using hybrid approach"""
        if not self.is_available():
            return LLMResponse(
                success=False,
                error="LLM service not available - check OpenAI API key configuration",
            )

        # Check cache first
        cache_key = self.cache.make_key("llm:interpret", {"query": user_query})
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for LLM interpretation: {user_query[:50]}...")
            # Handle cached data which might be a string (JSON) or dict
            cached_data = cached_result["data"]
            if isinstance(cached_data, str):
                import json

                cached_data = json.loads(cached_data)
            return LLMResponse(
                success=True,
                data=DatasetQuery(**cached_data),
                raw_response=cached_result.get("raw_response"),
                tokens_used=cached_result.get("tokens_used"),
                model_used=cached_result.get("model_used"),
            )

        try:
            logger.info(
                f"Starting hybrid interpretation of query: {user_query[:100]}..."
            )

            # PHASE 1: Use reasoning model for understanding
            reasoning_agent = Agent[str](
                self.reasoning_model,
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

            reasoning_result = await reasoning_agent.run(user_query)
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
                    model_used=self.settings.AI_REASONING_MODEL,
                )

            # PHASE 2: Use formatting model to create structured JSON
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

CONFIDENCE SCORING:
- Set confidence to 0.0-0.2 if the query is nonsense, gibberish, or completely unrelated to bioinformatics
- Set confidence to 0.3-0.5 if the query is vague or ambiguous 
- Set confidence to 0.6-0.8 if the query has some clear bioinformatics terms but missing details
- Set confidence to 0.9-1.0 if the query is specific and clearly describes a bioinformatics search

IMPORTANT: taxonomy_id must be a string (e.g., "5833") not a number

Return ONLY valid JSON, no markdown or explanations."""

            # Use plain Agent[str] and parse JSON manually
            formatting_agent = Agent[str](
                self.formatting_model,
                system_prompt="""You are a JSON formatting assistant. 
                Convert the analysis into a structured DatasetQuery JSON object.
                
                Return a JSON object with these exact fields:
                - organism: scientific name or null
                - taxonomy_id: NCBI taxonomy ID or null  
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
                
                Output ONLY the JSON object, no markdown, no backticks, no explanations.""",
            )

            result = await formatting_agent.run(formatting_prompt)

            # Parse the JSON string output
            import json

            try:
                logger.info(f"Formatting agent output: {result.output[:200]}...")
                # Clean up the output in case it has markdown formatting
                json_str = result.output.strip()
                if json_str.startswith("```"):
                    # Remove markdown code blocks
                    json_str = json_str.split("```")[1]
                    if json_str.startswith("json"):
                        json_str = json_str[4:]
                    json_str = json_str.strip()

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
                model_used=f"{self.settings.AI_REASONING_MODEL} + {self.settings.AI_FORMATTING_MODEL}",
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
                error="LLM service not available - check OpenAI API key configuration",
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
            )

        try:
            # Create detailed prompt for workflow recommendation
            prompt = f"""
            Dataset Description: {request.dataset_description}
            Analysis Goal: {request.analysis_goal}
            
            Additional Context:
            - Organism Taxonomy ID: {request.organism_taxonomy_id or "Not specified"}
            - Experiment Type: {request.experiment_type or "Not specified"}
            - Data Format: {request.data_format or "Not specified"}
            
            Please recommend 1-3 appropriate bioinformatics workflows for this analysis, ranked by suitability.
            """

            logger.info(
                f"Requesting workflow suggestions for: {request.dataset_description[:100]}..."
            )
            result = await self.workflow_agent.run(prompt)

            # Handle string vs model output
            if isinstance(result.output, str):
                # Try to parse as JSON if it's a string
                import json

            try:
                logger.info(f"Workflow output: {result.output[:200]}...")
                # Clean up the output in case it has markdown formatting
                json_str = result.output.strip()
                if json_str.startswith("```"):
                    # Remove markdown code blocks
                    json_str = json_str.split("```")[1]
                    if json_str.startswith("json"):
                        json_str = json_str[4:]
                    json_str = json_str.strip()

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
                data=data,  # Use the parsed/extracted data
                raw_response=str(result.output),
                tokens_used=result.usage().total_tokens
                if hasattr(result, "usage")
                else None,
                model_used=self.settings.AI_MODEL,
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
