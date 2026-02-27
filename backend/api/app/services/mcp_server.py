import logging
from typing import List

from fastmcp import FastMCP

from app.services.catalog_data import CatalogData
from app.services.ena_service import ENAService

logger = logging.getLogger(__name__)

MCP_INSTRUCTIONS = """\
BRC Analytics provides curated genomic data for infectious disease and \
eukaryotic pathogen research. This server exposes the full catalog \
(1,900+ organisms, 5,000+ assemblies, 22 analysis workflows) and \
sequencing data search via the European Nucleotide Archive (ENA).

Use the catalog tools to explore organisms, assemblies, and workflows. \
Use the ENA tools to find raw sequencing data for a given organism.
"""

ENA_RESULT_CAP = 50


def create_mcp_server(catalog_data: CatalogData, ena_service: ENAService) -> FastMCP:
    mcp = FastMCP("BRC Analytics", instructions=MCP_INSTRUCTIONS)

    # -- Catalog tools (sync, in-memory) --

    @mcp.tool()
    def search_organisms(query: str, limit: int = 10) -> dict:
        """Search BRC organisms by name, taxonomy ID, or taxonomic group.
        Returns matching organisms with taxonomy, assembly count, and priority info."""
        results = catalog_data.search_organisms(query, limit=limit)
        if not results:
            raise ValueError(f"No organisms found matching '{query}'")
        return {"count": len(results), "organisms": results}

    @mcp.tool()
    def get_organism(taxonomy_id: str) -> dict:
        """Get a single organism by its NCBI taxonomy ID."""
        result = catalog_data.get_organism_by_taxonomy_id(taxonomy_id)
        if not result:
            raise ValueError(f"No organism found with taxonomy ID '{taxonomy_id}'")
        return result

    @mcp.tool()
    def get_assemblies(taxonomy_id: str) -> dict:
        """List genome assemblies for an organism (by NCBI taxonomy ID).
        Returns accession, level, ploidy, coverage, and annotation status."""
        results = catalog_data.get_assemblies_for_organism(taxonomy_id)
        if not results:
            raise ValueError(f"No assemblies found for taxonomy ID '{taxonomy_id}'")
        return {"count": len(results), "assemblies": results}

    @mcp.tool()
    def get_assembly_details(accession: str) -> dict:
        """Get full details of a genome assembly by accession
        (e.g. GCF_000005845.2)."""
        result = catalog_data.get_assembly_details(accession)
        if not result:
            raise ValueError(f"No assembly found with accession '{accession}'")
        return result

    @mcp.tool()
    def list_workflow_categories() -> dict:
        """List all workflow categories (e.g. Variant calling, Transcriptomics)
        with their workflow counts."""
        cats = catalog_data.get_workflow_categories()
        return {"categories": cats}

    @mcp.tool()
    def get_workflows_in_category(category: str) -> dict:
        """Get all workflows in a category. Use the category key (e.g. VARIANT_CALLING)
        or display name (e.g. 'Variant calling')."""
        results = catalog_data.get_workflows_in_category(category)
        if not results:
            raise ValueError(f"No workflows found in category '{category}'")
        return {"count": len(results), "workflows": results}

    @mcp.tool()
    def get_compatible_workflows(ploidies: List[str], taxonomy_id: str = "") -> dict:
        """Find workflows compatible with given ploidy values and optional taxonomy ID.
        Ploidy values are e.g. 'haploid', 'diploid'."""
        results = catalog_data.get_compatible_workflows(ploidies, taxonomy_id)
        if not results:
            raise ValueError(
                "No compatible workflows for "
                f"ploidies={ploidies}, taxonomy={taxonomy_id}"
            )
        return {"count": len(results), "workflows": results}

    @mcp.tool()
    def get_workflow_details(iwc_id: str) -> dict:
        """Get full details of a workflow by its IWC ID."""
        result = catalog_data.get_workflow_details(iwc_id)
        if not result:
            raise ValueError(f"No workflow found with IWC ID '{iwc_id}'")
        return result

    @mcp.tool()
    def check_compatibility(iwc_id: str, accession: str) -> dict:
        """Check whether a workflow is compatible with a specific genome assembly.
        Returns compatibility status and any issues (ploidy/taxonomy mismatches)."""
        return catalog_data.check_workflow_assembly_compatibility(iwc_id, accession)

    @mcp.tool()
    def resolve_workflow_inputs(iwc_id: str, accession: str) -> dict:
        """Resolve deterministic workflow inputs for a workflow + assembly pair.
        Returns resolved values (reference genome URL, gene model, accession)
        and unresolved inputs the researcher must provide (sequencing data).
        Also includes compatibility check results."""
        return catalog_data.resolve_workflow_inputs(iwc_id, accession)

    # -- ENA tools (async, HTTP) --

    @mcp.tool()
    async def search_ena(taxonomy_id: str) -> dict:
        """Search ENA for sequencing runs by taxonomy ID.
        Returns up to 50 read run records."""
        try:
            result = await ena_service.search_by_taxonomy(
                taxonomy_id, limit=ENA_RESULT_CAP
            )
        except Exception as e:
            raise ValueError(f"ENA search failed: {e}") from e
        data = result.get("data", [])
        if not data:
            raise ValueError(f"No ENA records found for taxonomy ID '{taxonomy_id}'")
        return {"count": len(data), "records": data[:ENA_RESULT_CAP]}

    @mcp.tool()
    async def search_ena_keywords(keywords: List[str]) -> dict:
        """Search the European Nucleotide Archive by keywords (organism names,
        library strategies like RNA-Seq/WGS, platforms like Illumina/PacBio).
        Returns up to 50 read run records."""
        try:
            result = await ena_service.search_by_keywords(
                keywords, limit=ENA_RESULT_CAP
            )
        except Exception as e:
            raise ValueError(f"ENA keyword search failed: {e}") from e
        data = result.get("data", [])
        if not data:
            raise ValueError(f"No ENA records found for keywords {keywords}")
        return {"count": len(data), "records": data[:ENA_RESULT_CAP]}

    logger.info("MCP server created")
    return mcp
