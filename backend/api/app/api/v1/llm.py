import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.cache import CacheService
from app.core.dependencies import get_cache_service
from app.models.llm import WorkflowSuggestionRequest
from app.services.ena_service import ENAService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()


class DatasetSearchRequest(BaseModel):
    query: str
    max_results: int = 100
    include_metadata: bool = True


async def get_llm_service(
    cache: CacheService = Depends(get_cache_service),
) -> LLMService:
    """Dependency to get LLM service instance"""
    logger.info("Creating LLM service instance...")
    service = LLMService(cache)
    logger.info(f"LLM service created, available: {service.is_available()}")
    return service


async def get_ena_service(
    cache: CacheService = Depends(get_cache_service),
) -> ENAService:
    """Dependency to get ENA service instance"""
    return ENAService(cache)


@router.post("/dataset-search")
async def natural_language_search(
    request: DatasetSearchRequest,
    llm_service: LLMService = Depends(get_llm_service),
    ena_service: ENAService = Depends(get_ena_service),
):
    """Search for datasets using natural language queries"""
    try:
        # Check if LLM service is available
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service is not available. Please check OpenAI API key configuration.",
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
        import sys
        import traceback

        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        tb_text = "".join(tb_lines)

        print(f"===== DATASET SEARCH ERROR =====", file=sys.stderr)
        print(f"Error: {e}", file=sys.stderr)
        print(f"Error type: {type(e)}", file=sys.stderr)
        print(f"Traceback:", file=sys.stderr)
        print(tb_text, file=sys.stderr)
        print(f"===== END ERROR =====", file=sys.stderr)

        logger.error(f"Unexpected error in dataset search: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/workflow-suggest")
async def suggest_workflow(
    request: WorkflowSuggestionRequest,
    llm_service: LLMService = Depends(get_llm_service),
):
    """Get workflow recommendations based on dataset description and analysis goals"""
    try:
        # Check if LLM service is available
        if not llm_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="LLM service is not available. Please check OpenAI API key configuration.",
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
        )


@router.get("/health")
async def llm_health_check(llm_service: LLMService = Depends(get_llm_service)):
    """Check if LLM service is available and configured"""
    return {
        "status": "healthy" if llm_service.is_available() else "unavailable",
        "llm_available": llm_service.is_available(),
        "model_configured": llm_service.model is not None,
        "agents_initialized": {
            "search_agent": llm_service.search_agent is not None,
            "workflow_agent": llm_service.workflow_agent is not None,
        },
    }
