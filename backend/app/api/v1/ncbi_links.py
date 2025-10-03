"""API endpoints for NCBI cross-linking."""

from fastapi import APIRouter, Depends

from app.core.cache import CacheService, CacheTTL
from app.core.dependencies import get_cache_service
from app.services.ncbi_links_service import NCBILinksService

router = APIRouter()


@router.get("/organism-links.json")
async def get_organism_links(cache: CacheService = Depends(get_cache_service)):
    """Get organism links by taxonomy ID for NCBI cross-referencing"""
    cache_key = "ncbi_links:organisms"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = NCBILinksService()
    links = service.get_organism_links()
    await cache.set(cache_key, links, ttl=CacheTTL.ONE_DAY)

    return links


@router.get("/assembly-links.json")
async def get_assembly_links(cache: CacheService = Depends(get_cache_service)):
    """Get assembly links by accession for NCBI cross-referencing"""
    cache_key = "ncbi_links:assemblies"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    service = NCBILinksService()
    links = service.get_assembly_links()
    await cache.set(cache_key, links, ttl=CacheTTL.ONE_DAY)

    return links
