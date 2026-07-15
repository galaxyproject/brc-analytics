import datetime
import gzip
import io
import json
import logging
import os
import re
import time
import urllib
from dataclasses import asdict, dataclass
from pathlib import Path

import duckdb
import pandas as pd
import requests
import yaml
from bs4 import BeautifulSoup
from requests.exceptions import ConnectTimeout

from .load import do_dlt_load
from .qc_utils import format_list_section, format_raw_section, join_report
from .transform import DBTTestResult, do_dbt_transformations
from .utils import get_db_path

MAX_NCBI_URL_LENGTH = 2000  # The actual limit seems to be a bit over 4000

log = logging.getLogger(__name__)


def rate_limit_handler(request_call, max_retries=5):
    response = request_call()
    for attempt in range(max_retries):
        if response.status_code != 429:
            break
        # Use Retry-After if provided, otherwise use exponential backoff
        retry_after = max(
            int(response.headers.get("Retry-After", 0)), 2 ** (attempt + 1)
        )
        print(f"Rate limited, waiting {retry_after} seconds")
        time.sleep(retry_after)
        response = request_call()
    response.raise_for_status()
    return response


def post_ncbi_request(url, json_data, batch_size=1000, min_batch_size=50):
    """
    Makes a POST request to the NCBI API with error handling and rate limiting.
    Handles pagination if the response contains next_page_token and processes requests in batches.
    Adaptively reduces batch size if requests fail.

    Args:
      url: The API endpoint URL
      json_data: The data to send in the request body
      batch_size: Initial maximum number of items to process in a single request
      min_batch_size: Minimum batch size to try before giving up

    Returns:
      List of all reports from paginated responses

    Raises:
      Exception: If the request fails or contains errors even with minimum batch size
    """
    all_reports = []
    processed_count = 0

    # Get the list of IDs to process (assuming they're in a list in the json_data)
    id_key = next((k for k in json_data if isinstance(json_data[k], list)), None)
    if not id_key:
        raise ValueError("No list of IDs found in json_data")

    ids = json_data[id_key]
    total_ids = len(ids)
    current_batch_size = batch_size

    while processed_count < total_ids:
        # Create a batch of IDs
        batch = ids[processed_count : processed_count + current_batch_size]
        batch_num = processed_count // current_batch_size + 1
        print(
            f"Processing batch {batch_num} (size: {len(batch)}, {processed_count}/{total_ids})"
        )

        # Create a new json_data with just the current batch
        batch_data = {**json_data}
        batch_data[id_key] = batch

        # Add page_size parameter if not present
        if "page_size" not in batch_data:
            batch_data["page_size"] = 100

        success = False
        retry_count = 0

        # Try with progressively smaller batch sizes until success or minimum reached
        while not success and current_batch_size >= min_batch_size:
            try:
                batch_reports = []
                inner_page = 1

                # Remove any page token from previous attempts
                if "page_token" in batch_data:
                    del batch_data["page_token"]
                if "next_page_token" in batch_data:
                    del batch_data["next_page_token"]

                while True:
                    print(f"Requesting page {inner_page} (batch size: {len(batch)})")

                    # Add page token to request if it exists
                    if "next_page_token" in batch_data:
                        batch_data["page_token"] = batch_data.pop("next_page_token")

                    # Use rate_limit_handler to make the request with proper retry logic
                    response = rate_limit_handler(
                        lambda data=batch_data: requests.post(url, json=data)
                    )

                    if response.status_code != 200:
                        raise Exception(
                            f"Failed to fetch data: {response.status_code} {response.text}"
                        )

                    data = response.json()

                    if "reports" not in data:
                        if "total_count" in data:
                            # API returned total_count but no reports, likely too many results
                            total = data["total_count"]
                            print(f"API returned total_count of {total} but no reports")
                            raise ValueError(
                                "Too many results, need to reduce batch size"
                            )
                        else:
                            # Some other issue with the response
                            raise Exception(f"Unexpected response format: {data}")
                    else:
                        invalid = [r for r in data["reports"] if r.get("errors")]
                        if invalid:
                            for r in invalid:
                                print(
                                    f"Warning: Skipping unrecognized taxonomy ID(s): {r.get('query', [])}"
                                )
                            data["reports"] = [
                                r for r in data["reports"] if not r.get("errors")
                            ]

                    batch_reports.extend(data["reports"])

                    next_page_token = data.get("next_page_token")
                    if not next_page_token:
                        break

                    batch_data["next_page_token"] = next_page_token
                    inner_page += 1

                # If we get here, the batch was processed successfully
                all_reports.extend(batch_reports)
                processed_count += len(batch)
                success = True

            except ValueError as e:
                # Specific error for batch size issues
                if "reduce batch size" in str(e):
                    retry_count += 1
                    current_batch_size = max(current_batch_size // 2, min_batch_size)
                    print(f"Reducing batch size to {current_batch_size}")

                    # If we're at the minimum batch size, try with an even smaller page_size
                    if (
                        current_batch_size == min_batch_size
                        and batch_data["page_size"] > 10
                    ):
                        batch_data["page_size"] = batch_data["page_size"] // 2
                        new_page_size = batch_data["page_size"]
                        print(f"Also reducing page_size to {new_page_size}")
                else:
                    # Not a batch size issue, re-raise
                    raise
            except Exception as e:
                # For other exceptions, also try reducing batch size
                retry_count += 1
                if retry_count <= 3:  # Limit retries
                    current_batch_size = max(current_batch_size // 2, min_batch_size)
                    print(
                        f"Request failed. Reducing batch size to {current_batch_size}"
                    )
                else:
                    # Too many retries, give up
                    msg = f"Failed after {retry_count} retries with size {current_batch_size}"
                    raise Exception(msg) from e

        # If we couldn't process even with minimum batch size, raise exception
        if not success:
            msg = f"Failed to process batch even with minimum size of {min_batch_size}"
            raise Exception(msg)

        # Reset for next batch

    return all_reports


def read_assemblies(assemblies_path):
    with open(assemblies_path) as stream:
        return pd.DataFrame(yaml.safe_load(stream)["assemblies"])


def read_organisms(organisms_path):
    with open(organisms_path) as stream:
        organisms_data = yaml.safe_load(stream)["organisms"]
        # Convert taxonomy_id to string to ensure consistent type handling
        for organism in organisms_data:
            organism["taxonomy_id"] = str(organism["taxonomy_id"])
        return pd.DataFrame(organisms_data)


def read_outbreaks(outbreaks_path):
    if outbreaks_path is None:
        return None
    with open(outbreaks_path) as stream:
        return pd.DataFrame(yaml.safe_load(stream)["outbreaks"])


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
            # TODO: this may not be the most significant common name
            "commonName": assembly_taxonomy_df["common_names"].map(
                lambda names: names[0] if len(names) else None
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
    # Generate the tree, filling NA in the assemblies dataframe to enable grouping for absent values
    return get_species_subtree(
        "root", "1", "NA", assemblies_df.fillna(""), taxonomic_levels
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


def get_genome_row(genome_info):
    refseq_category = genome_info["assembly_info"].get("refseq_category")
    return {
        "strain": genome_info["organism"]
        .get("infraspecific_names", {})
        .get("strain", ""),
        "taxonomyId": str(genome_info["organism"]["tax_id"]),
        "releaseDate": genome_info["assembly_info"]["release_date"],
        "accession": genome_info["accession"],
        "currentAccession": genome_info.get(
            "current_accession", genome_info["accession"]
        ),
        "isRef": refseq_category == "reference genome",
        "level": genome_info["assembly_info"]["assembly_level"],
        "assemblyStatus": genome_info["assembly_info"].get(
            "assembly_status", "ASSEMBLY_STATUS_UNKNOWN"
        ),
        "chromosomeCount": genome_info["assembly_stats"].get(
            "total_number_of_chromosomes"
        ),
        "length": genome_info["assembly_stats"]["total_sequence_length"],
        "scaffoldCount": genome_info["assembly_stats"].get("number_of_scaffolds"),
        "scaffoldN50": genome_info["assembly_stats"].get("scaffold_n50"),
        "scaffoldL50": genome_info["assembly_stats"].get("scaffold_l50"),
        "coverage": genome_info["assembly_stats"].get("genome_coverage"),
        "gcPercent": genome_info["assembly_stats"].get("gc_percent"),
        "annotationStatus": genome_info.get("annotation_info", {}).get("status"),
        "pairedAccession": genome_info.get("paired_accession"),
    }


def get_biosample_data(genome_info):
    return {
        "accession": genome_info["accession"],
        "biosample": genome_info["assembly_info"]["biosample"]["accession"],
        "sample_ids": ",".join(
            [
                f"{sample['db']}:{sample['value']}"
                for sample in genome_info["assembly_info"]["biosample"].get(
                    "sample_ids", ""
                )
                if "db" in sample
            ]
        ),
    }


def get_genomes_and_primarydata_df(accessions):
    """
    Fetches genome information and creates DataFrames for genomes and biosample data.

    Args:
      accessions: List of genome accessions to fetch information for

    Returns:
      Tuple of (genomes_df, biosample_df)
    """
    # Convert pandas Series to list if necessary
    if isinstance(accessions, pd.Series):
        accessions = accessions.tolist()

    url = "https://api.ncbi.nlm.nih.gov/datasets/v2/genome/dataset_report"

    # Use post_ncbi_request with adaptive batch sizing
    reports = post_ncbi_request(
        url,
        {
            "accessions": accessions,
            "filters": {
                "assembly_version": "all_assemblies"  # Include old or suppressed assemblies
            },
            "page_size": 500,  # Initial page size for pagination
        },
    )

    return (
        pd.DataFrame(data=[get_genome_row(info) for info in reports]),
        pd.DataFrame(
            data=[
                get_biosample_data(info)
                for info in reports
                if "biosample" in info["assembly_info"]
            ]
        ),
    )


def _get_gene_model_urls_from_genark_list():
    """Download and parse the genArkFileList.txt.gz file to extract GTF URLs.

    Returns:
        dict: A dictionary mapping genome assembly IDs to their GTF file URLs
    """

    print("Downloading genArkFileList.txt.gz...")
    genark_url = "https://hgdownload.soe.ucsc.edu/hubs/genArkFileList.txt.gz"
    download_base_url = "https://hgdownload.soe.ucsc.edu/hubs"
    response = requests.get(genark_url)
    response.raise_for_status()

    # Dictionary to store the best GTF URL for each assembly ID
    gene_model_urls = {}

    # Process the gzipped file content
    with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as f:
        for line in f:
            line = line.decode("utf-8").strip()
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
                                if (
                                    "ncbiRefSeq" in url
                                    and "ncbiRefSeq" not in current_url
                                ):
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


def add_gene_model_url(genomes_df: pd.DataFrame):
    """Add gene model URLs to the genomes DataFrame using the genArkFileList.txt.gz file.

    Args:
        genomes_df: DataFrame containing genome information with 'accession' column

    Returns:
        DataFrame with added 'geneModelUrl' column
    """
    print("Fetching gene model URLs from genArkFileList.txt.gz")

    # Get all gene model URLs at once
    gene_model_urls = _get_gene_model_urls_from_genark_list()

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


def report_missing_values_from(
    values_name, message_predicate, all_values_series, *partial_values_series
):
    present_values_mask = pd.Series(False, index=all_values_series.index)
    for series in partial_values_series:
        present_values_mask |= all_values_series.isin(series)
    return report_missing_values(
        values_name, message_predicate, all_values_series, present_values_mask
    )


def report_missing_values(
    values_name, message_predicate, values_series, present_values_mask
):
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
    return missing_values


def report_inconsistent_taxonomy_ids(df):
    inconsistent_ids_series = (
        df.groupby(["species", "strain"])
        .filter(lambda g: g["taxonomyId"].nunique() > 1)
        .groupby(["species", "strain"])["taxonomyId"]
        .apply(set)
    )
    inconsistent_ids_strings = [
        (
            f"{species} strain {strain}" if strain else species,
            ", ".join([str(id) for id in ids]),
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
    return inconsistent_ids_strings


def do_taxonomy_tree_checks(tree, taxonomic_levels, assembly_count):
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

    return {
        "assemblies_actual_vs_expected": (
            None
            if combined_assembly_count == assembly_count
            else (combined_assembly_count, assembly_count)
        ),
        "leaves_missing_species": leaves_missing_species,
        "zero_assemblies_taxa": zero_assemblies_taxa,
        "missing_ranks": set(taxonomic_levels) - present_ranks,
    }


def fetch_sra_metadata(srs_ids, batch_size=20):
    """
    Fetches metadata for a list of SRS IDs from the SRA database.

    This function retrieves metadata for a given list of SRS (SRA Sample) IDs by querying the NCBI and EBI databases.
    It fetches the metadata in batches and handles retries and waiting mechanisms for failed requests. The metadata includes
    information about the experiment, platform, instrument, library, and associated files.

    Args:
      srs_ids (list): A list of SRS IDs to fetch metadata for.
      batch_size (int, optional): The number of SRS IDs to process in each batch. Defaults to 20.

    Returns:
      dict: A dictionary containing the fetched metadata, organized by sample accession and run accession.

    Raises:
      Exception: If the data could not be fetched after the specified number of retries or if duplicate entries are found.
    """

    def fetch_url_data(url, counter=0, counter_limit=2, wait_time=2, num_retry=3):
        """
        Fetches data from a given URL with retry and wait mechanisms.
        Args:
          url (str): The URL to fetch data from.
          counter (int, optional): The current retry counter. Defaults to 0.
          counter_limit (int, optional): The maximum number of retries before waiting. Defaults to 3.
          wait_time (int, optional): The time to wait before retrying in seconds. Defaults to 5.
          num_retry (int, optional): The number of retry attempts. Defaults to 3.
        Returns:
          tuple: A tuple containing the JSON response and the updated counter.
        Raises:
          Exception: If the data could not be fetched after the specified number of retries.
        """
        if counter > counter_limit:
            time.sleep(wait_time)
            counter = 0

        response = requests.get(url)
        while num_retry > 0 and response.status_code != 200:
            time.sleep(wait_time)
            log.debug(
                f"Failed to fetch, status: {response.status_code}, url: {url}. Retrying..."
            )
            response = requests.get(url)
            num_retry -= 1

        if num_retry <= 0:
            raise Exception(
                f"Failed to fetch, status: {response.status_code}, url: {url} "
            )
        log.debug(f"Fetching data from {url}")
        return response, counter + 1

    if srs_ids is None:
        return None

    data = {}
    counter = 0
    samples_processed = 0
    for i in range(0, len(srs_ids), batch_size):
        print(
            f"Processing metadata for samples: {samples_processed} of {len(srs_ids)}",
            end="\r",
        )
        batch_srs_id = srs_ids[i : i + batch_size]
        samples_processed += len(batch_srs_id)
        search_data, counter = fetch_url_data(
            f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=sra&term={'+OR+'.join(batch_srs_id)}&retmode=json&retmax=1000",
            counter,
        )
        search_data = search_data.json()

        if int(search_data.get("esearchresult", {}).get("count", 0)) == 0:
            log.debug(f"No SRR IDs found for SRS {batch_srs_id}")
            return None

        # Extract SRR IDs
        srr_ids = search_data.get("esearchresult", {}).get("idlist", [])
        if srr_ids:
            for i in range(0, len(srr_ids), batch_size):
                batch_srr_id = srr_ids[i : i + batch_size]
                summary_data, counter = fetch_url_data(
                    f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=sra&id={','.join(batch_srr_id)}&retmode=json&retmax=1000",
                    counter,
                )
                summary_data = summary_data.json()
                if "result" in summary_data:
                    for result in summary_data["result"]["uids"]:
                        exp_soup = BeautifulSoup(
                            f"<Root>{summary_data['result'][result]['expxml']}</Root>",
                            "xml",
                        )
                        run_soup = BeautifulSoup(
                            f"<Root>{summary_data['result'][result]['runs']}</Root>",
                            "xml",
                        )

                        library_layout = exp_soup.find("LIBRARY_LAYOUT").find().name
                        title = exp_soup.find("Title").text
                        platform = exp_soup.find("Platform").text
                        instrument = exp_soup.find("Platform")["instrument_model"]
                        organism_name = exp_soup.find("Organism").get(
                            "ScientificName", ""
                        )
                        total_spots = exp_soup.find("Statistics")["total_spots"]
                        total_bases = exp_soup.find("Statistics")["total_bases"]

                        sra_experiment_acc = exp_soup.find("Experiment")["acc"]
                        sra_sample_acc = exp_soup.find("Sample")["acc"]
                        sra_study_acc = exp_soup.find("Study")["acc"]
                        sra_submitter_acc = exp_soup.find("Submitter")["acc"]

                        library_name = (
                            exp_soup.find("LIBRARY_NAME").text
                            if exp_soup.find("LIBRARY_NAME")
                            else ""
                        )
                        library_strategy = (
                            exp_soup.find("LIBRARY_STRATEGY").text
                            if exp_soup.find("LIBRARY_STRATEGY")
                            else ""
                        )
                        library_source = (
                            exp_soup.find("LIBRARY_SOURCE").text
                            if exp_soup.find("LIBRARY_SOURCE")
                            else ""
                        )
                        library_selection = (
                            exp_soup.find("LIBRARY_SELECTION").text
                            if exp_soup.find("LIBRARY_SELECTION")
                            else ""
                        )
                        bioproject_elem = exp_soup.find("Bioproject")
                        bioproject = bioproject_elem.text if bioproject_elem else ""

                        for run in run_soup.find_all("Run"):
                            sra_run_acc = run["acc"]
                            run_total_bases = run["total_bases"]
                            run_total_spots = run["total_spots"]

                            d = {
                                "title": title,
                                "platform": platform,
                                "instrument": instrument,
                                "total_spots": total_spots,
                                "total_bases": total_bases,
                                "bioproject": bioproject,
                                "organism_name": organism_name,
                                "library_name": library_name,
                                "library_layout": library_layout,
                                "library_strategy": library_strategy,
                                "library_source": library_source,
                                "library_selection": library_selection,
                                "sra_experiment_acc": sra_experiment_acc,
                                "sra_run_acc": sra_run_acc,
                                "sra_sample_acc": sra_sample_acc,
                                "sra_study_acc": sra_study_acc,
                                "sra_submitter_acc": sra_submitter_acc,
                                "run_total_bases": run_total_bases,
                                "run_total_spots": run_total_spots,
                            }

                            if sra_sample_acc in data:
                                if sra_run_acc in data[sra_sample_acc]:
                                    raise Exception(
                                        f"Duplicate biosample run_acc {sra_run_acc} found {sra_sample_acc}"
                                    )
                                else:
                                    data[sra_sample_acc][sra_run_acc] = d
                            else:
                                data[sra_sample_acc] = {sra_run_acc: d}
    print(
        f"Processing metadata for samples: {samples_processed} of {len(srs_ids)}",
        end="\n",
    )
    samples_processed = 0
    for sample_acc in data:
        print(f"Adding file urls to : {samples_processed} of {len(data)}", end="\r")
        samples_processed += 1
        # Fetch url, file size and md5 for raw/primary data files
        file_list_data, counter = fetch_url_data(
            f"https://www.ebi.ac.uk/ena/portal/api/filereport?accession={sample_acc}&result=read_run&format=json&retmax=1000",
            counter,
        )
        file_list_data = file_list_data.json()
        for result in file_list_data:
            if result["run_accession"] not in data[sample_acc]:
                raise Exception(
                    f"Not metadata found for {result['run_accession']} {sample_acc}"
                )
            if "fastq_ftp" in data[sample_acc][result["run_accession"]]:
                raise Exception(
                    f"Duplicate file list entry for {result['run_accession']}  {sample_acc}"
                )

            data[sample_acc][result["run_accession"]]["file_urls"] = result["fastq_ftp"]
            data[sample_acc][result["run_accession"]]["file_size"] = result[
                "fastq_bytes"
            ]
            data[sample_acc][result["run_accession"]]["file_md5"] = result["fastq_md5"]

            data[sample_acc][result["run_accession"]]["file_urls"] = result["fastq_ftp"]
            data[sample_acc][result["run_accession"]]["file_size"] = result[
                "fastq_bytes"
            ]
            data[sample_acc][result["run_accession"]]["file_md5"] = result["fastq_md5"]

            if not len(data[sample_acc][result["run_accession"]]["file_urls"]):
                # Some raw or primary data has been uploaded but not properly processed by SRA.
                # These files will lack https/ftp URLs and statistics, looks like these are
                # BAM files that are labeled as FASTQ.
                # For these, we can retrieve S3 links instead.
                file_list_data, counter = fetch_url_data(
                    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=sra&id=SRR25741043&retmode=xml",
                    counter,
                )
                srafile_soup = BeautifulSoup(file_list_data.text, "xml")
                for file in srafile_soup.findAll("SRAFile"):
                    if file["supertype"] == "Original":
                        alternatives = file.find("Alternatives")
                        data[sample_acc][result["run_accession"]]["file_urls"] = (
                            alternatives["url"]
                        )
                        data[sample_acc][result["run_accession"]]["file_size"] = file[
                            "size"
                        ]
                        data[sample_acc][result["run_accession"]]["file_md5"] = file[
                            "md5"
                        ]
    print(f"Adding file urls to : {samples_processed} of {len(data)}", end="\n")
    return data


def report_missing_ploidy_info(genomes_df, organisms_df):
    """
    Reports assemblies that are missing ploidy information.

    Args:
        genomes_df: DataFrame containing genome information
        organisms_df: DataFrame containing organism information, including ploidy information

    Returns:
        A list of tuples containing (accession, speciesTaxonomyId) for assemblies without ploidy information
    """
    # Create a mapping from taxonomy_id to ploidy
    ploidy_map = organisms_df.set_index("taxonomy_id")["ploidy"].to_dict()

    # Create a DataFrame with just the relevant columns for the check
    check_df = genomes_df[["accession", "speciesTaxonomyId", "species"]].copy()

    # Check which species tax IDs we have ploidy information for
    check_df["has_ploidy"] = check_df["speciesTaxonomyId"].apply(
        lambda tax_id: tax_id in ploidy_map
    )

    # Find assemblies where we have no ploidy information
    missing_ploidy = check_df[~check_df["has_ploidy"]]
    missing_count = len(missing_ploidy)

    if missing_count > 0:
        print(f"Warning: Found {missing_count} assemblies without ploidy information")
        print("Missing ploidy assemblies:")
        for _, row in missing_ploidy.iterrows():
            print(f"  {row['accession']}: {row['speciesTaxonomyId']}")

    return list(zip(missing_ploidy["accession"], missing_ploidy["speciesTaxonomyId"]))


def check_missing_outbreak_descendants(outbreak_taxonomy_ids, all_taxonomy_ids):
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

    return missing_ids


def find_outdated_accessions(genomes_df):
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
    return outdated_assemblies


def find_suppressed_genomes(genomes_df):
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
    return suppressed_assemblies


def find_gca_with_paired_gcf(genomes_df):
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
    return paired_assemblies


def check_outbreak_taxonomy_issues(
    outbreak_taxonomy_ids,
    taxon_rank_map,
    taxon_name_map,
    all_lineage_ids,
    taxonomic_levels_for_tree,
):
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
    return issues


def check_organism_ranks(organism_taxonomy_ids, taxon_rank_map, taxon_name_map):
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
    return [
        (
            tax_id,
            taxon_name_map.get(str(tax_id), str(tax_id)),
            taxon_rank_map.get(str(tax_id), "unknown").lower(),
        )
        for tax_id in organism_taxonomy_ids
        if taxon_rank_map.get(str(tax_id), "").lower() != "species"
    ]


def check_organisms_without_assemblies(
    organism_taxonomy_ids, species_taxonomy_ids, taxon_name_map
):
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
    return [
        (tax_id, taxon_name_map.get(str(tax_id), str(tax_id)))
        for tax_id in organism_taxonomy_ids
        if str(tax_id) not in species_ids_set
    ]


def make_qc_report(
    *,
    missing_ncbi_assemblies,
    inconsistent_taxonomy_ids,
    missing_ucsc_assemblies,
    dbt_test_results,
    missing_gene_model_urls=None,
    missing_datacache_urls=None,
    missing_ploidy_assemblies=None,
    missing_outbreak_descendants=None,
    tree_checks=None,
    outdated_accessions=None,
    suppressed_genomes=None,
    paired_accessions=None,
    outbreak_taxonomy_issues=None,
    organisms_not_species_rank=None,
    organisms_without_assemblies=None,
):
    # Convert simple lists to items for format_list_section
    ncbi_assemblies_items = (
        list(missing_ncbi_assemblies) if len(missing_ncbi_assemblies) > 0 else []
    )
    ucsc_assemblies_items = (
        list(missing_ucsc_assemblies) if len(missing_ucsc_assemblies) > 0 else []
    )
    gene_model_urls_items = (
        list(missing_gene_model_urls)
        if missing_gene_model_urls is not None and len(missing_gene_model_urls) > 0
        else None
    )
    datacache_urls_items = (
        list(missing_datacache_urls)
        if missing_datacache_urls is not None and len(missing_datacache_urls) > 0
        else []
    )
    taxonomy_ids_items = (
        [f"{taxon}: {ids}" for taxon, ids in inconsistent_taxonomy_ids]
        if inconsistent_taxonomy_ids
        else []
    )
    ploidy_assemblies_items = (
        [
            f"{accession} (speciesTaxonomyId: {tax_id})"
            for accession, tax_id in missing_ploidy_assemblies
        ]
        if missing_ploidy_assemblies
        else None
    )
    outbreak_descendants_items = (
        [str(tax_id) for tax_id in missing_outbreak_descendants]
        if missing_outbreak_descendants
        else []
    )
    if tree_checks is None:
        tree_checks_text = "No checks done"
    else:
        tree_assemblies_actual_vs_expected = tree_checks[
            "assemblies_actual_vs_expected"
        ]
        tree_leaves_missing_species = tree_checks["leaves_missing_species"]
        tree_zero_assemblies_taxa = tree_checks["zero_assemblies_taxa"]
        tree_missing_ranks = tree_checks["missing_ranks"]
        tree_checks_text = "Assembly count mismatch: " + (
            "None"
            if tree_assemblies_actual_vs_expected is None
            else f"Found combined assembly count of {tree_assemblies_actual_vs_expected[0]} among nodes of species rank, expected {tree_assemblies_actual_vs_expected[1]}"
        )
        tree_checks_text += "\n\nList of leaves without species in lineage: " + (
            "None"
            if not tree_leaves_missing_species
            else ", ".join(tree_leaves_missing_species)
        )
        tree_checks_text += "\n\nList of taxa with assembly count 0: " + (
            "None"
            if not tree_zero_assemblies_taxa
            else ", ".join(tree_zero_assemblies_taxa)
        )
        tree_checks_text += (
            "\n\nList of taxonomic levels specified in parameters but absent in tree: "
            + ("None" if not tree_missing_ranks else ", ".join(tree_missing_ranks))
        )

    outdated_accessions_items = (
        [f"{acc} (current: {curr_acc})" for acc, curr_acc in outdated_accessions]
        if outdated_accessions
        else []
    )
    suppressed_genomes_items = (
        [f"{acc} (status: {status})" for acc, status in suppressed_genomes]
        if suppressed_genomes
        else []
    )
    paired_accessions_items = (
        [f"{gca} (paired RefSeq: {gcf})" for gca, gcf in paired_accessions]
        if paired_accessions
        else []
    )
    outbreak_taxonomy_issues_items = (
        [
            f"{tax_id}: {name} ({reason})"
            for tax_id, name, reason in outbreak_taxonomy_issues
        ]
        if outbreak_taxonomy_issues
        else []
    )
    organisms_not_species_rank_items = (
        [
            f"{tax_id}: {name} (rank: {rank})"
            for tax_id, name, rank in organisms_not_species_rank
        ]
        if organisms_not_species_rank
        else []
    )
    organisms_without_assemblies_items = (
        [f"{tax_id}: {name}" for tax_id, name in organisms_without_assemblies]
        if organisms_without_assemblies
        else []
    )
    failing_dbt_tests_items = [
        f"`{result.test_name}`{'' if result.message is None else ': ' + result.message}"
        for result in dbt_test_results
        if result.failed
    ]

    # Compose report modularly using shared QC utils
    lines = ["# Catalog Data QC report", ""]
    lines += format_list_section(
        "## Assemblies not found on NCBI", ncbi_assemblies_items
    )
    lines += format_list_section(
        "## Assemblies not found in UCSC list", ucsc_assemblies_items
    )
    # Gene model URLs can be None (N/A case)
    if gene_model_urls_items is None:
        lines += format_raw_section(
            "## Assemblies with gene model URLs not found", "N/A"
        )
    else:
        lines += format_list_section(
            "## Assemblies with gene model URLs not found", gene_model_urls_items
        )
    lines += format_list_section(
        "## Assemblies with datacache URLs not found", datacache_urls_items
    )
    lines += format_list_section(
        "## Species and strain combinations with multiple taxonomy IDs",
        taxonomy_ids_items,
    )
    # Ploidy assemblies can be None (N/A case)
    if ploidy_assemblies_items is None:
        lines += format_raw_section("## Assemblies without ploidy information", "N/A")
    else:
        lines += format_list_section(
            "## Assemblies without ploidy information", ploidy_assemblies_items
        )
    lines += format_list_section(
        "## Outbreak descendant taxonomy IDs not found in genomes data",
        outbreak_descendants_items,
    )
    lines += format_list_section(
        "## Outbreak primary taxonomy ID issues (not in catalog or below species rank)",
        outbreak_taxonomy_issues_items,
    )
    lines += format_list_section(
        "## Organisms not at species rank", organisms_not_species_rank_items
    )
    lines += format_list_section(
        "## Organisms not matched to any assembly", organisms_without_assemblies_items
    )
    lines += format_list_section(
        "## Outdated assembly accessions", outdated_accessions_items
    )
    lines += format_list_section(
        "## Suppressed or retired genomes", suppressed_genomes_items
    )
    lines += format_list_section(
        "## GenBank assemblies with paired RefSeq accessions",
        paired_accessions_items,
    )
    lines += format_raw_section("## Taxonomy tree", tree_checks_text)
    lines += format_list_section("## Failing dbt tests", failing_dbt_tests_items)

    return join_report(lines)


def build_taxon_maps(taxonomy_df):
    """
    Build lookups from taxonomy ID (as string) to taxon name and rank.

    Args:
        taxonomy_df: DataFrame with taxonomy_id, taxon_name and rank columns

    Returns:
        Tuple of (name_map, rank_map) dicts keyed by taxonomy ID string
    """
    taxon_id_strings = taxonomy_df["taxonomy_id"].astype("string")
    name_map = dict(zip(taxon_id_strings, taxonomy_df["taxon_name"]))
    rank_map = dict(zip(taxon_id_strings, taxonomy_df["rank"]))
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

    # Return list of unique taxonomy IDs, converted to strings
    return list(
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
        }
    )


def save_taxonomy_mapping(taxonomy_ids, taxon_name_map, taxon_rank_map, output_path):
    """
    Create and save a TSV file with taxonomy ID to name and rank mapping.

    Args:
        taxonomy_ids: List of taxonomy IDs to include in the mapping
        output_path: Path to save the TSV file
    """
    if not taxonomy_ids:
        return

    # Create DataFrame with taxonomy ID, name, and rank
    rows = []
    for tax_id in taxonomy_ids:
        if str(tax_id) in taxon_name_map:
            rows.append(
                {
                    "taxonomy_id": tax_id,
                    "name": taxon_name_map.get(str(tax_id), ""),
                    "rank": taxon_rank_map.get(str(tax_id), ""),
                }
            )

    # Save to TSV file
    if rows:
        pd.DataFrame(rows).to_csv(output_path, index=False, sep="\t")
        print(f"Wrote taxonomy mapping to {output_path}")


def add_galaxy_datacache_url(genomes_df, base_url, timeout=30):
    """
    Add Galaxy Datacache URLs to genomes dataframe after validating they exist.

    Fetches the parent directory listing once and checks accession membership
    against it, rather than issuing a request per accession.

    Args:
        genomes_df: DataFrame containing genome information with 'accession' column
        base_url: Base URL used to construct the datacache link per accession
        timeout: Timeout in seconds for the listing request (default: 30)

    Returns:
        tuple: (updated genomes_df with galaxyDatacacheUrl column, list of missing accessions)
    """
    genomes_df = genomes_df.copy()

    if not base_url:
        genomes_df["galaxyDatacacheUrl"] = ""
        return genomes_df, []

    normalized_base_url = base_url if base_url.endswith("/") else f"{base_url}/"

    print("Validating Galaxy Datacache URLs...")

    response = requests.get(normalized_base_url, timeout=timeout)
    response.raise_for_status()
    available = {
        entry
        for entry in re.findall(r'href="([^"]+)/"', response.text)
        if not entry.startswith(("/", ".", "?", "http"))
    }

    # If autoindex is disabled or the response is unexpected, we'd otherwise
    # silently mark every accession as missing. Fail loudly instead.
    if not available:
        raise RuntimeError(
            f"Datacache listing at {normalized_base_url} returned no directory entries; "
            "server may have disabled directory listing."
        )

    accessions = genomes_df["accession"].tolist()
    datacache_urls = [
        f"{normalized_base_url}{accession}/" if accession in available else ""
        for accession in accessions
    ]
    missing_accessions = [a for a, url in zip(accessions, datacache_urls) if not url]

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
    meta_dict = asdict(meta)
    with open(path, mode="w", encoding="utf-8") as fh:
        json.dump(meta_dict, fh, indent=2)


@dataclass
class LoadAndTransformResult:
    taxonomy_assemblies: pd.DataFrame
    taxonomy_organisms: pd.DataFrame
    taxonomy_outbreaks: pd.DataFrame
    ncbi_taxdump_md5: str
    dbt_test_results: list[DBTTestResult]


def load_and_transform(
    *,
    temp_folder_path_string: str,
    dlt_pipeline_prefix: str,
    taxonomic_levels: list[str],
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame | None,
):
    """
    Load source data and NCBI taxonomy via dlt, transform it via dbt, and return the results.

    Recreates the temporary DuckDB database on each run (any existing one is deleted first)
    so that runs are consistent.

    Args:
      temp_folder_path_string: Path of the temporary folder to hold downloads and the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to dlt pipeline names
      taxonomic_levels: Taxonomic levels to build columns for during transformation
      assemblies_df: DataFrame of source assemblies (must include a `taxonomy_id` column)
      organisms_df: DataFrame of source organisms (must include a `taxonomy_id` column)
      outbreaks_df: DataFrame of source outbreaks (must include a `taxonomy_id` column), or None for catalogs without outbreaks

    Returns:
      A LoadAndTransformResult with the transformed taxonomy DataFrames, the NCBI taxdump
      MD5, and the dbt test results
    """
    temp_folder_path = Path(temp_folder_path_string).resolve()

    print("Loading and transforming data via dlt + dbt")

    # Create temp folder if needed
    temp_folder_path.mkdir(exist_ok=True)

    # Delete any existing temporary database, to make runs more consistent
    get_db_path(temp_folder_path).unlink(missing_ok=True)

    # Load data via dlt
    load_result = do_dlt_load(
        temp_folder_path=temp_folder_path,
        dlt_pipeline_prefix=dlt_pipeline_prefix,
        assemblies_df=assemblies_df,
        organisms_df=organisms_df,
        outbreaks_df=outbreaks_df,
    )

    # Transform loaded data via dbt
    transform_result = do_dbt_transformations(
        temp_folder_path,
        taxonomic_levels=taxonomic_levels,
        has_outbreaks=outbreaks_df is not None,
    )

    # Get transformed data and return along with metadata
    with duckdb.connect(get_db_path(temp_folder_path)) as con:
        return LoadAndTransformResult(
            taxonomy_assemblies=con.query("select * from taxonomy_assemblies").df(),
            taxonomy_organisms=con.query("select * from taxonomy_organisms").df(),
            taxonomy_outbreaks=con.query("select * from taxonomy_outbreaks").df(),
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
    taxonomic_group_sets=None,
    do_gene_model_urls=True,
    extract_primary_data=False,
    primary_output_path=None,
    qc_report_path=None,
    organisms_path,
    outbreaks_path=None,
    outbreak_taxonomy_mapping_path=None,
    organism_image_path=None,
    organism_image_source_information_path=None,
    datacache_base_url=None,
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
      do_gene_model_urls: Boolean specifying whether to fetch gene model URLs (if False, the `geneModelUrl` column is filled with empty string)
      extract_primary_data: Boolean specifying whether to fetch and save metadata from SRA
      primary_output_path: Path to save SRA metadata at
      qc_report_path: Path to save QC report to (if omitted, no report is generated)
      organisms_path: Path of input organisms YAML, used to perform checks
      outbreaks_path: Path of input outbreaks YAML
      outbreak_taxonomy_mapping_path: Path to save taxonomic information for outbreaks at
      organism_image_path: path to folder containing organism images
      organism_image_source_information_path: path to json file with information about the image source
    """
    if taxonomic_group_sets is None:
        taxonomic_group_sets = {}
    print("Building files")

    start_time = datetime.datetime.now(datetime.UTC).isoformat()

    qc_report_params = {}

    # We'll get the taxa names after we've built the species info to reuse the taxon maps

    source_list_df = read_assemblies(assemblies_path)

    base_genomes_df, primarydata_df = get_genomes_and_primarydata_df(
        source_list_df["accession"]
    )

    primarydata_df["sra_sample_acc"] = primarydata_df["sample_ids"].str.split(",")
    primarydata_df = primarydata_df.explode("sra_sample_acc")
    primarydata_df = primarydata_df[
        ~primarydata_df["sra_sample_acc"].isnull()
        & primarydata_df["sra_sample_acc"].str.startswith("SRA")
    ]
    primarydata_df["sra_sample_acc"] = primarydata_df["sra_sample_acc"].str.replace(
        "SRA:", ""
    )
    if extract_primary_data:
        sra_ids_list = primarydata_df["sra_sample_acc"].dropna().unique().tolist()
        sra_metadata = fetch_sra_metadata(sra_ids_list)
        sra_metadata_df = pd.DataFrame(
            [
                sra_metadata[sra][srr]
                for sra in sra_metadata
                for srr in sra_metadata[sra]
            ]
        )
        primarydata_df = primarydata_df.merge(
            sra_metadata_df,
            how="left",
            left_on="sra_sample_acc",
            right_on="sra_sample_acc",
        )

    qc_report_params["missing_ncbi_assemblies"] = report_missing_values_from(
        "accessions",
        "found on NCBI",
        source_list_df["accession"],
        base_genomes_df["accession"],
    )

    # Load source organisms and outbreaks; outbreaks are optional (only some
    # catalogs use them), so source_outbreaks_df is None when no path is given
    source_organisms_df = read_organisms(organisms_path)
    source_outbreaks_df = read_outbreaks(outbreaks_path)

    # Do database-based loading and transformation
    load_and_transform_result = load_and_transform(
        temp_folder_path_string=temp_folder_path,
        dlt_pipeline_prefix=dlt_pipeline_prefix,
        taxonomic_levels=taxonomic_levels_for_tree,
        assemblies_df=base_genomes_df.rename(columns={"taxonomyId": "taxonomy_id"}),
        organisms_df=source_organisms_df,
        outbreaks_df=source_outbreaks_df,
    )
    assembly_taxonomy_df = load_and_transform_result.taxonomy_assemblies
    organism_taxonomy_df = load_and_transform_result.taxonomy_organisms
    outbreak_taxonomy_df = load_and_transform_result.taxonomy_outbreaks
    qc_report_params["dbt_test_results"] = load_and_transform_result.dbt_test_results

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

    assemblies_df = pd.DataFrame(requests.get(ucsc_assemblies_url).json()["data"])[
        ["ucscBrowser", "genBank", "refSeq"]
    ]

    # Create a mapping of both GenBank and RefSeq accessions to UCSC browser IDs
    ucsc_mapping = (
        pd.concat(
            [
                assemblies_df[["ucscBrowser", "genBank"]].rename(
                    columns={"genBank": "accession"}
                ),
                assemblies_df[["ucscBrowser", "refSeq"]].rename(
                    columns={"refSeq": "accession"}
                ),
            ]
        )
        .dropna()
        .drop_duplicates(subset=["accession"])
    )

    # Single merge with the combined mapping
    genomes_df = genomes_with_species_df.merge(ucsc_mapping, how="left", on="accession")

    qc_report_params["missing_ucsc_assemblies"] = report_missing_values_from(
        "accessions",
        "matched in assembly list",
        genomes_with_species_df["accession"],
        assemblies_df["genBank"],
        assemblies_df["refSeq"],
    )

    if do_gene_model_urls:
        genomes_df = add_gene_model_url(genomes_df)
        qc_report_params["missing_gene_model_urls"] = report_missing_values(
            "accessions",
            "matched with gene model URLs",
            genomes_df["accession"],
            genomes_df["geneModelUrl"].notna(),
        )
    else:
        genomes_df["geneModelUrl"] = ""

    if datacache_base_url:
        genomes_df, missing_datacache_urls = add_galaxy_datacache_url(
            genomes_df, datacache_base_url
        )
        qc_report_params["missing_datacache_urls"] = missing_datacache_urls
    else:
        print(
            "No Galaxy Datacache base URL provided; skipping datacache link generation."
        )
        genomes_df["galaxyDatacacheUrl"] = ""
        qc_report_params["missing_datacache_urls"] = []

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

        if extract_primary_data and primarydata_df is not None:
            if "organism_name" in primarydata_df.columns:
                # Map the image paths back to the organism_name
                primarydata_df["organismImageUrl"] = primarydata_df[
                    "organism_name"
                ].map(species_image_paths)
                primarydata_df["organismThumbnailUrl"] = primarydata_df[
                    "organism_name"
                ].map(species_thumbnail_paths)
                primarydata_df["organismImageCredit"] = primarydata_df[
                    "organism_name"
                ].map(species_image_credit)
                primarydata_df["organismImageLicense"] = primarydata_df[
                    "organism_name"
                ].map(species_image_license)
                primarydata_df["organismImageSourceName"] = primarydata_df[
                    "organism_name"
                ].map(species_image_source)
                primarydata_df["organismImageSourceUrl"] = primarydata_df[
                    "organism_name"
                ].map(species_image_source_link)
            else:
                print(
                    "Primary data frame missing 'organism_name' column; skipping image metadata enrichment."
                )

    # Sort by accession for consistent output
    genomes_df = genomes_df.sort_values("accession")

    genomes_df.to_csv(genomes_output_path, index=False, sep="\t")

    print(f"Wrote to {genomes_output_path}")

    if extract_primary_data:
        primarydata_df.to_csv(primary_output_path, index=False, sep="\t")
        print(f"Wrote to {primary_output_path}")

    if len(taxonomic_levels_for_tree) > 0:
        # Use the assemblies info from genomes_df to build the species tree
        species_tree = get_species_tree(genomes_df, taxonomic_levels_for_tree)
        with open(tree_output_path, "w") as outfile:
            # Dump with sorted keys and consistent indentation
            json.dump(species_tree, outfile, indent=4, sort_keys=True)
        print(f"Wrote to {tree_output_path}")
        qc_report_params["tree_checks"] = do_taxonomy_tree_checks(
            species_tree, taxonomic_levels_for_tree, genomes_df.shape[0]
        )

    qc_report_params["missing_ploidy_assemblies"] = report_missing_ploidy_info(
        genomes_df, source_organisms_df
    )
    print(f"Checked ploidy for {len(genomes_df)} assemblies")

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

    if qc_report_path is not None:
        qc_report_text = make_qc_report(**qc_report_params)
        with open(qc_report_path, "w") as file:
            file.write(qc_report_text)

    # If taxonomy_mapping_path is provided and we have outbreak taxonomy IDs,
    # save the taxonomy mapping for use by build-outbreaks.ts
    if outbreak_taxonomy_mapping_path is not None and outbreak_taxonomy_ids:
        print(f"Saving taxonomy mapping to {outbreak_taxonomy_mapping_path}")
        save_taxonomy_mapping(
            outbreak_taxonomy_ids,
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
        # Return the path to the default missing image
        print(f"No image found for {potential_path}.")
        missing_file_path = os.path.join(folder_path, "missing_image" + file_suffix)
        if os.path.exists(missing_file_path):
            return missing_file_path
        else:
            raise FileNotFoundError(
                f"No species image found, or missing_image{file_suffix} in {folder_path}"
            )
