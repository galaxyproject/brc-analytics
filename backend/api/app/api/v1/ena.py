from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.cache import CacheService
from app.core.dependencies import get_cache_service
from app.services.ena_service import ENAService

router = APIRouter()


async def get_ena_service(
    cache: CacheService = Depends(get_cache_service),
) -> ENAService:
    """Dependency to get ENA service instance"""
    return ENAService(cache)


@router.get("/taxonomy/{taxonomy_id}")
async def search_by_taxonomy(
    taxonomy_id: str,
    limit: int = Query(default=100, le=1000, ge=1),
    use_cache: bool = Query(default=True),
    ena_service: ENAService = Depends(get_ena_service),
):
    """Search for sequencing data by taxonomy ID"""
    try:
        result = await ena_service.search_by_taxonomy(
            taxonomy_id=taxonomy_id, limit=limit, use_cache=use_cache
        )

        return {
            "status": "success",
            "taxonomy_id": taxonomy_id,
            "results": result["data"],
            "cached": result["cached"],
            "count": len(result["data"]) if isinstance(result["data"], list) else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/accession/{accession}")
async def get_by_accession(
    accession: str,
    result_type: str = Query(
        default="read_run", regex="^(read_run|study|sample|experiment)$"
    ),
    use_cache: bool = Query(default=True),
    ena_service: ENAService = Depends(get_ena_service),
):
    """Get sequencing data by accession number"""
    try:
        result = await ena_service.get_by_accession(
            accession=accession, result_type=result_type, use_cache=use_cache
        )

        return {
            "status": "success",
            "accession": accession,
            "result_type": result_type,
            "results": result["data"],
            "cached": result["cached"],
            "count": len(result["data"]) if isinstance(result["data"], list) else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/search")
async def search_by_keywords(
    keywords: str = Query(..., description="Comma-separated keywords to search for"),
    limit: int = Query(default=100, le=1000, ge=1),
    use_cache: bool = Query(default=True),
    ena_service: ENAService = Depends(get_ena_service),
):
    """Search for sequencing data by keywords"""
    try:
        # Parse keywords from comma-separated string
        keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]

        if not keyword_list:
            raise HTTPException(
                status_code=400, detail="At least one keyword is required"
            )

        result = await ena_service.search_by_keywords(
            keywords=keyword_list, limit=limit, use_cache=use_cache
        )

        return {
            "status": "success",
            "keywords": keyword_list,
            "results": result["data"],
            "cached": result["cached"],
            "count": len(result["data"]) if isinstance(result["data"], list) else 0,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/study/{study_accession}")
async def get_study_info(
    study_accession: str,
    use_cache: bool = Query(default=True),
    ena_service: ENAService = Depends(get_ena_service),
):
    """Get detailed study information by study accession"""
    try:
        result = await ena_service.get_study_info(
            study_accession=study_accession, use_cache=use_cache
        )

        return {
            "status": "success",
            "study_accession": study_accession,
            "results": result["data"],
            "cached": result["cached"],
            "count": len(result["data"]) if isinstance(result["data"], list) else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
