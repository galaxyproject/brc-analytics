import logging
import traceback
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import check_rate_limit, get_ena_service, get_llm_service
from app.models.llm import WorkflowSuggestionRequest
from app.services.ena_service import ENAService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()


def group_results_by_study(results: list) -> list:
    """Group ENA results by study_accession"""
    if not results:
        return []

    # Group by study_accession
    studies = defaultdict(list)
    for result in results:
        study_accession = result.get("study_accession", "unknown")
        studies[study_accession].append(result)

    # Convert to list of study groups
    grouped = []
    for study_accession, runs in studies.items():
        grouped.append(
            {
                "study_accession": study_accession,
                "study_title": runs[0].get("study_title", "Unknown Study"),
                "run_count": len(runs),
                "runs": runs,
            }
        )

    # Sort by run count (descending) then by study accession
    grouped.sort(key=lambda x: (-x["run_count"], x["study_accession"]))

    return grouped


class DatasetSearchRequest(BaseModel):
    query: str
    max_results: int = 300
    include_metadata: bool = True


@router.post("/dataset-search")
async def natural_language_search(
    request: DatasetSearchRequest,
    llm_service: LLMService = Depends(get_llm_service),
    ena_service: ENAService = Depends(get_ena_service),
    _rate_limit: dict = Depends(check_rate_limit),
):
    """Search for datasets using natural language queries"""
    try:
        # Check if LLM service is available
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service is not available. Please check inference service API key configuration.",
            )

        # Interpret the natural language query
        interpretation_response = await llm_service.interpret_search_query(
            request.query
        )

        logger.info(f"LLM response success: {interpretation_response.success}")
        logger.info(f"LLM response data type: {type(interpretation_response.data)}")
        logger.info(f"LLM response data: {interpretation_response.data}")

        if not interpretation_response.success:
            raise HTTPException(status_code=400, detail=interpretation_response.error)

        interpretation = interpretation_response.data
        logger.info(f"Interpretation type: {type(interpretation)}")
        logger.info(f"Interpretation value: {interpretation}")

        # Additional validation: reject queries with very low confidence
        if interpretation.confidence < 0.3:
            raise HTTPException(
                status_code=400,
                detail=f"Query confidence too low ({interpretation.confidence:.2f}). Please provide a more specific bioinformatics-related query.",
            )

        # Search ENA based on interpretation
        ena_results = None
        search_method = None
        ena_error = None

        try:
            # Collect all search criteria
            search_keywords = []

            # Priority 1: If we have a taxonomy ID, use that for most specific results
            if interpretation.taxonomy_id:
                ena_results = await ena_service.search_by_taxonomy(
                    taxonomy_id=interpretation.taxonomy_id, limit=request.max_results
                )
                search_method = "taxonomy"
            else:
                # Build keyword list from all available fields
                if interpretation.organism:
                    search_keywords.append(interpretation.organism)

                # Use library_strategy if available, otherwise use experiment_type
                # (they often map to the same thing)
                if interpretation.library_strategy:
                    search_keywords.append(interpretation.library_strategy)
                elif interpretation.experiment_type:
                    search_keywords.append(interpretation.experiment_type)

                if interpretation.sequencing_platform:
                    search_keywords.append(interpretation.sequencing_platform)

                if interpretation.library_source:
                    search_keywords.append(interpretation.library_source)

                if interpretation.study_type:
                    search_keywords.append(interpretation.study_type)

                if interpretation.assembly_level:
                    search_keywords.append(interpretation.assembly_level)

                if interpretation.keywords:
                    search_keywords.extend(interpretation.keywords)

                # Search if we have any keywords
                if search_keywords:
                    ena_results = await ena_service.search_by_keywords(
                        keywords=search_keywords, limit=request.max_results
                    )
                    search_method = "keywords"
                else:
                    # No search criteria available
                    ena_results = {"data": [], "cached": False}
                    search_method = "none"
        except Exception as e:
            # If ENA search fails, still return the interpretation
            logger.warning(f"ENA search failed but returning interpretation: {e}")
            ena_results = {"data": [], "cached": False}
            search_method = "failed"
            ena_error = str(e)

        response_data = {
            "status": "success" if not ena_error else "partial",
            "query": request.query,
            "interpretation": {
                "organism": interpretation.organism,
                "taxonomy_id": interpretation.taxonomy_id,
                "experiment_type": interpretation.experiment_type,
                "library_strategy": interpretation.library_strategy,
                "library_source": interpretation.library_source,
                "sequencing_platform": interpretation.sequencing_platform,
                "date_range": interpretation.date_range,
                "keywords": interpretation.keywords,
                "study_type": interpretation.study_type,
                "assembly_level": interpretation.assembly_level,
                "assembly_completeness": interpretation.assembly_completeness,
                "confidence": interpretation.confidence,
            },
            "search_method": search_method,
            "results": ena_results["data"],
            "cached": ena_results["cached"],
            "count": len(ena_results["data"])
            if isinstance(ena_results["data"], list)
            else 0,
            "llm_tokens_used": interpretation_response.tokens_used,
        }

        # Add error information if ENA failed
        if ena_error:
            response_data["ena_error"] = ena_error

        # Include metadata if requested
        if request.include_metadata:
            response_data["metadata"] = {
                "model_used": interpretation_response.model_used,
                "interpretation_cached": interpretation_response.cached,
                "search_cached": ena_results["cached"],
            }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in dataset search: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error: {str(e)}"
        ) from e


