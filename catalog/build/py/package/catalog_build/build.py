import gzip
import io
import json
import logging
import time
import urllib

import pandas as pd
import requests
import yaml
from bs4 import BeautifulSoup

MAX_NCBI_URL_LENGTH = 2000  # The actual limit seems to be a bit over 4000

log = logging.getLogger(__name__)


def rate_limit_handler(request_call):
    try:
        response = request_call()
        response.raise_for_status()
        return response
    except requests.HTTPError:
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After"))
            print(f"Rate limited, waiting {retry_after} seconds")
            time.sleep(retry_after)
            response = request_call()
            response.raise_for_status()
            return response
        raise


def post_ncbi_request(url, json_data, batch_size=1000):
    """
    Makes a POST request to the NCBI API with error handling and rate limiting.
    Handles pagination if the response contains next_page_token and processes requests in batches.

    Args:
      url: The API endpoint URL
      json_data: The data to send in the request body
      batch_size: Maximum number of items to process in a single request

    Returns:
      List of all reports from paginated responses

    Raises:
      Exception: If the request fails or contains errors
    """
    all_reports = []
    page = 1
    processed_count = 0

    # Get the list of IDs to process (assuming they're in a list in the json_data)
    id_key = next((k for k in json_data if isinstance(json_data[k], list)), None)
    if not id_key:
        raise ValueError("No list of IDs found in json_data")

    ids = json_data[id_key]
    total_ids = len(ids)

    while processed_count < total_ids:
        # Create a batch of IDs
        batch = ids[processed_count : processed_count + batch_size]
        print(
            f"Processing batch {processed_count // batch_size + 1} of {total_ids // batch_size + 1}"
        )

        # Create a new json_data with just the current batch
        batch_data = {**json_data}
        batch_data[id_key] = batch

        while True:
            print(f"Requesting page {page} of {url} (batch size: {len(batch)})")

            # Add page token to request if it exists
            if "next_page_token" in batch_data:
                batch_data["page_token"] = batch_data.pop("next_page_token")

            # Use rate_limit_handler to make the request with proper retry logic
            response = rate_limit_handler(lambda: requests.post(url, json=batch_data))

            if response.status_code != 200:
                raise Exception(
                    f"Failed to fetch data: {response.status_code} {response.text}"
                )

            data = response.json()

            if len(data["reports"][0].get("errors", [])) > 0:
                raise Exception(data["reports"][0])

            all_reports.extend(data["reports"])

            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break

            batch_data["next_page_token"] = next_page_token
            page += 1

        processed_count += len(batch)
        page = 1  # Reset page counter for next batch

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


def get_species_row(taxon_info, taxonomic_group_sets, taxonomic_levels, name_info=None):
    # print(f"get_species_row: {taxon_info}")
    classification = taxon_info["taxonomy"]["classification"]
    species_info = classification["species"]
    taxonomy_id = taxon_info["taxonomy"]["tax_id"]
    ancestor_taxonomy_ids = taxon_info["taxonomy"]["parents"]

    taxonomic_level_fields = {
        get_taxonomic_level_key(level): classification.get(level, {}).get("name")
        for level in taxonomic_levels
    }
    own_level = (
        taxon_info["taxonomy"]["rank"].lower()
        if "rank" in taxon_info["taxonomy"]
        else None
    )
    if own_level in taxonomic_levels and own_level not in classification:
        taxonomic_level_fields[get_taxonomic_level_key(own_level)] = taxon_info[
            "taxonomy"
        ]["current_scientific_name"]["name"]

    if name_info:
        common_names = name_info["taxonomy"].get("other_common_names")
        if common_names:
            taxonomic_level_fields["commonName"] = common_names[0]

    return {
        "taxonomyId": str(taxonomy_id),
        "species": species_info["name"],
        "speciesTaxonomyId": str(species_info["id"]),
        "lineageTaxonomyIds": ",".join(
            [str(id) for id in ancestor_taxonomy_ids + [taxonomy_id]]
        ),
        **get_taxonomic_group_sets(ancestor_taxonomy_ids, taxonomic_group_sets),
        **taxonomic_level_fields,
    }


