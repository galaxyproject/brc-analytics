"""Gene API: genes read from the gene snapshot, and BioNym's claims about them."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_bionym_graphs, get_gene_catalog_service
from app.models.genes import BionymClaims, GeneResponse, GeneSearchResponse
from app.services.bionym_graphs import BionymGraphStore
from app.services.gene_catalog import GeneCatalogService

router = APIRouter()

DEFAULT_SEARCH_LIMIT = 10
MAX_SEARCH_LIMIT = 50
MAX_SEARCH_LENGTH = 200
MAX_SEARCH_WORDS = 10


# Declared before /{gene_uid}, which would otherwise take "search" as a UID.
@router.get("/search", response_model=GeneSearchResponse)
def search_genes(
    q: str = Query(
        ...,
        max_length=MAX_SEARCH_LENGTH,
        description="Words that start a gene's IDs or its products' words",
    ),
    assembly: Optional[str] = Query(None, description="An assembly accession"),
    limit: int = Query(DEFAULT_SEARCH_LIMIT, ge=1, le=MAX_SEARCH_LIMIT),
    service: GeneCatalogService = Depends(get_gene_catalog_service),
) -> GeneSearchResponse:
    """Genes found by prefix of their IDs, symbols, or their products' words.

    Case-insensitive, and surrounding punctuation is ignored. Each word must
    match a term of the gene: the last may be the start of one, the others
    must be whole. In a query of several words, stop words and words of 1 or
    2 characters are left out. Each gene is listed once, at its best match,
    best first.
    """
    if not q.strip():
        raise HTTPException(status_code=422, detail="The query is empty")
    if len(q.split()) > MAX_SEARCH_WORDS:
        raise HTTPException(
            status_code=422,
            detail=f"The query has more than {MAX_SEARCH_WORDS} words",
        )
    if service.snapshot is None:
        raise HTTPException(status_code=503, detail="Gene data is unavailable")
    words = service.search_words(q)
    # Punctuation alone, such as "-": no words, so nothing matches.
    results, truncated = (
        service.search_genes(words, assembly, limit) if words else ([], False)
    )
    return GeneSearchResponse(
        snapshot=service.snapshot,
        query=" ".join(words),
        results=results,
        truncated=truncated,
    )


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
