"""Galaxy API integration endpoints."""

import asyncio
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse, StreamingResponse

from app.core.cache import CacheService
from app.core.config import get_settings
from app.core.dependencies import (
    check_rate_limit,
    check_submit_rate_limit,
    get_cache_service,
    get_galaxy_credential,
    get_sra_mirror_service,
)
from app.core.galaxy_credential import GalaxyCredential
from app.db.crud import create_galaxy_job, get_user_by_keycloak_sub
from app.db.session import db_session
from app.models.galaxy import (
    GalaxyJobResponse,
    GalaxyJobResult,
    GalaxyJobStatus,
    GalaxyJobSubmission,
    KmindexQuerySubmission,
    KmindexResults,
)
from app.services.galaxy_service import GalaxyService
from app.services.sra_mirror import (
    SRAMirrorService,
    export_download_name,
    export_file_path,
    export_row_count,
    iter_export_tsv,
)

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_galaxy_service(
    cache: CacheService = Depends(get_cache_service),
    sra_mirror: Optional[SRAMirrorService] = Depends(get_sra_mirror_service),
    credential: Optional[GalaxyCredential] = Depends(get_galaxy_credential),
) -> GalaxyService:
    """Dependency to get Galaxy service instance."""
    return GalaxyService(cache, sra_mirror=sra_mirror, credential=credential)


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

        credential = galaxy_service.credential
        if (
            credential is not None
            and credential.kind == "user"
            and get_settings().DATABASE_URL
        ):
            # Lazy DB access on purpose: a Depends(get_db_session) here would
            # 500 this anonymous-capable route wherever DATABASE_URL is unset.
            try:
                async with db_session() as db:
                    user = await get_user_by_keycloak_sub(db, credential.user_sub)
                    if user is not None:
                        await create_galaxy_job(
                            db,
                            user_id=user.id,
                            galaxy_job_id=response.job_id,
                            galaxy_instance_url=(
                                galaxy_service.settings.GALAXY_API_URL.replace(
                                    "/api", ""
                                )
                            ),
                            tool="kmindex",
                            params={"indexes": submission.indexes},
                        )
                        await db.commit()
            except Exception:
                logger.exception(
                    "Failed to record ownership for job %s", response.job_id
                )

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


@router.get("/kmindex/jobs/{job_id}/export")
async def export_kmindex_results(
    job_id: str,
    format: str = Query(default="parquet", pattern="^(parquet|tsv)$"),
    _rate_limit=Depends(check_rate_limit),
) -> Response:
    """
    Download every hit a kmindex query matched, joined to its SRA metadata.

    This is the whole match set, not the 50,000 the results endpoint pages and
    not the 25 rows it annotates -- on a real job, 1,133,516 rows against a
    displayed 50,000. It was written once during aggregation, which is the only
    moment the full list exists, so this only ever serves a finished file and
    never touches Galaxy.

    parquet is the file as materialized, served byte for byte (16 MB on the
    measured job). tsv is converted on the way out for anything that wants a
    plain text table, and streams rather than being assembled in memory -- the
    same rows are 168 MB as text.

    @param job_id: the completed kmindex job.
    @param format: parquet or tsv.
    @returns: the export as an attachment, named for the job and its row count.
    """
    path = export_file_path(get_settings().KMINDEX_EXPORT_DIR, job_id)
    if path is None or not path.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"No downloadable export for job {job_id}",
        )

    try:
        # Read from the parquet footer, so the count in the filename describes
        # the bytes being sent rather than a cache entry that outlived them.
        rows = await asyncio.to_thread(export_row_count, path)
    except Exception as e:
        # Only reachable if the file is corrupt, which the write's rename-into-
        # place is meant to prevent. Nothing the caller can do differently, so
        # it reads as absent to them and as an error in the log.
        logger.error(f"kmindex export for {job_id} is unreadable: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"No downloadable export for job {job_id}",
        ) from e

    if format == "tsv":
        filename = export_download_name(job_id, rows, "tsv")
        return StreamingResponse(
            iter_export_tsv(path),
            media_type="text/tab-separated-values",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    return FileResponse(
        path,
        media_type="application/vnd.apache.parquet",
        filename=export_download_name(job_id, rows, "parquet"),
    )


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