@router.post("/workflow-suggest")
async def suggest_workflow(
    request: WorkflowSuggestionRequest,
    llm_service: LLMService = Depends(get_llm_service),
    _rate_limit: dict = Depends(check_rate_limit),
):
    """Get workflow recommendations based on dataset description and analysis goals"""
    try:
        # Check if LLM service is available
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service is not available. Please check inference service API key configuration.",
            )

        # Get workflow recommendations
        recommendation_response = await llm_service.suggest_workflows(request)

        if not recommendation_response.success:
            raise HTTPException(status_code=500, detail=recommendation_response.error)

        recommendations = recommendation_response.data

        return {
            "status": "success",
            "dataset_description": request.dataset_description,
            "analysis_goal": request.analysis_goal,
            "recommended_workflows": [
                {
                    "workflow_id": rec.workflow_id,
                    "workflow_name": rec.workflow_name,
                    "confidence": rec.confidence,
                    "reasoning": rec.reasoning,
                    "parameters": rec.parameters,
                    "compatibility_notes": rec.compatibility_notes,
                }
                for rec in recommendations
            ],
            "count": len(recommendations),
            "llm_tokens_used": recommendation_response.tokens_used,
            "model_used": recommendation_response.model_used,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Workflow suggestion failed: {str(e)}"
        ) from e


class UnifiedSearchRequest(BaseModel):
    query: str
    max_results: int = 300


