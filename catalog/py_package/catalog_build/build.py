import datetime
import json
import logging
import os
import urllib
from collections.abc import Callable
from dataclasses import asdict, dataclass
from pathlib import Path

import duckdb
import pandas as pd

from .load import LoadParams, do_dlt_load
from .qc_report import (
    QcResultDataReport,
    QcResultDbtTest,
    QcResultDbtTestFailures,
    QcResultDbtTestFailureSample,
    QcResultDbtTestResults,
    QcResultGcaWithPairedGcf,
    QcResultInconsistentTaxonomyIds,
    QcResultMissingDatacacheUrls,
    QcResultMissingGeneModelUrls,
    QcResultMissingNcbiAssemblies,
    QcResultMissingOutbreakDescendants,
    QcResultMissingPloidyAssemblies,
    QcResultMissingUcscAssemblies,
    QcResultOrganismsNotSpeciesRank,
    QcResultOrganismsWithoutAssemblies,
    QcResultOutbreakTaxonomyIssues,
    QcResultOutdatedAccessions,
    QcResultSupressedGenomes,
    QcResultTaxonomyTreeChecks,
    QcResultTaxonomyTreeLeavesMissingSpecies,
    QcResultTaxonomyTreeMissingRanks,
    QcResultTaxonomyTreeZeroAssembliesTaxa,
)
from .transform import DBTTestResult, do_dbt_transformations
from .utils import get_db_path

MAX_NCBI_URL_LENGTH = 2000  # The actual limit seems to be a bit over 4000

log = logging.getLogger(__name__)


def save_json_file(path: str | Path, obj, **json_opts):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(obj, file, **json_opts)


def match_taxonomic_group(tax_id, lineage, taxonomic_groups):
    if tax_id not in taxonomic_groups:
        return None
    taxon_info = taxonomic_groups[tax_id]
    name, exclude = (
        (taxon_info["value"], taxon_info.get("exclude"))
        if isinstance(taxon_info, dict)
        else (taxon_info, None)
    )
    if exclude is None:
        return name
    if isinstance(exclude, int):
        exclude = [exclude]
    if all(tid not in lineage for tid in exclude):
        return name
    return None


def get_taxonomic_groups(lineage, taxonomic_groups):
    return [
        group
        for group in (
            match_taxonomic_group(tax_id, lineage, taxonomic_groups)
            for tax_id in lineage
        )
        if group is not None
    ]


def get_taxonomic_group_sets(lineage, taxonomic_group_sets):
    return {
        field: ",".join(get_taxonomic_groups(lineage, taxonomic_groups))
        for field, taxonomic_groups in taxonomic_group_sets.items()
    }


def get_taxonomic_level_key(level):
    return f"taxonomicLevel{level[0].upper()}{level[1:]}"


def get_taxonomic_level_id_key(level):
    return f"{get_taxonomic_level_key(level)}Id"


def get_species_df(assembly_taxonomy_df, taxonomic_group_sets, taxonomic_levels):
    """
    Converts assembly taxonomy information into a DataFrame to be joined with the assembly list.

    Args:
      assembly_taxonomy_df: DataFrame containing assembly taxonomy data built in the database
      taxonomic_group_sets: Dictionary of taxonomic group sets
      taxonomic_levels: List of taxonomic levels to include

    Returns:
      DataFrame containing taxonomy information for assembly taxa
    """
    taxonomic_group_sets_df = pd.DataFrame(
        [
            get_taxonomic_group_sets(lineage, taxonomic_group_sets)
            for lineage in assembly_taxonomy_df["lineage_taxonomy_ids"]
        ]
    )
    taxonomic_group_columns = {
        col: taxonomic_group_sets_df[col] for col in taxonomic_group_sets_df.columns
    }
    taxonomic_level_columns = {
        get_taxonomic_level_key(level): assembly_taxonomy_df[f"taxonomic_level_{level}"]
        for level in taxonomic_levels
    }
    taxonomic_level_id_columns = {
        get_taxonomic_level_id_key(level): assembly_taxonomy_df[
            f"taxonomic_level_{level}_id"
        ].astype("string")
        for level in taxonomic_levels
    }
    return pd.DataFrame(
        {
            "taxonomyId": assembly_taxonomy_df["taxonomy_id"].astype("string"),
            "species": assembly_taxonomy_df["taxonomic_level_species"],
            "speciesTaxonomyId": assembly_taxonomy_df[
                "taxonomic_level_species_id"
            ].astype("string"),
            "lineageTaxonomyIds": assembly_taxonomy_df["lineage_taxonomy_ids"].map(
                lambda ids: ",".join([str(id) for id in ids])
            ),
            # Miscellaneous names for the taxon (including ancestors up to species level);
            # serialized as JSON because names may contain arbitrary characters (including commas).
            "otherNames": assembly_taxonomy_df["other_names"].map(
                lambda names: json.dumps(list(names))
            ),
            **taxonomic_group_columns,
            **taxonomic_level_columns,
            **taxonomic_level_id_columns,
        }
    )


def get_species_tree(assemblies_df, taxonomic_levels):
    """
    Builds a species tree from assemblies and taxonomic levels.

    Args:
      assemblies_df: Assemblies dataframe containing names and taxonomy IDs for the given taxonomic levels
      taxonomic_levels: List of taxonomic levels to include in the tree, from highest to lowest

    Returns:
      A nested tree structure of species
    """
    # Generate the tree, filling NA in the assemblies dataframe (limited to taxon columns) to enable grouping for absent values
    all_taxonomic_level_column_names = [
        get_key(level)
        for level in taxonomic_levels
        for get_key in (get_taxonomic_level_key, get_taxonomic_level_id_key)
    ]
    return get_species_subtree(
        "root",
        "1",
        "NA",
        assemblies_df[all_taxonomic_level_column_names].fillna(""),
        taxonomic_levels,
    )


