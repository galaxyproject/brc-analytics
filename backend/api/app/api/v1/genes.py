"""Gene API: genes read from the gene snapshot."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_gene_catalog_service
from app.models.genes import GeneResponse
from app.services.gene_catalog import GeneCatalogService

router = APIRouter()


@router.get("/{gene_uid}", response_model=GeneResponse)
def get_gene(
    gene_uid: UUID,
    service: GeneCatalogService = Depends(get_gene_catalog_service),
) -> GeneResponse:
    """One gene, by its gene UID."""
    if service.snapshot is None:
        raise HTTPException(status_code=503, detail="Gene data is unavailable")
    gene = service.get_gene(gene_uid)
    if gene is None:
        raise HTTPException(status_code=404, detail=f"Gene {gene_uid} not found")
    return GeneResponse(snapshot=service.snapshot, gene=gene)
