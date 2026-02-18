"""Tool functions for the assistant agent."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.services.tools.catalog_data import CatalogData


@dataclass
class AssistantDeps:
    catalog: CatalogData


def search_organisms(deps: AssistantDeps, query: str) -> str:
    """Search the BRC Analytics catalog for organisms by name, common name, or taxonomy ID.

    Args:
        query: organism name, common name, genus, or NCBI taxonomy ID to search for
    """
    results = deps.catalog.search_organisms(query, limit=10)
    if not results:
        return f"No organisms found matching '{query}'."
    return json.dumps(results, indent=2)


def get_assemblies(deps: AssistantDeps, taxonomy_id: str) -> str:
    """Get all genome assemblies available for an organism by its NCBI taxonomy ID.

    Args:
        taxonomy_id: the NCBI taxonomy ID of the organism
    """
    assemblies = deps.catalog.get_assemblies_for_organism(taxonomy_id)
    if not assemblies:
        return f"No assemblies found for taxonomy ID {taxonomy_id}."
    return json.dumps(assemblies, indent=2)


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
    ploidies = [p.strip() for p in organism_ploidies.split(",")]
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
