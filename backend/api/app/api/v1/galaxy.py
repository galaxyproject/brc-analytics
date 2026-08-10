"""Galaxy API integration endpoints."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.cache import CacheService
from app.core.dependencies import (
    check_rate_limit,
    check_submit_rate_limit,
    get_cache_service,
    get_sra_mirror_service,
)
from app.models.galaxy import (
    GalaxyJobResponse,
    GalaxyJobResult,
    GalaxyJobStatus,
    GalaxyJobSubmission,
    KmindexQuerySubmission,
    KmindexResults,
)
from app.services.galaxy_service import GalaxyService
from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_galaxy_service(
    cache: CacheService = Depends(get_cache_service),
    sra_mirror: Optional[SRAMirrorService] = Depends(get_sra_mirror_service),
) -> GalaxyService:
    """Dependency to get Galaxy service instance."""
    return GalaxyService(cache, sra_mirror=sra_mirror)


@router.get("/health")
async def galaxy_health(galaxy_service: GalaxyService = Depends(get_galaxy_service)):
    """Check Galaxy service health and configuration."""
    return {
        "status": "healthy" if galaxy_service.is_available() else "unavailable",
        "galaxy_configured": galaxy_service.is_available(),
        "api_url": galaxy_service.settings.GALAXY_API_URL,
        "upload_tool_id": galaxy_service.settings.GALAXY_UPLOAD_TOOL_ID,
        "random_lines_tool_id": galaxy_service.settings.GALAXY_RANDOM_LINES_TOOL_ID,
    }


@router.post("/submit-job", response_model=GalaxyJobResponse)
async def submit_galaxy_job(
    submission: GalaxyJobSubmission,
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
    _submit_limit=Depends(check_submit_rate_limit),
):
    """
    Submit a job to Galaxy: upload tabular data and run random lines tool.

    Returns job ID for tracking the random lines tool execution.
    """
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Galaxy service is not available. Please check configuration.",
            )

        # Validate input data
        if not submission.tabular_data.strip():
            raise HTTPException(status_code=400, detail="Tabular data cannot be empty")

        if submission.num_random_lines <= 0:
            raise HTTPException(
                status_code=400, detail="Number of random lines must be greater than 0"
            )

        # Check if data has multiple lines
        lines = submission.tabular_data.strip().split("\n")
        if len(lines) < submission.num_random_lines:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot select {submission.num_random_lines} lines "
                    f"from {len(lines)} lines of data"
                ),
            )

        logger.info(
            f"Submitting Galaxy job with {len(lines)} lines of data, "
            f"selecting {submission.num_random_lines} random lines"
        )

        # Submit job to Galaxy
        response = await galaxy_service.submit_job(submission)

        logger.info(f"Galaxy job submitted successfully: {response.job_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit Galaxy job: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to submit job to Galaxy: {str(e)}"
        ) from e


@router.get("/kmindex/indexes")
async def list_kmindex_indexes(
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """List the Logan/kmindex indexes available on the Galaxy instance."""
    if not galaxy_service.is_available():
        raise HTTPException(status_code=503, detail="Galaxy service is not available")

    try:
        indexes = await galaxy_service.list_kmindex_indexes()
        return {"count": len(indexes), "indexes": indexes}
    except Exception as e:
        logger.error(f"Failed to list kmindex indexes: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to list kmindex indexes: {str(e)}"
        ) from e


@router.post("/kmindex/submit", response_model=GalaxyJobResponse)
async def submit_kmindex_query(
    submission: KmindexQuerySubmission,
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
    _submit_limit=Depends(check_submit_rate_limit),
):
    """Submit a Logan/kmindex sequence search. Poll the returned job_id for status."""
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Galaxy service is not available. Please check configuration.",
            )

        if not submission.sequence.strip():
            raise HTTPException(
                status_code=400, detail="Query sequence cannot be empty"
            )

        response = await galaxy_service.submit_kmindex_query(submission)
        logger.info(f"kmindex query submitted successfully: {response.job_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit kmindex query: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to submit kmindex query: {str(e)}"
        ) from e


@router.get("/kmindex/jobs/{job_id}/results", response_model=KmindexResults)
async def get_kmindex_results(
    job_id: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """
    Get merged, score-ranked hits from a completed kmindex query.

    kmindex writes one JSON per index shard; this unions them into a single
    ranked list so callers don't have to fetch and merge dozens of datasets.
    """
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503, detail="Galaxy service is not available"
            )

        return await galaxy_service.get_kmindex_results(job_id, limit, offset)

    except HTTPException:
        raise
    except Exception as e:
        if "not yet complete" in str(e):
            raise HTTPException(status_code=202, detail=str(e)) from e
        if "failed" in str(e).lower():
            raise HTTPException(status_code=422, detail=str(e)) from e
        logger.error(f"Failed to get kmindex results for {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get kmindex results: {str(e)}"
        ) from e


@router.get("/jobs/{job_id}/status", response_model=GalaxyJobStatus)
async def get_job_status(
    job_id: str,
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """Get the current status of a Galaxy job."""
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503, detail="Galaxy service is not available"
            )

        logger.debug(f"Getting status for job: {job_id}")
        status = await galaxy_service.get_job_status(job_id)

        return status

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status for {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get job status: {str(e)}"
        ) from e


@router.get("/jobs/{job_id}/results", response_model=GalaxyJobResult)
async def get_job_results(
    job_id: str,
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """Get the complete results from a finished Galaxy job."""
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503, detail="Galaxy service is not available"
            )

        logger.debug(f"Getting results for job: {job_id}")
        results = await galaxy_service.get_job_results(job_id)

        return results

    except HTTPException:
        raise
    except Exception as e:
        # Check if it's a "job not complete" error
        if "not yet complete" in str(e):
            raise HTTPException(
                status_code=202,  # Accepted but processing not complete
                detail=str(e),
            ) from e
        elif "failed" in str(e).lower():
            raise HTTPException(
                status_code=422,  # Unprocessable Entity - job failed
                detail=str(e),
            ) from e
        else:
            logger.error(f"Failed to get job results for {job_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to get job results: {str(e)}"
            ) from e


@router.get("/jobs/{job_id}", response_model=Dict[str, Any])
async def get_job_details(
    job_id: str,
    include_results: bool = False,
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """
    Get comprehensive job information including status and optionally results.

    This is a convenience endpoint that combines status and results.
    """
    try:
        if not galaxy_service.is_available():
            raise HTTPException(
                status_code=503, detail="Galaxy service is not available"
            )

        # Always get status
        status = await galaxy_service.get_job_status(job_id)

        response = {"job_id": job_id, "status": status.model_dump()}

        # Include results if requested and job is complete
        if include_results and status.is_complete and status.is_successful:
            try:
                results = await galaxy_service.get_job_results(job_id)
                response["results"] = results.model_dump()
            except Exception as e:
                logger.warning(f"Failed to get results for completed job {job_id}: {e}")
                response["results_error"] = str(e)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job details for {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get job details: {str(e)}"
        ) from e


@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str, galaxy_service: GalaxyService = Depends(get_galaxy_service)
):
    """Cancel a running Galaxy job (future implementation)."""
    # Note: This would require implementing job cancellation in GalaxyService
    # For now, just return a placeholder response
    raise HTTPException(status_code=501, detail="Job cancellation not yet implemented")


# Example endpoint for testing Galaxy connectivity
@router.post("/test-connection")
async def test_galaxy_connection(
    galaxy_service: GalaxyService = Depends(get_galaxy_service),
    _rate_limit=Depends(check_rate_limit),
):
    """Test connection to Galaxy API (admin/debug endpoint)."""
    try:
        if not galaxy_service.is_available():
            return {
                "status": "error",
                "message": "Galaxy service not configured",
                "configured": False,
            }

        # Try a simple API call to test connectivity
        # This could be improved to actually test API access
        return {
            "status": "success",
            "message": "Galaxy service is configured and available",
            "configured": True,
            "api_url": galaxy_service.settings.GALAXY_API_URL,
        }

    except Exception as e:
        logger.error(f"Galaxy connection test failed: {e}")
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "configured": True,
        }