def get_species_subtree(
    node_name, node_taxonomy_id, node_rank, assemblies_df, taxonomic_levels
):
    """
    Builds a node of the species tree and its descendants.

    Args:
      node_name: Taxon name to use for this node
      node_taxonomy_id: Taxonomy ID to use for this node
      node_rank: Taxonomic rank to use for this node
      assemblies_df: Dataframe of assemblies for the current subtree; the taxonomic level columns should contain valid values to group on
      taxonomic_levels: List of remaining taxonomic levels to build subtrees for

    Returns:
      A nested tree structure of species
    """
    children = []

    if len(taxonomic_levels) > 0:
        child_rank = taxonomic_levels[0]
        child_taxonomic_levels = taxonomic_levels[1:]
        # Group by next rank down in order to generate child nodes
        grouped_assemblies = assemblies_df.groupby(
            [
                get_taxonomic_level_key(child_rank),
                get_taxonomic_level_id_key(child_rank),
            ]
        )
        for (child_name, child_id), child_df in grouped_assemblies:
            child_node = get_species_subtree(
                child_name, child_id, child_rank, child_df, child_taxonomic_levels
            )
            if child_name:
                children.append(child_node)
            else:
                # If there's no taxon at the next level for some descendants, skip that level for those descendants and insert them into this level's children
                children += child_node["children"]

    # Sort to maintain consistent order in output
    children.sort(key=lambda node: int(node["ncbi_tax_id"]))

    return {
        "name": node_name,
        "ncbi_tax_id": node_taxonomy_id,
        "children": children,
        "rank": node_rank,
        "assembly_count": len(assemblies_df.index),
    }


def get_genome_row(genome_info: pd.Series):
    # Some values may be None; see NcbiGenome definition in ncbi_api.py
    infraspecific_names = genome_info["organism"]["infraspecific_names"]
    current_accession = genome_info["current_accession"]
    refseq_category = genome_info["assembly_info"]["refseq_category"]
    assembly_status = genome_info["assembly_info"]["assembly_status"]
    annotation_info = genome_info["annotation_info"]
    return {
        "strain": None
        if infraspecific_names is None
        # infraspecific_names is a mapping of arbitrary strings, so the "strain" entry is not assumed to exist
        else infraspecific_names.get("strain"),
        "taxonomyId": str(genome_info["organism"]["tax_id"]),
        "releaseDate": genome_info["assembly_info"]["release_date"],
        "accession": genome_info["accession"],
        "currentAccession": genome_info["accession"]
        if current_accession is None
        else current_accession,
        "isRef": refseq_category == "reference genome",
        "level": genome_info["assembly_info"]["assembly_level"],
        "assemblyStatus": "ASSEMBLY_STATUS_UNKNOWN"
        if assembly_status is None
        else assembly_status,
        "chromosomeCount": genome_info["assembly_stats"]["total_number_of_chromosomes"],
        "length": genome_info["assembly_stats"]["total_sequence_length"],
        "scaffoldCount": genome_info["assembly_stats"]["number_of_scaffolds"],
        "scaffoldN50": genome_info["assembly_stats"]["scaffold_n50"],
        "scaffoldL50": genome_info["assembly_stats"]["scaffold_l50"],
        "coverage": genome_info["assembly_stats"]["genome_coverage"],
        "gcPercent": genome_info["assembly_stats"]["gc_percent"],
        "annotationStatus": None
        if annotation_info is None
        else annotation_info["status"],
        "pairedAccession": genome_info["paired_accession"],
    }


