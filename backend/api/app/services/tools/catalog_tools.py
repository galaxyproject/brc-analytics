"""Tool functions for the assistant agent."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Optional

from app.services.tools.catalog_data import CatalogData
from app.services.tools.catalog_query import CatalogQuery, execute

if TYPE_CHECKING:
    from app.services.sra_mirror import SRAMirrorService

logger = logging.getLogger(__name__)


@dataclass
class AssistantDeps:
    catalog: CatalogData
    sra_mirror: Optional["SRAMirrorService"] = None
    con: Any = None  # in-process DuckDB connection for query_catalog (optional)


def search_organisms(deps: AssistantDeps, query: str) -> str:
    """Search the BRC Analytics catalog for organisms by name, common name, or taxonomy ID.

    Args:
        query: organism name, common name, genus, or NCBI taxonomy ID to search for
    """
    results = deps.catalog.search_organisms(query, limit=10)
    if not results:
        return f"No organisms found matching '{query}'."
    return json.dumps(results, indent=2)


def get_assembly_details(deps: AssistantDeps, accession: str) -> str:
    """Get detailed information about a specific genome assembly by its accession.

    Args:
        accession: the genome assembly accession (e.g. GCF_000146045.2)
    """
    details = deps.catalog.get_assembly_details(accession)
    if not details:
        return f"Assembly {accession} not found in catalog."
    return json.dumps(details, indent=2)


def list_workflow_categories(deps: AssistantDeps) -> str:
    """List all available analysis workflow categories and how many workflows each has."""
    cats = deps.catalog.get_workflow_categories()
    return json.dumps(cats, indent=2)


def get_workflows_in_category(deps: AssistantDeps, category: str) -> str:
    """Get all workflows in a specific category.

    Args:
        category: the category key, e.g. VARIANT_CALLING, TRANSCRIPTOMICS, REGULATION, ASSEMBLY, ANNOTATION, GENOME_COMPARISONS, CONSENSUS_SEQUENCES, PROTEIN_FOLDING
    """
    workflows = deps.catalog.get_workflows_in_category(category)
    if not workflows:
        return f"No workflows found in category '{category}'."
    return json.dumps(workflows, indent=2)


def get_compatible_workflows(
    deps: AssistantDeps,
    organism_ploidies: str,
    taxonomy_id: Optional[str] = None,
) -> str:
    """Find workflows compatible with a given organism's ploidy and taxonomy.

    Args:
        organism_ploidies: comma-separated ploidy values, e.g. "HAPLOID" or "HAPLOID,DIPLOID"
        taxonomy_id: optional NCBI taxonomy ID to also filter by organism-specific workflows
    """
    ploidies = [p.strip().upper() for p in organism_ploidies.split(",") if p.strip()]
    workflows = deps.catalog.get_compatible_workflows(ploidies, taxonomy_id)
    if not workflows:
        return "No compatible workflows found."
    return json.dumps(workflows, indent=2)


def get_workflow_details(deps: AssistantDeps, iwc_id: str) -> str:
    """Get detailed information about a specific workflow including its parameters.

    Args:
        iwc_id: the IWC workflow identifier
    """
    details = deps.catalog.get_workflow_details(iwc_id)
    if not details:
        return f"Workflow '{iwc_id}' not found."
    return json.dumps(details, indent=2)


def check_compatibility(deps: AssistantDeps, iwc_id: str, accession: str) -> str:
    """Check whether a workflow and genome assembly are compatible (ploidy, taxonomy, annotation).

    Args:
        iwc_id: the IWC workflow identifier
        accession: the genome assembly accession
    """
    result = deps.catalog.check_workflow_assembly_compatibility(iwc_id, accession)
    return json.dumps(result, indent=2)


def query_catalog(deps: AssistantDeps, query: CatalogQuery) -> str:
    """Count, filter, list, or facet (group-by) ASSEMBLIES or ORGANISMS with a query.

    Prefer this over enumerating rows yourself: it runs the filter/count in the
    database and returns a JSON summary correct at any scale. The summary always
    has `total`; `list` adds `rows`/`returned`/`truncated` (capped page) and may
    add `facets` on truncation (only when a breakdown discriminates, so don't
    assume it's present); `facets` adds `facets`. Use it for "how many",
    attribute filters, clade queries, and "by/per X" breakdowns. On a failure or
    when the engine is unavailable it returns a short plain-text message instead
    of JSON.

    Pick `entity` by what a result row should be: "assembly" for genome
    assemblies (accession, level, isRef, strain), "organism" for distinct
    organisms/taxa (one row per species, with assemblyCount). "How many/which
    organisms do you have for <clade>" is an organism query; "assemblies for an
    organism" is an assembly query.

    The query has: entity ("assembly" | "organism"), filters (a list of
    {field, op, value}, AND-combined), operation ("count" | "list" | "facets"),
    facet_by, limit, offset, sort.
    Ops: eq, ne, in, not_in, gt/gte/lt/lte (numeric), contains/contains_any (list
    fields), is_null/not_null. OR within a field = `in` (scalar) or `contains_any`
    (list); a range = two predicates (gte + lte).

    Filter by scientific name via taxonomicLevelSpecies, a clade via the matching
    rank column (e.g. taxonomicLevelGenus). When a list comes back truncated,
    state the total and offer to narrow rather than paging.

    Args:
        query: the structured catalog query
    """
    if deps.con is None:
        return "Catalog query engine is not available."
    try:
        result = execute(query, deps.con)
    except Exception:  # noqa: BLE001
        # Log the detail; return a controlled message rather than echoing raw
        # exception text (which can carry SQL fragments) to the model/user.
        # Invalid queries are already rejected by validation before this runs.
        logger.exception("query_catalog execution failed")
        return "Query failed — try simplifying or narrowing the query."
    return json.dumps(result, indent=2, default=str)
