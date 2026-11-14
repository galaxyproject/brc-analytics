"""Gene API: genes read from the gene snapshot, and BioNym's claims about them."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_bionym_graphs, get_gene_catalog_service
from app.models.genes import BionymClaims, BionymGraph, GeneResponse
from app.services.bionym_graphs import BionymGraphStore
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


@router.get("/{gene_uid}/bionym", response_model=BionymClaims)
def get_gene_bionym(
    gene_uid: UUID,
    graphs: BionymGraphStore = Depends(get_bionym_graphs),
) -> BionymClaims:
    """The claims in the gene's BioNym graph, grouped by source.

    Read from the graph alone, not the gene snapshot, so it answers while the
    snapshot is loading.
    """
    claims = graphs.get_claims(gene_uid)
    if claims is None:
        raise HTTPException(
            status_code=404, detail=f"Gene {gene_uid} has no BioNym graph"
        )
    return claims


@router.get("/{gene_uid}/bionym/graph", response_model=BionymGraph)
def get_gene_bionym_graph(
    gene_uid: UUID,
    graphs: BionymGraphStore = Depends(get_bionym_graphs),
) -> BionymGraph:
    """Every node and edge in the gene's BioNym graph, for the gene page's
    graph explorer. Like the claims, read from the graph alone."""
    graph = graphs.get_graph(gene_uid)
    if graph is None:
        raise HTTPException(
            status_code=404, detail=f"Gene {gene_uid} has no BioNym graph"
        )
    return graph
