"""API endpoints for assemblies and organisms links."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.cache import CacheService, CacheTTL
from app.core.dependencies import get_cache_service
from app.services.links_service import LinksService

router = APIRouter()



@router.get("/assemblies/links")
async def get_assemblies_links(cache: CacheService = Depends(get_cache_service)):
    """Get all assembly links for cross-referencing."""
    cache_key = "v1:assemblies:links"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = LinksService()
    response = service.get_assemblies_links()
    await cache.set(cache_key, response, ttl=CacheTTL.ONE_DAY)

    return response


@router.get("/assemblies/links/{accession}")
async def get_assembly_link(
    accession: str, cache: CacheService = Depends(get_cache_service)
):
    """Get a single assembly link by accession."""
    cache_key = f"v1:assemblies:links:{accession}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = LinksService()
    result = service.get_assembly_link(accession)

    if result is None:
        raise HTTPException(status_code=404, detail=f"Assembly {accession} not found")

    await cache.set(cache_key, result, ttl=CacheTTL.ONE_DAY)

    return result


@router.get("/organisms/links")
async def get_organisms_links(cache: CacheService = Depends(get_cache_service)):
    """Get all organism links for cross-referencing."""
    cache_key = "v1:organisms:links"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = LinksService()
    response = service.get_organisms_links()
    await cache.set(cache_key, response, ttl=CacheTTL.ONE_DAY)

    return response


@router.get("/organisms/links/{taxon_id}")
async def get_organism_link(
    taxon_id: int, cache: CacheService = Depends(get_cache_service)
):
    """Get a single organism link by NCBI taxonomy ID."""
    cache_key = f"v1:organisms:links:{taxon_id}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = LinksService()
    result = service.get_organism_link(taxon_id)

    if result is None:
        raise HTTPException(status_code=404, detail=f"Organism {taxon_id} not found")

    await cache.set(cache_key, result, ttl=CacheTTL.ONE_DAY)

    return result
