import logging
from typing import List, Optional

from fastmcp import FastMCP

from app.services.catalog_data import CatalogData
from app.services.ena_service import ENAService
from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)

ENA_RESULT_CAP = 50


def create_mcp_server(
    catalog_data: CatalogData,
    ena_service: ENAService,
    sra_mirror: Optional[SRAMirrorService] = None,
) -> FastMCP:
    # Opt-in: the SRA mirror tools only exist when a mirror file is configured
    # and openable. A default deploy (no SRA_MIRROR_PATH) advertises exactly
    # the tools it does today -- same discipline as the assistant prompt.
    sra_enabled = sra_mirror is not None and sra_mirror.is_available()

    wf_count = sum(
        len(c.get("workflows", [])) for c in catalog_data.workflow_categories
    )
    instructions = (
        "BRC Analytics provides curated genomic data for infectious disease and "
        "eukaryotic pathogen research. This server exposes the full catalog "
        f"({len(catalog_data.organisms):,} organisms, "
        f"{len(catalog_data.assemblies):,} assemblies, "
        f"{wf_count} analysis workflows) and "
        "sequencing data search via the European Nucleotide Archive (ENA).\n\n"
        "Use the catalog tools to explore organisms, assemblies, and workflows. "
        "Use the ENA tools to find raw sequencing data for a given organism."
    )
    if sra_enabled:
        instructions += (
            "\n\nThis server also exposes a local SRA metadata mirror "
            "(search_sra, sra_data_summary, get_sra_study_runs): fast, "
            "structured multi-facet search (platform / assay type / country / "
            "release date) over SRA runs scoped to BRC-relevant organisms, "
            "refreshed weekly and resilient to ENA/EBI outages. Prefer the SRA "
            "tools for broad or filtered 'what data exists' queries on BRC "
            "pathogens; prefer the ENA tools (search_ena, search_ena_keywords) "
            "for the very latest submissions, non-BRC organisms, or free-text "
            "keyword search."
        )
    mcp = FastMCP("BRC Analytics", instructions=instructions)

    # Catalog tools use two error conventions:
    # - Single-entity lookups (get_organism, get_assembly_details, etc.) raise
    #   ValueError when the entity doesn't exist, since there's no meaningful
    #   empty response for a specific ID lookup.
    # - Multi-result searches (search_organisms, get_assemblies, etc.) return
    #   {"count": 0, ...} with an empty list, since zero results is a valid
    #   search outcome.

    # -- Catalog tools (sync, in-memory) --

    @mcp.tool()
    def search_organisms(query: str, limit: int = 10) -> dict:
        """Search BRC organisms by name, taxonomy ID, or taxonomic group.
        Returns matching organisms with taxonomy, assembly count, and priority info."""
        results = catalog_data.search_organisms(query, limit=limit)
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
        return {"count": len(results), "workflows": results}

    @mcp.tool()
    def get_compatible_workflows(ploidies: List[str], taxonomy_id: str = "") -> dict:
        """Find workflows compatible with given ploidy values and optional taxonomy ID.
        Ploidy values are e.g. 'haploid', 'diploid'."""
        results = catalog_data.get_compatible_workflows(ploidies, taxonomy_id)
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
        Returns up to 50 read run records. Check has_more to see if
        additional results exist beyond the cap."""
        try:
            result = await ena_service.search_by_taxonomy(
                taxonomy_id, limit=ENA_RESULT_CAP + 1
            )
        except Exception as e:
            raise ValueError(f"ENA search failed: {e}") from e
        data = result.get("data", [])
        has_more = len(data) > ENA_RESULT_CAP
        capped = data[:ENA_RESULT_CAP]
        return {"count": len(capped), "has_more": has_more, "records": capped}

    @mcp.tool()
    async def search_ena_keywords(keywords: List[str]) -> dict:
        """Search the European Nucleotide Archive by keywords (organism names,
        library strategies like RNA-Seq/WGS, platforms like Illumina/PacBio).
        Returns up to 50 read run records. Check has_more to see if
        additional results exist beyond the cap."""
        try:
            result = await ena_service.search_by_keywords(
                keywords, limit=ENA_RESULT_CAP + 1
            )
        except Exception as e:
            raise ValueError(f"ENA keyword search failed: {e}") from e
        data = result.get("data", [])
        has_more = len(data) > ENA_RESULT_CAP
        capped = data[:ENA_RESULT_CAP]
        return {"count": len(capped), "has_more": has_more, "records": capped}

    # -- SRA mirror tools (sync, local read-only DuckDB) --
    #
    # Thin wrappers over the shared SRAMirrorService. They return the service
    # dicts as-is: already JSON-friendly, and carrying useful structure (the
    # `_meta` provenance block, the `resolved` flag + spelling hint, n_returned,
    # filters_applied). Unlike the ENA tools, these don't raise on a bad input
    # -- the service returns a structured {"error": ...} or resolved=false that
    # is more useful to an agent than an exception. Result caps come from the
    # service's own clamps (search 200, get_study_runs 500).

    if sra_enabled:

        @mcp.tool()
        def search_sra(
            organism: str,
            assay_type: Optional[str] = None,
            platform: Optional[str] = None,
            country: Optional[str] = None,
            since: Optional[str] = None,
            limit: int = 50,
        ) -> dict:
            """Search the local SRA mirror for sequencing runs matching an
            organism plus optional facet filters. Fast, structured, scoped to
            BRC-relevant organisms, refreshed weekly. Prefer over search_ena for
            filtered "what data exists" queries on BRC pathogens.

            Args:
                organism: scientific name or NCBI taxonomy ID (e.g. "Plasmodium
                    falciparum" or "5833"). Old/new name variants both resolve.
                assay_type: optional, e.g. "RNA-Seq", "WGS", "ChIP-Seq".
                platform: optional, e.g. "ILLUMINA", "OXFORD_NANOPORE".
                country: optional country name (case-insensitive, common
                    synonyms like "UK"/"USA" accepted).
                since: optional release-date floor, ISO format (YYYY, YYYY-MM,
                    or YYYY-MM-DD).
                limit: max runs to return (default 50, capped at 200).
            """
            return sra_mirror.search_runs(
                organism=organism,
                assay_type=assay_type,
                platform=platform,
                country=country,
                since=since,
                limit=limit,
            )

        @mcp.tool()
        def sra_data_summary(organism: str) -> dict:
            """Snapshot of SRA data available for an organism: total run count,
            top platforms / assay types / countries, recent submission activity,
            and the largest BioProjects by run count. Use as the first call for
            "how much data is there for X?" on BRC pathogens.

            Args:
                organism: scientific name or NCBI taxonomy ID. Old/new name
                    variants both resolve.
            """
            return sra_mirror.summary_for_organism(organism)

        @mcp.tool()
        def get_sra_study_runs(accession: str, limit: int = 200) -> dict:
            """Get the runs belonging to a specific SRA study (SRP*/ERP*/DRP*)
            or BioProject (PRJNA*/PRJEB*/PRJDB*).

            Args:
                accession: SRA study or BioProject accession.
                limit: max runs to return (default 200, capped at 500).
            """
            return sra_mirror.get_study_runs(accession, limit=limit)

        logger.info("SRA mirror tools registered on MCP server")

    logger.info("MCP server created")
    return mcp