def get_genomes_df(source_ncbi_genomes_df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes loaded NCBI genomes and creates a DataFrame for genomes data.

    Args:
      source_ncbi_genomes_df: Dataframe of genome metadata loaded via dlt

    Returns:
      Genomes DataFrame
    """
    json_column_names = [
        "annotation_info",
        "assembly_info",
        "assembly_stats",
        "organism",
    ]
    parsed_json_columns = source_ncbi_genomes_df[json_column_names].map(
        lambda v: None if v is None else json.loads(v)
    )
    ncbi_genomes_df = source_ncbi_genomes_df.assign(**parsed_json_columns)
    return ncbi_genomes_df.apply(get_genome_row, axis="columns", result_type="expand")


def _get_gene_model_urls_from_genark_list(gen_ark_file_list: pd.DataFrame):
    """Extract GTF URLs from loaded file list.

    Returns:
        dict: A dictionary mapping genome assembly IDs to their GTF file URLs
    """

    download_base_url = "https://hgdownload.soe.ucsc.edu/hubs"

    # Dictionary to store the best GTF URL for each assembly ID
    gene_model_urls = {}

    # Process the gzipped file content
    for line in gen_ark_file_list["path"]:
        # Filter for GTF files
        if line.endswith(".gtf.gz"):
            # Extract assembly ID from the path
            # Format: GCF/001/559/675/GCF_001559675.1/genes/GCF_001559675.1.ncbiGene.gtf.gz
            parts = line.split("/")

            # We need at least 7 parts to have a valid path with genes directory
            if len(parts) >= 7:
                # Check if the 6th part (index 5) is 'genes'
                if parts[5] == "genes":
                    # The assembly ID is in the 5th position (index 4)
                    asm_id = parts[4]

                    if asm_id:
                        # Apply the same priority logic as before
                        url = urllib.parse.urljoin(f"{download_base_url}/", line)

                        # If we haven't seen this assembly yet, add it
                        if asm_id not in gene_model_urls:
                            gene_model_urls[asm_id] = url
                        else:
                            # Apply priority logic: ncbiRefSeq > ncbiGene > augustus
                            current_url = gene_model_urls[asm_id]

                            # Replace with higher priority URL if found
                            if "ncbiRefSeq" in url and "ncbiRefSeq" not in current_url:
                                gene_model_urls[asm_id] = url
                            elif "ncbiGene" in url and not any(
                                x in current_url for x in ["ncbiRefSeq"]
                            ):
                                gene_model_urls[asm_id] = url
                            elif "augustus" in url and not any(
                                x in current_url for x in ["ncbiRefSeq", "ncbiGene"]
                            ):
                                gene_model_urls[asm_id] = url

    print(f"Found GTF URLs for {len(gene_model_urls)} assemblies")
    return gene_model_urls


def add_gene_model_url(genomes_df: pd.DataFrame, gen_ark_file_list: pd.DataFrame):
    """Add gene model URLs to the genomes DataFrame using the genArkFileList.txt.gz file.

    Args:
        genomes_df: DataFrame containing genome information with 'accession' column
        gen_ark_file_list: DataFrame containing file paths loaded from genArkFileList.txt.gz.

    Returns:
        DataFrame with added 'geneModelUrl' column
    """
    # Get all gene model URLs at once
    gene_model_urls = _get_gene_model_urls_from_genark_list(gen_ark_file_list)

    # Map accessions to URLs
    gene_model_url_series = genomes_df["accession"].map(gene_model_urls)

    # Add the URLs to the DataFrame
    return pd.concat(
        [
            genomes_df,
            gene_model_url_series.rename("geneModelUrl"),
        ],
        axis="columns",
    )


def report_missing_values_from[T](
    qc_result_model: Callable[..., T],
    values_name: str,
    message_predicate: str,
    all_values_series: pd.Series,
    *partial_values_series: pd.Series,
) -> T:
    present_values_mask = pd.Series(False, index=all_values_series.index)
    for series in partial_values_series:
        present_values_mask |= all_values_series.isin(series)
    return report_missing_values(
        qc_result_model,
        values_name,
        message_predicate,
        all_values_series,
        present_values_mask,
    )


def report_missing_values[T](
    qc_result_model: Callable[..., T],
    values_name: str,
    message_predicate: str,
    values_series: pd.Series,
    present_values_mask: pd.Series,
) -> T:
    missing_values = values_series[~present_values_mask]
    if len(missing_values) > 0:
        if len(missing_values) > len(values_series) / 2:
            present_values = values_series[present_values_mask]
            print(
                f"Only {len(present_values)} of {len(values_series)} {values_name} "
                f"{message_predicate}: {', '.join(present_values)}"
            )
        else:
            print(
                f"{len(missing_values)} {values_name} not {message_predicate}: "
                f"{', '.join(missing_values)}"
            )
    return qc_result_model(data=list(missing_values))


def report_inconsistent_taxonomy_ids(
    df: pd.DataFrame,
) -> QcResultInconsistentTaxonomyIds:
    inconsistent_ids_series = (
        # Rows with missing species can't be reported on meaningfully
        df.dropna(subset="species")
        # Get species/strain combinations with multiple taxonomy IDs
        .groupby(["species", "strain"], dropna=False)
        .filter(lambda g: g["taxonomyId"].nunique() > 1)
        # Get taxonomy IDs for each group
        .groupby(["species", "strain"], dropna=False)["taxonomyId"]
        .apply(set)
    )
    inconsistent_ids_strings = [
        (
            f"{species} strain {strain}" if pd.notna(strain) else species,
            # Sort the IDs, since set iteration order isn't consistent between runs
            ", ".join([str(id) for id in sorted(ids, key=int)]),
        )
        for (species, strain), ids in inconsistent_ids_series.items()
    ]
    if len(inconsistent_ids_strings) > 0:
        inconsistent_taxonmy_ids_combined = ", ".join(
            [f"{taxon} ({ids})" for taxon, ids in inconsistent_ids_strings]
        )
        print(
            f"Taxa with inconsistent taxonomy IDs: {inconsistent_taxonmy_ids_combined}"
        )
    return QcResultInconsistentTaxonomyIds(data=inconsistent_ids_strings)


def do_taxonomy_tree_checks(
    tree, taxonomic_levels, assembly_count
) -> QcResultTaxonomyTreeChecks:
    zero_assemblies_taxa = []
    leaves_missing_species = []
    present_ranks = set()

    def check_node(node, lineage_has_species=False):
        present_ranks.add(node["rank"])

        if node["assembly_count"] == 0:
            zero_assemblies_taxa.append(node["ncbi_tax_id"])

        if node["rank"] == "species":
            lineage_has_species = True

        if len(node["children"]) == 0:
            assembly_count = node["assembly_count"]
            if not lineage_has_species:
                leaves_missing_species.append(node["ncbi_tax_id"])
        elif node["rank"] == "species":
            assembly_count = node["assembly_count"]
            for child_node in node["children"]:
                check_node(child_node, lineage_has_species)
        else:
            assembly_count = 0
            for child_node in node["children"]:
                assembly_count += check_node(child_node, lineage_has_species)

        return assembly_count

    combined_assembly_count = check_node(tree)

    return QcResultTaxonomyTreeChecks(
        assemblies_actual_vs_expected=(
            None
            if combined_assembly_count == assembly_count
            else (combined_assembly_count, assembly_count)
        ),
        leaves_missing_species=QcResultTaxonomyTreeLeavesMissingSpecies(
            data=leaves_missing_species
        ),
        zero_assemblies_taxa=QcResultTaxonomyTreeZeroAssembliesTaxa(
            data=zero_assemblies_taxa
        ),
        # Filter rather than taking a set difference, to report the ranks in the order given
        missing_ranks=QcResultTaxonomyTreeMissingRanks(
            data=[level for level in taxonomic_levels if level not in present_ranks]
        ),
    )


def report_missing_ploidy_info(
    genomes_df: pd.DataFrame,
) -> QcResultMissingPloidyAssemblies:
    """
    Reports assemblies that are missing ploidy information.

    Args:
        genomes_df: DataFrame containing genome information and ploidy information

    Returns:
        A list of tuples containing (accession, speciesTaxonomyId) for assemblies without ploidy information
    """
    # Find assemblies where we have no ploidy information
    missing_ploidy = genomes_df[genomes_df["ploidy"].isna()]
    missing_count = len(missing_ploidy)

    if missing_count > 0:
        print(f"Warning: Found {missing_count} assemblies without ploidy information")
        print("Missing ploidy assemblies:")
        for _, row in missing_ploidy.iterrows():
            print(f"  {row['accession']}: {row['speciesTaxonomyId']}")

    return QcResultMissingPloidyAssemblies(
        data=list(
            zip(
                missing_ploidy["accession"],
                missing_ploidy["speciesTaxonomyId"],
                strict=True,
            )
        )
    )


def check_missing_outbreak_descendants(
    outbreak_taxonomy_ids, all_taxonomy_ids
) -> QcResultMissingOutbreakDescendants:
    """
    Check for outbreak taxonomy IDs that are not found in the genomes data.

    Args:
        outbreak_taxonomy_ids: List of taxonomy IDs from outbreaks, including descendants
        all_taxonomy_ids: List of all taxonomy IDs found in the genomes data

    Returns:
        List of missing taxonomy IDs
    """
    # Convert all_taxonomy_ids to a set for faster lookups
    all_taxonomy_ids_set = set(all_taxonomy_ids)

    # Find taxonomy IDs that are in outbreak_taxonomy_ids but not in all_taxonomy_ids
    missing_ids = [
        tax_id for tax_id in outbreak_taxonomy_ids if tax_id not in all_taxonomy_ids_set
    ]

    return QcResultMissingOutbreakDescendants(data=missing_ids)


def find_outdated_accessions(genomes_df) -> QcResultOutdatedAccessions:
    """
    Identifies assemblies where the accession is outdated (different from current_accession).

    Args:
        genomes_df: DataFrame containing genome information with 'accession' and 'currentAccession' columns

    Returns:
        List of tuples containing (accession, current_accession) for outdated assemblies
    """
    outdated_mask = genomes_df["accession"] != genomes_df["currentAccession"]
    outdated_assemblies = genomes_df[outdated_mask][
        ["accession", "currentAccession"]
    ].values.tolist()
    return QcResultOutdatedAccessions(data=outdated_assemblies)


def find_suppressed_genomes(genomes_df) -> QcResultSupressedGenomes:
    """
    Identifies assemblies that have been suppressed by NCBI.

    Args:
        genomes_df: DataFrame containing genome information with 'assemblyStatus' column

    Returns:
        List of accessions for suppressed assemblies and their status
    """
    # Look for assemblies with status 'suppressed' or 'retired'
    suppressed_mask = genomes_df["assemblyStatus"].isin(["suppressed", "retired"])
    suppressed_assemblies = genomes_df[suppressed_mask][
        ["accession", "assemblyStatus"]
    ].values.tolist()
    return QcResultSupressedGenomes(data=suppressed_assemblies)


def find_gca_with_paired_gcf(genomes_df) -> QcResultGcaWithPairedGcf:
    """
    Identifies GenBank (GCA) assemblies that have paired RefSeq (GCF) accessions available.

    Args:
        genomes_df: DataFrame containing genome information with 'accession' and
            'pairedAccession' columns

    Returns:
        List of tuples containing (GCA_accession, GCF_paired_accession)
    """
    # Filter for GCA accessions that have a paired GCF accession
    gca_mask = genomes_df["accession"].str.startswith("GCA_")
    has_paired_mask = genomes_df["pairedAccession"].notna() & genomes_df[
        "pairedAccession"
    ].str.startswith("GCF_")

    # Combine masks to find GCA accessions with GCF paired accessions
    paired_mask = gca_mask & has_paired_mask

    # Extract the accession and paired accession for matching rows
    paired_assemblies = genomes_df[paired_mask][
        ["accession", "pairedAccession"]
    ].values.tolist()
    return QcResultGcaWithPairedGcf(data=paired_assemblies)


def check_outbreak_taxonomy_issues(
    outbreak_taxonomy_ids,
    taxon_rank_map,
    taxon_name_map,
    all_lineage_ids,
    taxonomic_levels_for_tree,
) -> QcResultOutbreakTaxonomyIssues:
    """
    Check outbreak primary taxonomy IDs for two issues:
    - Not found in any assembly's lineage (not in catalog)
    - At a rank below species (e.g. strain, serotype, isolate)

    Args:
        outbreak_taxonomy_ids: List of primary outbreak taxonomy IDs (strings)
        taxon_rank_map: Dict mapping taxonomy ID strings to rank strings
        taxon_name_map: Dict mapping taxonomy ID strings to name strings
        all_lineage_ids: Set of all taxonomy IDs present in any assembly's lineage
        taxonomic_levels_for_tree: Ordered list of taxonomic levels (highest to lowest)

    Returns:
        List of (id, name, reason) tuples for problematic IDs
    """
    sub_species_ranks = set()
    if "species" in taxonomic_levels_for_tree:
        species_idx = taxonomic_levels_for_tree.index("species")
        sub_species_ranks = set(taxonomic_levels_for_tree[species_idx + 1 :])

    issues = []
    for tax_id in outbreak_taxonomy_ids:
        name = taxon_name_map.get(str(tax_id), str(tax_id))
        rank = taxon_rank_map.get(str(tax_id), "").lower()
        if str(tax_id) not in all_lineage_ids:
            issues.append((tax_id, name, "not in catalog"))
        elif rank and rank in sub_species_ranks:
            issues.append((tax_id, name, f"below species rank ({rank})"))
    return QcResultOutbreakTaxonomyIssues(data=issues)


def check_organism_ranks(
    organism_taxonomy_ids, taxon_rank_map, taxon_name_map
) -> QcResultOrganismsNotSpeciesRank:
    """
    Check organism taxonomy IDs for non-species rank.
    Organisms are expected to always be at species rank by convention.

    Args:
        organism_taxonomy_ids: List of organism taxonomy IDs (strings)
        taxon_rank_map: Dict mapping taxonomy ID strings to rank strings
        taxon_name_map: Dict mapping taxonomy ID strings to name strings

    Returns:
        List of (id, name, rank) tuples for organisms not at species rank
    """
    return QcResultOrganismsNotSpeciesRank(
        data=[
            (
                tax_id,
                taxon_name_map.get(str(tax_id), str(tax_id)),
                taxon_rank_map.get(str(tax_id), "unknown").lower(),
            )
            for tax_id in organism_taxonomy_ids
            if taxon_rank_map.get(str(tax_id), "").lower() != "species"
        ]
    )


def check_organisms_without_assemblies(
    organism_taxonomy_ids, species_taxonomy_ids, taxon_name_map
) -> QcResultOrganismsWithoutAssemblies:
    """
    Check for organisms whose taxonomy ID does not appear as any assembly's species
    taxonomy ID. This can indicate missing catalog coverage or a non-species-rank ID.

    Args:
        organism_taxonomy_ids: List of organism taxonomy IDs (strings)
        species_taxonomy_ids: Collection of speciesTaxonomyId values from assembly data
        taxon_name_map: Dict mapping taxonomy ID strings to name strings

    Returns:
        List of (id, name) tuples for organisms with no matching assemblies
    """
    species_ids_set = {str(t) for t in species_taxonomy_ids}
    return QcResultOrganismsWithoutAssemblies(
        data=[
            (tax_id, taxon_name_map.get(str(tax_id), str(tax_id)))
            for tax_id in organism_taxonomy_ids
            if str(tax_id) not in species_ids_set
        ]
    )


def build_taxon_maps(taxonomy_df):
    """
    Build lookups from taxonomy ID (as string) to taxon name and rank.

    Args:
        taxonomy_df: DataFrame with taxonomy_id, taxon_name and rank columns

    Returns:
        Tuple of (name_map, rank_map) dicts keyed by taxonomy ID string
    """
    taxon_id_strings = taxonomy_df["taxonomy_id"].astype("string")
    name_map = dict(zip(taxon_id_strings, taxonomy_df["taxon_name"], strict=True))
    rank_map = dict(zip(taxon_id_strings, taxonomy_df["rank"], strict=True))
    return name_map, rank_map


def get_outbreak_taxonomy_ids(
    source_outbreaks_df, get_primary=True, get_descendants=False
):
    """Read outbreaks from YAML file and return a list of taxonomy IDs.

    Includes both primary taxonomy_id and any highlight_descendant_taxonomy_ids.
    """
    if not get_primary and not get_descendants:
        raise ValueError("At least one of get_primary or get_descendants must be True")

    # Catalogs without outbreaks pass no outbreaks DataFrame
    if source_outbreaks_df is None:
        return []

    # Return list of unique taxonomy IDs, converted to strings and sorted for
    # consistency between runs, since set iteration order isn't consistent
    return sorted(
        {
            # Add primary taxonomy IDs
            *(
                source_outbreaks_df["taxonomy_id"].astype("string")
                if get_primary
                else ()
            ),
            # Add any highlight descendant taxonomy IDs. This field is
            # optional per outbreak, so the column may be absent entirely.
            *(
                source_outbreaks_df["highlight_descendant_taxonomy_ids"]
                .explode()
                .dropna()
                .astype("string")
                if get_descendants
                and "highlight_descendant_taxonomy_ids" in source_outbreaks_df.columns
                else ()
            ),
        },
        key=int,
    )


def save_taxonomy_mapping(
    source_outbreaks_df: pd.DataFrame | None,
    taxon_name_map: dict[str, str],
    taxon_rank_map: dict[str, str],
    output_path: str,
):
    """
    Create and save a TSV file with taxonomy ID to name and rank mapping.

    Args:
        source_outbreaks_df: Outbreak definitions containing resolved taxonomy IDs
        taxon_name_map: Mapping of taxonomy ID (as string) to name
        taxon_rank_map: Mapping of taxonomy ID (as string) to rank
        output_path: Path to save the TSV file
    """
    if source_outbreaks_df is None:
        return

    taxonomy_mapping_df = source_outbreaks_df[
        ["source_taxonomy_id", "taxonomy_id", "highlight_descendant_taxonomy_ids"]
    ]
    taxonomy_id_strings = taxonomy_mapping_df["taxonomy_id"].astype("string")
    taxonomy_mapping_df = taxonomy_mapping_df.assign(
        highlight_descendant_taxonomy_ids=taxonomy_mapping_df[
            "highlight_descendant_taxonomy_ids"
        ].map(lambda ids: ",".join([str(id) for id in ids]), na_action="ignore"),
        name=taxonomy_id_strings.map(taxon_name_map, na_action="ignore"),
        rank=taxonomy_id_strings.map(taxon_rank_map, na_action="ignore"),
    )

    # Save to TSV file
    taxonomy_mapping_df.to_csv(output_path, index=False, sep="\t")
    print(f"Wrote taxonomy mapping to {output_path}")


def save_workflow_taxonomy_mapping(source_workflows_df: pd.DataFrame, output_path: str):
    """
    Save a TSV file of workflows' resolved taxonomy IDs, for the TS build to read.

    Args:
        source_workflows_df: Workflow definitions containing resolved taxonomy IDs
        output_path: Path to save the TSV file
    """
    source_workflows_df[["source_taxonomy_id", "taxonomy_id"]].dropna().to_csv(
        output_path, index=False, sep="\t"
    )
    print(f"Wrote workflow taxonomy mapping to {output_path}")


def add_galaxy_datacache_url(
    genomes_df, normalized_base_url, directory_listing: pd.DataFrame
):
    """
    Add Galaxy Datacache URLs to genomes dataframe after validating they exist.

    Args:
        genomes_df: DataFrame containing genome information with 'accession' column
        normalized_base_url: Base URL used to construct the datacache link per accession. Must end in a slash.
        directory_listing: DataFrame containing link URLs from the datacache directory listing.

    Returns:
        tuple: (updated genomes_df with galaxyDatacacheUrl column, list of missing accessions)
    """
    genomes_df = genomes_df.copy()

    print("Validating Galaxy Datacache URLs...")

    available = {
        href[:-1]
        for href in directory_listing["url"]
        if href.endswith("/") and not href.startswith(("/", ".", "?", "http"))
    }

    # If the listing's contents are not as expected, we'd otherwise
    # silently mark every accession as missing. Fail loudly instead.
    if not available:
        raise RuntimeError(
            f"Datacache listing at {normalized_base_url} returned no directory entries; "
            "server's handling of directory listings may have changed."
        )

    accessions = genomes_df["accession"].tolist()
    datacache_urls = [
        f"{normalized_base_url}{accession}/" if accession in available else ""
        for accession in accessions
    ]
    missing_accessions = [
        a for a, url in zip(accessions, datacache_urls, strict=True) if not url
    ]

    print(
        f"Validated {len(accessions)} datacache URLs against {len(available)}-entry listing, "
        f"{len(missing_accessions)} not found"
    )

    genomes_df["galaxyDatacacheUrl"] = datacache_urls

    return genomes_df, missing_accessions


@dataclass
class BuildMetadata:
    start_time: str
    end_time: str
    ncbi_taxdump_md5: str


def save_build_metadata(path: str, meta: BuildMetadata):
    save_json_file(path, asdict(meta), indent=2)


@dataclass
class LoadAndTransformParams(LoadParams):
    """
    LoadParams necessary to load catalog data, extended with parameters needed to transform the loaded data.

    Attributes:
      taxonomic_levels: Taxonomic levels to build columns for during transformation
    """

    taxonomic_levels: list[str]


@dataclass
class LoadAndTransformResult:
    assemblies_source: pd.DataFrame
    organisms_source: pd.DataFrame
    workflows_source: pd.DataFrame | None
    outbreaks_source: pd.DataFrame | None
    ncbi_genomes: pd.DataFrame
    ucsc_assemblies: pd.DataFrame
    gen_ark_file_list: pd.DataFrame
    galaxy_datacache_listing: pd.DataFrame
    taxonomy_assemblies: pd.DataFrame
    taxonomy_organisms: pd.DataFrame
    taxonomy_outbreaks: pd.DataFrame | None
    ncbi_taxdump_md5: str
    dbt_test_results: list[DBTTestResult]


def load_and_transform(params: LoadAndTransformParams):
    """
    Load source data and NCBI taxonomy via dlt, transform it via dbt, and return the results.

    Recreates the temporary DuckDB database on each run (any existing one is deleted first)
    so that runs are consistent.

    Args:
      params: LoadAndTransformParams instance

    Returns:
      A LoadAndTransformResult containing the loaded and transformed data (as dataframes), the NCBI
      taxdump MD5, and the dbt test results
    """
    temp_folder_path = params.temp_folder_path

    print("Loading and transforming data via dlt + dbt")

    # Create temp folder if needed
    temp_folder_path.mkdir(exist_ok=True)

    # Delete any existing temporary database, to make runs more consistent
    get_db_path(temp_folder_path).unlink(missing_ok=True)

    # Load data via dlt
    load_result = do_dlt_load(params)

    # Determine presence of optional entity types
    has_curated_taxa = params.taxa_path is not None
    has_outbreaks = params.outbreaks_path is not None
    has_workflows = params.workflows_path is not None

    # Transform loaded data via dbt
    transform_result = do_dbt_transformations(
        temp_folder_path,
        taxonomic_levels=params.taxonomic_levels,
        has_curated_taxa=has_curated_taxa,
        has_outbreaks=has_outbreaks,
        has_workflows=has_workflows,
    )

    # Get transformed data and return along with metadata
    with duckdb.connect(get_db_path(temp_folder_path)) as con:
        return LoadAndTransformResult(
            assemblies_source=con.query("select * from catalog_source.assemblies").df(),
            organisms_source=con.query("select * from catalog_input_organisms").df(),
            workflows_source=(
                con.query("select * from catalog_input_workflows").df()
                if has_workflows
                else None
            ),
            outbreaks_source=(
                con.query("select * from catalog_input_outbreaks").df()
                if has_outbreaks
                else None
            ),
            ncbi_genomes=con.query("select * from ncbi_api.genomes").df(),
            ucsc_assemblies=con.query("select * from ucsc.assembly_list").df(),
            gen_ark_file_list=con.query(
                "select * from ucsc.gen_ark_file_list order by path"
            ).df(),
            galaxy_datacache_listing=con.query(
                "select * from galaxy.datacache_directory_listing"
            ).df(),
            taxonomy_assemblies=con.query("select * from taxonomy_assemblies").df(),
            taxonomy_organisms=con.query("select * from taxonomy_organisms").df(),
            taxonomy_outbreaks=(
                con.query("select * from taxonomy_outbreaks").df()
                if has_outbreaks
                else None
            ),
            ncbi_taxdump_md5=load_result.ncbi_taxdump_md5,
            dbt_test_results=transform_result.dbt_test_results,
        )


def build_files(
    assemblies_path,
    genomes_output_path,
    ucsc_assemblies_url,
    tree_output_path,
    taxonomic_levels_for_tree,
    *,
    temp_folder_path,
    dlt_pipeline_prefix,
    build_meta_output_path,
    datacache_base_url,
    taxonomic_group_sets=None,
    qc_report_path=None,
    qc_report_json_path=None,
    organisms_path,
    taxa_path=None,
    outbreaks_path=None,
    outbreak_taxonomy_mapping_path=None,
    workflows_path=None,
    workflow_taxonomy_mapping_path=None,
    organism_image_path=None,
    organism_image_source_information_path=None,
):
    """
    Build catalog-related data files based on specified input data and data from services such as the NCBI API.

    Args:
      assemblies_path: Path of input assemblies YAML
      genomes_output_path: Path to save output assemblies TSV at
      ucsc_assemblies_url: URL to fetch UCSC's assembly information from
      tree_output_path: Path to save tree of cataloged taxa to
      taxonomic_levels_for_tree: List of lowercase taxonomic ranks, as identified by NCBI, to build tree from; listed from highest to lowest level (with order being insignificant for categories that are at the same level as each other)
      taxonomic_group_sets: Dict describing taxa or groups of taxa to be given specified names in the "taxonomic group" field
      qc_report_path: Path to save QC report to (if omitted, no report is generated)
      organisms_path: Path of input organisms YAML, used to perform checks
      taxa_path: Path of input curated taxa YAML
      outbreaks_path: Path of input outbreaks YAML
      outbreak_taxonomy_mapping_path: Path to save taxonomic information for outbreaks at
      workflows_path: Path of input workflows YAML
      workflow_taxonomy_mapping_path: Path to save taxonomic information for workflows at
      organism_image_path: path to folder containing organism images
      organism_image_source_information_path: path to json file with information about the image source
    """
    if taxonomic_group_sets is None:
        taxonomic_group_sets = {}

    if not datacache_base_url.endswith("/"):
        datacache_base_url = f"{datacache_base_url}/"

    print("Building files")

    start_time = datetime.datetime.now(datetime.UTC).isoformat()

    qc_report_params = {}

    # Do database-based loading and transformation
    load_and_transform_result = load_and_transform(
        LoadAndTransformParams(
            temp_folder_path=Path(temp_folder_path).resolve(),
            dlt_pipeline_prefix=dlt_pipeline_prefix,
            taxonomic_levels=taxonomic_levels_for_tree,
            assemblies_path=Path(assemblies_path),
            organisms_path=Path(organisms_path),
            workflows_path=None if workflows_path is None else Path(workflows_path),
            taxa_path=None if taxa_path is None else Path(taxa_path),
            outbreaks_path=None if outbreaks_path is None else Path(outbreaks_path),
            ucsc_assemblies_url=ucsc_assemblies_url,
            galaxy_datacache_directory_url=datacache_base_url,
        )
    )
    source_list_df = load_and_transform_result.assemblies_source
    source_organisms_df = load_and_transform_result.organisms_source.sort_values(
        by="taxonomy_id"
    ).astype({"taxonomy_id": "string"})
    # Outbreaks and workflows are optional (only some catalogs use them), so the corresponding dataframes below are None when no path is given
    source_outbreaks_df = load_and_transform_result.outbreaks_source
    if source_outbreaks_df is not None:
        source_outbreaks_df = source_outbreaks_df.sort_values(by="taxonomy_id")
    source_workflows_df = load_and_transform_result.workflows_source
    ucsc_assemblies_df = load_and_transform_result.ucsc_assemblies.rename(
        columns={
            "ucsc_browser": "ucscBrowser",
            "gen_bank": "genBank",
            "ref_seq": "refSeq",
        }
    )
    assembly_taxonomy_df = load_and_transform_result.taxonomy_assemblies
    organism_taxonomy_df = load_and_transform_result.taxonomy_organisms
    outbreak_taxonomy_df = load_and_transform_result.taxonomy_outbreaks
    qc_report_params["dbt_test_results"] = QcResultDbtTestResults(
        data={
            result.test_name: QcResultDbtTest(
                test_name=result.test_name,
                success=result.success,
                status=result.status,
                message=result.message,
                failures=(
                    None
                    if result.failure_count is None and not result.failure_sample
                    else QcResultDbtTestFailures(
                        count=result.failure_count or 0,
                        sample=QcResultDbtTestFailureSample(
                            data=result.failure_sample or []
                        ),
                    )
                ),
            )
            for result in load_and_transform_result.dbt_test_results
        }
    )

    if workflow_taxonomy_mapping_path is not None and source_workflows_df is not None:
        save_workflow_taxonomy_mapping(
            source_workflows_df, workflow_taxonomy_mapping_path
        )

    base_genomes_df = get_genomes_df(load_and_transform_result.ncbi_genomes)

    qc_report_params["missing_ncbi_assemblies"] = report_missing_values_from(
        QcResultMissingNcbiAssemblies,
        "accessions",
        "found on NCBI",
        source_list_df["accession"],
        base_genomes_df["accession"],
    )

    # Create species DataFrame using the assemblies' taxonomy
    species_df = get_species_df(
        assembly_taxonomy_df, taxonomic_group_sets, taxonomic_levels_for_tree
    )

    outbreak_taxonomy_ids = get_outbreak_taxonomy_ids(source_outbreaks_df)
    print(f"Found {len(outbreak_taxonomy_ids)} outbreak taxonomy IDs")
    # Add otherTaxa field with outbreak-associated taxa names
    if outbreak_taxonomy_ids:
        # Get taxon names and ranks for outbreak taxonomy IDs
        outbreak_taxon_name_map, outbreak_taxon_rank_map = build_taxon_maps(
            outbreak_taxonomy_df
        )

        # Set for O(1) membership tests in the per-row loop below
        outbreak_taxonomy_id_set = set(outbreak_taxonomy_ids)

        # For each row, check if any lineage taxonomy ID is in the outbreak taxonomy IDs
        # and add the corresponding taxon name to otherTaxa only if its rank is not in taxonomic_levels_for_tree
        def get_other_taxa(lineage_taxonomy_ids):
            taxa = []
            for tax_id in lineage_taxonomy_ids.split(","):
                if tax_id in outbreak_taxonomy_id_set:
                    # Check if this taxon's rank is already covered by taxonomic_levels_for_tree
                    rank = outbreak_taxon_rank_map.get(str(tax_id), "").lower()
                    tax_id_str = str(tax_id)
                    if (
                        rank not in taxonomic_levels_for_tree
                        and tax_id_str in outbreak_taxon_name_map
                    ):
                        # Add the taxon name (note: not the raw ID) if available
                        taxa.append(outbreak_taxon_name_map[tax_id_str])
            # Convert list to comma-separated string for build-assemblies.ts
            return ",".join(taxa) if taxa else None

        species_df["otherTaxa"] = species_df["lineageTaxonomyIds"].apply(get_other_taxa)

        all_lineage_ids = {
            id_str
            for lineage in species_df["lineageTaxonomyIds"]
            for id_str in lineage.split(",")
        }
        qc_report_params["outbreak_taxonomy_issues"] = check_outbreak_taxonomy_issues(
            outbreak_taxonomy_ids,
            outbreak_taxon_rank_map,
            outbreak_taxon_name_map,
            all_lineage_ids,
            taxonomic_levels_for_tree,
        )

    qc_report_params["missing_outbreak_descendants"] = (
        check_missing_outbreak_descendants(
            get_outbreak_taxonomy_ids(
                source_outbreaks_df, get_primary=False, get_descendants=True
            ),
            species_df["speciesTaxonomyId"],
        )
    )

    report_missing_values_from(
        lambda **_: None,
        "species",
        "found on NCBI",
        base_genomes_df["taxonomyId"],
        species_df["taxonomyId"],
    )

    genomes_with_species_df = base_genomes_df.merge(
        species_df, how="left", on="taxonomyId"
    )

    qc_report_params["inconsistent_taxonomy_ids"] = report_inconsistent_taxonomy_ids(
        genomes_with_species_df
    )

    # Create a mapping of both GenBank and RefSeq accessions to UCSC browser IDs
    ucsc_mapping = (
        pd.concat(
            [
                ucsc_assemblies_df[["ucscBrowser", "genBank"]].rename(
                    columns={"genBank": "accession"}
                ),
                ucsc_assemblies_df[["ucscBrowser", "refSeq"]].rename(
                    columns={"refSeq": "accession"}
                ),
            ]
        )
        .dropna()
        .drop_duplicates(subset=["accession"])
    )

    # Single merge with the combined mapping
    # The dataframe is sorted by accession for consistent output; any changes done after the sorting should preserve order
    genomes_df = genomes_with_species_df.merge(
        ucsc_mapping, how="left", on="accession"
    ).sort_values("accession", kind="stable")

    qc_report_params["missing_ucsc_assemblies"] = report_missing_values_from(
        QcResultMissingUcscAssemblies,
        "accessions",
        "matched in assembly list",
        genomes_with_species_df["accession"],
        ucsc_assemblies_df["genBank"],
        ucsc_assemblies_df["refSeq"],
    )

    genomes_df = genomes_df.merge(
        source_organisms_df[["taxonomy_id", "ploidy"]].set_index("taxonomy_id"),
        how="left",
        left_on="taxonomicLevelSpeciesId",
        right_index=True,
    )
    qc_report_params["missing_ploidy_assemblies"] = report_missing_ploidy_info(
        genomes_df
    )
    print(f"Checked ploidy for {len(genomes_df)} assemblies")

    genomes_df = add_gene_model_url(
        genomes_df, load_and_transform_result.gen_ark_file_list
    )
    qc_report_params["missing_gene_model_urls"] = report_missing_values(
        QcResultMissingGeneModelUrls,
        "accessions",
        "matched with gene model URLs",
        genomes_df["accession"],
        genomes_df["geneModelUrl"].notna(),
    )

    genomes_df, missing_datacache_urls = add_galaxy_datacache_url(
        genomes_df,
        datacache_base_url,
        load_and_transform_result.galaxy_datacache_listing,
    )
    qc_report_params["missing_datacache_urls"] = QcResultMissingDatacacheUrls(
        data=missing_datacache_urls
    )

    # Find outdated accessions (where accession != currentAccession)
    if qc_report_path:
        qc_report_params["outdated_accessions"] = find_outdated_accessions(genomes_df)
        qc_report_params["suppressed_genomes"] = find_suppressed_genomes(genomes_df)
        qc_report_params["paired_accessions"] = find_gca_with_paired_gcf(genomes_df)

    # Drop any duplicate rows based on accession before writing to file
    genomes_df = genomes_df.drop_duplicates(subset=["accession"])

    # If organism_image path is set we will try to find a image for each species using get_image_path
    if organism_image_path is not None:
        if organism_image_source_information_path is not None:
            with open(organism_image_source_information_path, "r") as reader:
                image_info = json.load(reader)
        else:
            image_info = {}
        # Get unique species names from genomes_df
        unique_species = genomes_df["taxonomicLevelSpecies"].unique()
        # Create a dictionary to store image paths for each species
        species_image_paths = {}
        species_thumbnail_paths = {}
        species_image_credit = {}
        species_image_license = {}
        species_image_source = {}
        species_image_source_link = {}
        for species in unique_species:
            species_image_paths[species] = get_image_path(organism_image_path, species)
            species_thumbnail_paths[species] = get_image_path(
                organism_image_path, species, file_suffix="_300x300.jpg"
            )
            species_image_credit[species] = image_info.get(species, {}).get(
                "author", None
            )
            species_image_license[species] = image_info.get(species, {}).get(
                "license", None
            )
            species_image_source[species] = image_info.get(species, {}).get(
                "image_source_name", None
            )
            species_image_source_link[species] = image_info.get(species, {}).get(
                "image_url", None
            )

        # Map the image paths back to the genomes_df
        genomes_df["organismImageUrl"] = genomes_df["species"].map(species_image_paths)
        genomes_df["organismThumbnailUrl"] = genomes_df["species"].map(
            species_thumbnail_paths
        )
        genomes_df["organismImageCredit"] = genomes_df["species"].map(
            species_image_credit
        )
        genomes_df["organismImageLicense"] = genomes_df["species"].map(
            species_image_license
        )
        genomes_df["organismImageSourceName"] = genomes_df["species"].map(
            species_image_source
        )
        genomes_df["organismImageSourceUrl"] = genomes_df["species"].map(
            species_image_source_link
        )

    genomes_df.to_csv(genomes_output_path, index=False, sep="\t")

    print(f"Wrote to {genomes_output_path}")

    # Use the assemblies info from genomes_df to build the species tree
    species_tree = get_species_tree(genomes_df, taxonomic_levels_for_tree)
    # Dump with sorted keys and consistent indentation
    save_json_file(tree_output_path, species_tree, indent=4, sort_keys=True)
    print(f"Wrote to {tree_output_path}")
    qc_report_params["tree_checks"] = do_taxonomy_tree_checks(
        species_tree, taxonomic_levels_for_tree, genomes_df.shape[0]
    )

    organism_taxon_name_map, organism_taxon_rank_map = build_taxon_maps(
        organism_taxonomy_df
    )
    qc_report_params["organisms_not_species_rank"] = check_organism_ranks(
        source_organisms_df["taxonomy_id"].tolist(),
        organism_taxon_rank_map,
        organism_taxon_name_map,
    )
    qc_report_params["organisms_without_assemblies"] = (
        check_organisms_without_assemblies(
            source_organisms_df["taxonomy_id"].tolist(),
            genomes_df["speciesTaxonomyId"],
            organism_taxon_name_map,
        )
    )

    qc_report = QcResultDataReport(**qc_report_params)
    if qc_report_json_path is not None:
        save_json_file(qc_report_json_path, qc_report.model_dump(mode="json"), indent=2)
    if qc_report_path is not None:
        qc_report_text = qc_report.format_markdown_text()
        with open(qc_report_path, "w") as file:
            file.write(qc_report_text)

    # If taxonomy_mapping_path is provided and we have outbreak taxonomy IDs,
    # save the taxonomy mapping for use by build-outbreaks.ts
    if outbreak_taxonomy_mapping_path is not None and outbreak_taxonomy_ids:
        print(f"Saving taxonomy mapping to {outbreak_taxonomy_mapping_path}")
        save_taxonomy_mapping(
            source_outbreaks_df,
            outbreak_taxon_name_map,
            outbreak_taxon_rank_map,
            outbreak_taxonomy_mapping_path,
        )

    end_time = datetime.datetime.now(datetime.UTC).isoformat()

    save_build_metadata(
        build_meta_output_path,
        BuildMetadata(
            start_time=start_time,
            end_time=end_time,
            ncbi_taxdump_md5=load_and_transform_result.ncbi_taxdump_md5,
        ),
    )


def get_image_path(
    folder_path: str, species_name: str, file_suffix: str = "_1024x1024.jpg"
) -> str:
    """
    Constructs a path to an image file for a given species, with a fallback to a default image.

    Args:
        folder_path (str): The directory where the images are stored.
        species_name (str): The name of the species.
        file_suffix (str, optional): The suffix to append to the formatted species name.
                                     Defaults to "_1024x1024.jpg".

    Returns:
        str: The full path to the image file.
    """
    # Format the species name: Capitalize first letter, rest lowercase, spaces to underscores
    formatted_name = species_name.lower().capitalize().replace(" ", "_")

    # Construct the potential image file path
    potential_path = os.path.join(folder_path, f"{formatted_name}{file_suffix}")

    # Check if the file exists
    if os.path.exists(potential_path):
        return potential_path
    else:
        # No species image found — return the missing-image marker path. The
        # catalog build detects this marker and emits a null image, so the
        # marker file itself does not need to exist on disk.
        print(f"No image found for {potential_path}.")
        return os.path.join(folder_path, "missing_image" + file_suffix)
