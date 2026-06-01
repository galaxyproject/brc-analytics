"""Assistant tools backed by the local SRA-DuckDB mirror.

These tools answer "what sequencing data is available?" questions
grounded in 17M real SRA runs filtered to BRC-relevant organisms via
taxid-anchored name resolution.
"""

from __future__ import annotations

import json

from app.services.tools.catalog_tools import AssistantDeps


def sra_summary_for_organism(deps: AssistantDeps, organism: str) -> str:
    """Get a high-level snapshot of SRA sequencing data available for an organism.

    Returns total run count, top sequencing platforms, top assay types
    (RNA-Seq, WGS, ChIP-Seq, etc.), top countries of origin, recent
    submission activity over the last 90 days, and the largest BioProjects
    by run count. Use this as the first call when a user asks about data
    availability for an organism. Handles old/new name variants
    automatically (e.g. accepts either "Candida auris" or "Candidozyma
    auris" -- both return the same data).

    Args:
        organism: organism scientific name (e.g. "Plasmodium falciparum")
            or NCBI taxonomy ID as a string (e.g. "5833").
    """
    if not deps.sra_mirror or not deps.sra_mirror.is_available():
        return "SRA mirror is not currently available."
    result = deps.sra_mirror.summary_for_organism(organism)
    return json.dumps(result, indent=2, default=str)


def search_sra_runs(
    deps: AssistantDeps,
    organism: str,
    assay_type: str | None = None,
    platform: str | None = None,
    country: str | None = None,
    since: str | None = None,
    limit: int = 50,
) -> str:
    """Search the SRA mirror for individual runs matching organism + filters.

    Returns a list of runs with accession, study, bioproject, organism,
    assay type, platform, instrument, library layout, release date, and
    country. Sorted by most recent. Use this after sra_summary_for_organism
    when the user wants specific runs to download or analyze.

    Args:
        organism: organism scientific name or NCBI taxonomy ID
        assay_type: optional, e.g. "RNA-Seq", "WGS", "ChIP-Seq", "AMPLICON"
        platform: optional, e.g. "ILLUMINA", "OXFORD_NANOPORE", "PACBIO_SMRT"
        country: optional country name, matched case-insensitively with common
            synonyms accepted (e.g. "UK", "USA"); e.g. "Kenya"
        since: optional ISO date filter, e.g. "2024-01-01" (release date >=)
        limit: max number of runs to return (default 50, max 200)
    """
    if not deps.sra_mirror or not deps.sra_mirror.is_available():
        return "SRA mirror is not currently available."
    limit = max(1, min(limit, 200))
    result = deps.sra_mirror.search_runs(
        organism=organism,
        assay_type=assay_type,
        platform=platform,
        country=country,
        since=since,
        limit=limit,
    )
    return json.dumps(result, indent=2, default=str)


def top_bioprojects_for_organism(
    deps: AssistantDeps, organism: str, limit: int = 20
) -> str:
    """List the largest BioProjects for an organism, ranked by run count.

    Includes study count and earliest/latest release dates per project.
    Use when the user asks about large cohorts, major studies, or where
    most of the data for an organism comes from.

    Args:
        organism: organism scientific name or NCBI taxonomy ID
        limit: max projects to return (default 20)
    """
    if not deps.sra_mirror or not deps.sra_mirror.is_available():
        return "SRA mirror is not currently available."
    limit = max(1, min(limit, 100))
    result = deps.sra_mirror.top_bioprojects_for_organism(organism, limit=limit)
    return json.dumps(result, indent=2, default=str)


def get_sra_study_runs(deps: AssistantDeps, accession: str, limit: int = 200) -> str:
    """Get the runs belonging to a specific SRA study or BioProject.

    Accepts either an SRA study accession (SRP*/ERP*/DRP*) or a BioProject
    accession (PRJEB*/PRJNA*/PRJDB*). Returns up to `limit` runs with full
    metadata.

    Args:
        accession: SRA study or BioProject accession
        limit: max runs to return (default 200, max 500)
    """
    if not deps.sra_mirror or not deps.sra_mirror.is_available():
        return "SRA mirror is not currently available."
    limit = max(1, min(limit, 500))
    result = deps.sra_mirror.get_study_runs(accession, limit=limit)
    return json.dumps(result, indent=2, default=str)