@router.post("/unified-search")
async def unified_search(
    request: UnifiedSearchRequest,
    llm_service: LLMService = Depends(get_llm_service),
    ena_service: ENAService = Depends(get_ena_service),
    _rate_limit: dict = Depends(check_rate_limit),
):
    """
    Unified search endpoint that intelligently handles both data search and workflow suggestions.
    The LLM determines user intent and returns appropriate results.
    """
    try:
        # Check if LLM service is available
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service is not available. Please check API configuration.",
            )

        # Check for workflow intent first
        workflow_keywords = [
            "workflow",
            "pipeline",
            "analysis",
            "analyze",
            "process",
            "tool",
            "run",
            "execute",
        ]
        query_lower = request.query.lower()
        has_workflow_intent = any(kw in query_lower for kw in workflow_keywords)

        # Interpret the query to determine data search criteria
        interpretation_response = await llm_service.interpret_search_query(
            request.query
        )

        # If interpretation fails and there's no workflow intent, return error
        if not interpretation_response.success and not has_workflow_intent:
            raise HTTPException(status_code=400, detail=interpretation_response.error)

        # Get interpretation data if successful, otherwise use empty values
        interpretation = (
            interpretation_response.data if interpretation_response.success else None
        )

        # Initialize response structure
        response_data = {
            "status": "success",
            "query": request.query,
            "interpretation": {
                "organism": interpretation.organism if interpretation else None,
                "taxonomy_id": interpretation.taxonomy_id if interpretation else None,
                "experiment_type": interpretation.experiment_type
                if interpretation
                else None,
                "library_strategy": interpretation.library_strategy
                if interpretation
                else None,
                "library_source": interpretation.library_source
                if interpretation
                else None,
                "sequencing_platform": interpretation.sequencing_platform
                if interpretation
                else None,
                "date_range": interpretation.date_range if interpretation else None,
                "keywords": interpretation.keywords if interpretation else [],
                "study_type": interpretation.study_type if interpretation else None,
                "assembly_level": interpretation.assembly_level
                if interpretation
                else None,
                "assembly_completeness": interpretation.assembly_completeness
                if interpretation
                else None,
                "confidence": interpretation.confidence if interpretation else 0.0,
            },
            "datasets": None,
            "workflows": None,
            "llm_tokens_used": interpretation_response.tokens_used
            if interpretation_response.success
            else 0,
            "model_used": interpretation_response.model_used
            if interpretation_response.success
            else None,
        }

        # Check if we have data search criteria
        has_data_criteria = interpretation and (
            interpretation.taxonomy_id
            or interpretation.organism
            or interpretation.experiment_type
            or interpretation.keywords
        )

        # Search for datasets if we have data criteria
        if has_data_criteria:
            try:
                search_keywords = []
                search_method = None

                if interpretation.taxonomy_id:
                    ena_results = await ena_service.search_by_taxonomy(
                        taxonomy_id=interpretation.taxonomy_id,
                        limit=request.max_results,
                    )
                    search_method = "taxonomy"
                else:
                    if interpretation.organism:
                        search_keywords.append(interpretation.organism)
                    if interpretation.library_strategy:
                        search_keywords.append(interpretation.library_strategy)
                    elif interpretation.experiment_type:
                        search_keywords.append(interpretation.experiment_type)
                    if interpretation.sequencing_platform:
                        search_keywords.append(interpretation.sequencing_platform)
                    if interpretation.library_source:
                        search_keywords.append(interpretation.library_source)
                    if interpretation.study_type:
                        search_keywords.append(interpretation.study_type)
                    if interpretation.assembly_level:
                        search_keywords.append(interpretation.assembly_level)
                    if interpretation.keywords:
                        search_keywords.extend(interpretation.keywords)

                    if search_keywords:
                        ena_results = await ena_service.search_by_keywords(
                            keywords=search_keywords, limit=request.max_results
                        )
                        search_method = "keywords"
                    else:
                        ena_results = {"data": [], "cached": False}
                        search_method = "none"

                # Group results by study
                grouped_studies = group_results_by_study(ena_results["data"])

                response_data["datasets"] = {
                    "cached": ena_results["cached"],
                    "count": len(ena_results["data"])
                    if isinstance(ena_results["data"], list)
                    else 0,
                    "grouped_studies": grouped_studies,
                    "results": ena_results["data"],
                    "search_method": search_method,
                    "study_count": len(grouped_studies),
                }
            except Exception as e:
                logger.warning(f"Dataset search failed: {e}")
                response_data["datasets"] = {
                    "cached": False,
                    "count": 0,
                    "error": str(e),
                    "grouped_studies": [],
                    "results": [],
                    "search_method": "failed",
                    "study_count": 0,
                }

        # Suggest workflows if user intent includes workflow-related terms
        if has_workflow_intent:
            try:
                # Create a workflow suggestion request based on interpretation
                if interpretation:
                    dataset_description = f"{interpretation.organism or 'organism'} {interpretation.experiment_type or interpretation.library_strategy or 'sequencing'} data"
                else:
                    # No interpretation available, use generic description
                    dataset_description = "sequencing data"
                analysis_goal = request.query

                workflow_request = WorkflowSuggestionRequest(
                    dataset_description=dataset_description, analysis_goal=analysis_goal
                )

                recommendation_response = await llm_service.suggest_workflows(
                    workflow_request
                )

                if recommendation_response.success:
                    recommendations = recommendation_response.data
                    response_data["workflows"] = {
                        "recommended_workflows": [
                            {
                                "workflow_id": rec.workflow_id,
                                "workflow_name": rec.workflow_name,
                                "confidence": rec.confidence,
                                "reasoning": rec.reasoning,
                                "parameters": rec.parameters,
                                "compatibility_notes": rec.compatibility_notes,
                            }
                            for rec in recommendations
                        ],
                        "count": len(recommendations),
                        "llm_tokens_used": recommendation_response.tokens_used,
                    }
                    response_data["llm_tokens_used"] += (
                        recommendation_response.tokens_used
                    )
            except Exception as e:
                logger.warning(f"Workflow suggestion failed: {e}")
                response_data["workflows"] = {
                    "recommended_workflows": [],
                    "count": 0,
                    "error": str(e),
                }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in unified search: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error: {str(e)}"
        ) from e


@router.get("/health")
async def llm_health_check(llm_service: LLMService = Depends(get_llm_service)):
    """Check if LLM service is available and configured"""
    return {
        "status": "healthy" if llm_service.is_available() else "unavailable",
        "llm_available": llm_service.is_available(),
        "models_configured": {
            "primary": llm_service.primary_model is not None,
            "secondary": llm_service.secondary_model is not None,
        },
        "agents_initialized": {
            "reasoning_agent": llm_service.reasoning_agent is not None,
            "formatting_agent": llm_service.formatting_agent is not None,
            "workflow_agent": llm_service.workflow_agent is not None,
        },
        "workflow_catalog_loaded": llm_service.workflow_catalog is not None,
        "workflow_count": (
            llm_service.workflow_catalog.count() if llm_service.workflow_catalog else 0
        ),
    }