def get_species_info(taxonomy_ids):
    """
    Fetches species information from NCBI API for the given taxonomy IDs.

    Args:
      taxonomy_ids: List of taxonomy IDs to fetch information for

    Returns:
      List of species information dictionaries from NCBI
    """
    url = "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/dataset_report"
    taxon_ids = list(set(str(id) for id in taxonomy_ids))
    return post_ncbi_request(url, {"taxons": taxon_ids})


def get_species_name_info(taxonomy_ids):
    """
    Fetches species name information from NCBI API for the given taxonomy IDs.

    Args:
      taxonomy_ids: List of taxonomy IDs to fetch information for

    Returns:
      List of species name information dictionaries from NCBI
    """
    url = "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/name_report"
    taxon_ids = list(set(str(id) for id in taxonomy_ids))
    return post_ncbi_request(url, {"taxons": taxon_ids})


def get_species_df(
    species_info, species_name_info, taxonomic_group_sets, taxonomic_levels
):
    """
    Converts species information into a DataFrame.

    Args:
      species_info: List of species information dictionaries from NCBI
      species_name_info: List of species name information dictionaries from NCBI
      taxonomic_group_sets: Dictionary of taxonomic group sets
      taxonomic_levels: List of taxonomic levels to include

    Returns:
      DataFrame containing species information
    """
    # Create a dictionary mapping tax_id to name_info for easy lookup
    name_info_dict = {
        str(info["taxonomy"]["tax_id"]): info for info in species_name_info
    }

    # Create rows with both species_info and corresponding name_info
    rows = []
    for info in species_info:
        tax_id = str(info["taxonomy"]["tax_id"])
        name_info = name_info_dict.get(tax_id)
        rows.append(
            get_species_row(info, taxonomic_group_sets, taxonomic_levels, name_info)
        )

    return pd.DataFrame(rows)


def get_species_tree(taxonomy_ids, taxonomic_levels, species_info=None):
    """
    Builds a species tree from taxonomy IDs and taxonomic levels.

    Args:
      taxonomy_ids: List of taxonomy IDs to include in the tree
      taxonomic_levels: List of taxonomic levels to include in the tree
      species_info: Optional pre-fetched species information to avoid additional API calls

    Returns:
      A nested tree structure of species
    """
    species_tree_response = requests.post(
        "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/filtered_subtree",
        json={
            "taxons": [str(int(t)) for t in taxonomy_ids],
            "rank_limits": [t.upper() for t in taxonomic_levels],
        },
    ).json()

    # Build a tree from the response
    edges = species_tree_response.get("edges", {})
    all_children = {
        child for edge in edges.values() for child in edge.get("visible_children", [])
    }
    all_children = [str(num) for num in all_children]
    # Determine root IDs and sort them for consistent ordering
    roots = [node_id for node_id in edges if node_id not in all_children]
    root_ids = sorted([str(num) for num in roots], key=lambda x: int(x))

    if not root_ids:
        return {}

    # this bc the ncbi result is odd, multi-root
    root_id = "1"
    for root_id_candidate in root_ids:
        if root_id_candidate != root_id:
            edges[root_id]["visible_children"].append(root_id_candidate)

    species_tree = ncbi_tree_to_nested_tree(root_id, edges, taxonomy_ids)

    # Find the set of all unique tax_ids and their display names
    tax_ids = all_children + root_ids
    tax_ids = set(tax_ids)

    # Initialize maps with root node
    taxon_name_map = {"1": "root"}
    taxon_rank_map = {"1": "NA"}

    # If we have pre-fetched species_info, use it to populate the name and rank maps
    if species_info:
        # Extract taxon names and ranks from species_info
        for info in species_info:
            tax_id = str(info["taxonomy"]["tax_id"])
            if tax_id in tax_ids:
                taxon_name_map[tax_id] = info["taxonomy"]["current_scientific_name"][
                    "name"
                ]
                if "rank" in info["taxonomy"]:
                    taxon_rank_map[tax_id] = info["taxonomy"]["rank"]
                else:
                    print(f"rank not found for tax_id: {tax_id}")

            # Also extract parent taxa information if available
            if "classification" in info["taxonomy"]:
                for rank_level, rank_info in info["taxonomy"]["classification"].items():
                    if (
                        isinstance(rank_info, dict)
                        and "id" in rank_info
                        and "name" in rank_info
                    ):
                        parent_name = rank_info["name"]
                        parent_id = rank_info["id"]
                        parent_id_str = str(parent_id)
                        if (
                            parent_id_str in tax_ids
                            and parent_id_str not in taxon_name_map
                        ):
                            taxon_name_map[parent_id_str] = parent_name
                            taxon_rank_map[parent_id_str] = rank_level

    # Fetch any missing taxa information
    fetch_taxa_info(tax_ids, taxon_name_map, taxon_rank_map, "missing parent taxa")

    named_species_tree = update_species_tree_names(
        species_tree, taxon_name_map, taxon_rank_map
    )

    return named_species_tree


def fetch_taxa_info(tax_ids, taxon_name_map, taxon_rank_map, description="taxa"):
    """
    Fetches taxonomic information and updates the provided name and rank maps.

    Args:
      tax_ids: List or set of taxonomy IDs to fetch
      taxon_name_map: Dictionary to update with taxon ID to name mappings
      taxon_rank_map: Dictionary to update with taxon ID to rank mappings
      description: Description of the taxa being fetched for logging

    Returns:
      None (updates the provided maps in-place)
    """
    # Filter out tax_ids that are already in the map and convert to strings
    missing_tax_ids = [
        str(tid)
        for tid in tax_ids
        if str(tid) not in taxon_name_map and str(tid) != "1"
    ]

    if not missing_tax_ids:
        return

    # Fetch in batches to avoid overwhelming the NCBI server
    url = "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/dataset_report"
    batch_size = 2500
    total = len(missing_tax_ids)
    total_batches = (total + batch_size - 1) // batch_size
    print(f"Fetching information for {total} {description} in {total_batches} batches")
    for batch_index in range(total_batches):
        batch = missing_tax_ids[
            batch_index * batch_size : (batch_index + 1) * batch_size
        ]
        print(
            f"  Batch {batch_index + 1}/{total_batches}: fetching {len(batch)} {description}"
        )
        reports = post_ncbi_request(url, {"taxons": batch})
        for report in reports:
            tax_id = str(report["taxonomy"]["tax_id"])
            taxon_name_map[tax_id] = report["taxonomy"]["current_scientific_name"][
                "name"
            ]
            if "rank" in report["taxonomy"]:
                taxon_rank_map[tax_id] = report["taxonomy"]["rank"]
            else:
                print(f"rank not found for tax_id: {tax_id}")


def ncbi_tree_to_nested_tree(node_id, edges, taxonomy_ids):
    children = edges.get(str(node_id), {}).get("visible_children", [])
    children = [str(num) for num in children]
    # ncbi results odd again, dup children
    # Deduplicate and sort children by taxonomy ID for consistent ordering
    children = sorted(set(children), key=lambda x: int(x))
    if len(children) > 0 or int(node_id) in taxonomy_ids:
        child_trees = [
            ncbi_tree_to_nested_tree(child, edges, taxonomy_ids) for child in children
        ]
        child_trees = [item for item in child_trees if item is not None]
        return {"name": node_id, "ncbi_tax_id": node_id, "children": child_trees}


def update_species_tree_names(tree, taxon_name_map, taxon_rank_map):
    tree["rank"] = taxon_rank_map.get(tree["name"], "Unknown")
    tree["name"] = taxon_name_map.get(tree["name"], tree["name"])

    for child in tree.get("children", []):
        update_species_tree_names(child, taxon_name_map, taxon_rank_map)
    return tree


def get_genome_row(genome_info):
    refseq_category = genome_info["assembly_info"].get("refseq_category")
    return {
        "strain": genome_info["organism"]
        .get("infraspecific_names", {})
        .get("strain", ""),
        "taxonomyId": str(genome_info["organism"]["tax_id"]),
        "accession": genome_info["accession"],
        "isRef": refseq_category == "reference genome",
        "level": genome_info["assembly_info"]["assembly_level"],
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
    reports = post_ncbi_request(url, {"accessions": accessions})

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
    present_values_mask = all_values_series.astype(bool)
    present_values_mask[:] = False
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
                    f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=sra&id=SRR25741043&retmode=xml",
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


def make_qc_report(
    missing_ncbi_assemblies,
    inconsistent_taxonomy_ids,
    missing_ucsc_assemblies,
    missing_gene_model_urls=None,
    missing_ploidy_assemblies=None,
    missing_outbreak_descendants=None,
):
    ncbi_assemblies_text = (
        "None"
        if len(missing_ncbi_assemblies) == 0
        else "\n".join([f"- {accession}" for accession in missing_ncbi_assemblies])
    )
    ucsc_assemblies_text = (
        "None"
        if len(missing_ucsc_assemblies) == 0
        else "\n".join([f"- {accession}" for accession in missing_ucsc_assemblies])
    )
    gene_model_urls_text = (
        "N/A"
        if missing_gene_model_urls is None
        else "None"
        if len(missing_gene_model_urls) == 0
        else "\n".join([f"- {accession}" for accession in missing_gene_model_urls])
    )
    taxonomy_ids_text = (
        "None"
        if len(inconsistent_taxonomy_ids) == 0
        else "\n".join(
            [f"- {taxon}: {ids}" for taxon, ids in inconsistent_taxonomy_ids]
        )
    )
    ploidy_assemblies_text = (
        "None"
        if missing_ploidy_assemblies is None
        else "None"
        if len(missing_ploidy_assemblies) == 0
        else "\n".join(
            [
                f"- {accession} (speciesTaxonomyId: {tax_id})"
                for accession, tax_id in missing_ploidy_assemblies
            ]
        )
    )
    if missing_outbreak_descendants is None or len(missing_outbreak_descendants) == 0:
        outbreak_descendants_text = "None"
    else:
        outbreak_descendants_text = "\n".join(
            [f"- {tax_id}" for tax_id in missing_outbreak_descendants]
        )
    return (
        f"# Catalog QC report\n\n"
        f"## Assemblies not found on NCBI\n\n{ncbi_assemblies_text}\n\n"
        f"## Assemblies not found in UCSC list\n\n{ucsc_assemblies_text}\n\n"
        f"## Assemblies with gene model URLs not found\n\n{gene_model_urls_text}\n\n"
        f"## Species and strain combinations with multiple taxonomy IDs\n\n{taxonomy_ids_text}\n\n"
        f"## Assemblies without ploidy information\n\n{ploidy_assemblies_text}\n\n"
        f"## Outbreak descendant taxonomy IDs not found in genomes data\n\n{outbreak_descendants_text}"
    )


def get_outbreak_taxonomy_ids(outbreaks_path, get_primary=True, get_descendants=False):
    """Read outbreaks from YAML file and return a list of taxonomy IDs.

    Includes both primary taxonomy_id and any highlight_descendant_taxonomy_ids.
    """
    if not get_primary and not get_descendants:
        raise ValueError("At least one of get_primary or get_descendants must be True")

    if outbreaks_path is None:
        return []

    taxonomy_ids = []
    with open(outbreaks_path) as stream:
        outbreaks_data = yaml.safe_load(stream)
        if not outbreaks_data:
            return []

        for outbreak in outbreaks_data.get("outbreaks", []):
            # Add primary taxonomy ID
            if get_primary:
                taxonomy_ids.append(str(outbreak["taxonomy_id"]))

            # Add any highlight descendant taxonomy IDs
            if get_descendants and outbreak.get("highlight_descendant_taxonomy_ids"):
                # Convert each ID to string before adding
                taxonomy_ids.extend(
                    [
                        str(tax_id)
                        for tax_id in outbreak["highlight_descendant_taxonomy_ids"]
                    ]
                )

    # Return unique taxonomy IDs
    return list(set(taxonomy_ids))


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


def build_files(
    assemblies_path,
    genomes_output_path,
    ucsc_assemblies_url,
    tree_output_path,
    taxonomic_levels_for_tree,
    taxonomic_group_sets={},
    do_gene_model_urls=True,
    extract_primary_data=False,
    primary_output_path=None,
    qc_report_path=None,
    organisms_path=None,
    outbreaks_path=None,
    outbreak_taxonomy_mapping_path=None,
):
    print("Building files")

    qc_report_params = {}

    # Read outbreak taxonomy IDs if outbreaks path is provided
    outbreak_taxonomy_ids = []
    if outbreaks_path:
        outbreak_taxonomy_ids = get_outbreak_taxonomy_ids(outbreaks_path)
    print(f"Found {len(outbreak_taxonomy_ids)} outbreak taxonomy IDs")

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

    # Fetch species information once to be used by both species_df and species_tree
    species_info = get_species_info(base_genomes_df["taxonomyId"])
    species_name_info = get_species_name_info(base_genomes_df["taxonomyId"])

    # Create species DataFrame using the fetched species_info
    species_df = get_species_df(
        species_info, species_name_info, taxonomic_group_sets, taxonomic_levels_for_tree
    )

    print(f"Found {len(outbreak_taxonomy_ids)} outbreak taxonomy IDs")
    # Add otherTaxa field with outbreak-associated taxa names
    if outbreak_taxonomy_ids:
        # Convert lineageTaxonomyIds from comma-separated string to list of strings
        species_df["lineageTaxonomyIdsList"] = species_df["lineageTaxonomyIds"].apply(
            lambda x: [id for id in x.split(",")]
        )

        # Get taxon names and ranks for outbreak taxonomy IDs
        outbreak_taxon_name_map = {}
        outbreak_taxon_rank_map = {}
        fetch_taxa_info(
            outbreak_taxonomy_ids,
            outbreak_taxon_name_map,
            outbreak_taxon_rank_map,
            "outbreak taxa",
        )

        # For each row, check if any lineage taxonomy ID is in the outbreak taxonomy IDs
        # and add the corresponding taxon name to otherTaxa only if its rank is not in taxonomic_levels_for_tree
        def get_other_taxa(lineage_ids):
            taxa = []
            for tax_id in lineage_ids:
                if tax_id in outbreak_taxonomy_ids:
                    # Check if this taxon's rank is already covered by taxonomic_levels_for_tree
                    rank = outbreak_taxon_rank_map.get(str(tax_id), "").lower()
                    if rank not in taxonomic_levels_for_tree:
                        # Use the taxon name instead of the raw ID
                        taxa.append(outbreak_taxon_name_map[str(tax_id)])
            # Convert list to comma-separated string for build-assemblies.ts
            return ",".join(taxa) if taxa else None

        species_df["otherTaxa"] = species_df["lineageTaxonomyIdsList"].apply(
            get_other_taxa
        )

        # Drop the temporary column
        species_df = species_df.drop(columns=["lineageTaxonomyIdsList"])

    qc_report_params["missing_outbreak_descendants"] = (
        check_missing_outbreak_descendants(
            get_outbreak_taxonomy_ids(
                outbreaks_path, get_primary=False, get_descendants=True
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

    # Drop any duplicate rows based on accession before writing to file
    genomes_df = genomes_df.drop_duplicates(subset=["accession"])

    # Sort by accession for consistent output
    genomes_df = genomes_df.sort_values("accession")

    genomes_df.to_csv(genomes_output_path, index=False, sep="\t")

    print(f"Wrote to {genomes_output_path}")

    if extract_primary_data:
        primarydata_df.to_csv(primary_output_path, index=False, sep="\t")
        print(f"Wrote to {primary_output_path}")

    if len(taxonomic_levels_for_tree) > 0:
        # Use the taxonomy IDs from the genomes_df to build the species tree
        # Pass the previously fetched species_info to avoid another API call
        species_tree = get_species_tree(
            list(genomes_df["taxonomyId"]), taxonomic_levels_for_tree, species_info
        )
        with open(tree_output_path, "w") as outfile:
            # Dump with sorted keys and consistent indentation
            json.dump(species_tree, outfile, indent=4, sort_keys=True)
        print(f"Wrote to {tree_output_path}")

    if organisms_path is not None:
        organisms_df = read_organisms(organisms_path)
        qc_report_params["missing_ploidy_assemblies"] = report_missing_ploidy_info(
            genomes_df, organisms_df
        )
        print(f"Checked ploidy for {len(genomes_df)} assemblies")

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
