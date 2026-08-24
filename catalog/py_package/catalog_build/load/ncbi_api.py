import time
from pathlib import Path

import dlt
import duckdb
import requests

from ..utils import get_db_path


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


def post_ncbi_request(url: str, json_data, batch_size=1000, min_batch_size=50):
    """
    Makes a POST request to the NCBI API with error handling and rate limiting.
    Handles pagination if the response contains next_page_token and processes requests in batches.
    Adaptively reduces batch size if requests fail.

    Args:
      url: The API endpoint URL
      json_data: The data to send in the request body
      batch_size: Initial maximum number of items to process in a single request
      min_batch_size: Minimum batch size to try before giving up

    Yields:
      All reports from paginated responses

    Raises:
      Exception: If the request fails or contains errors even with minimum batch size
    """
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
                yield from batch_reports
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


@dlt.resource(
    name="genomes",
    write_disposition="replace",
    max_table_nesting=1,
    schema_contract={"data_type": "discard_row"},
    columns={"assembly_stats__gc_percent": {"data_type": "double"}},
)
def ncbi_genomes(accessions: list[str]):
    url = "https://api.ncbi.nlm.nih.gov/datasets/v2/genome/dataset_report"
    keep_keys = {
        "accession",
        "annotation_info",
        "assembly_info",
        "assembly_stats",
        "current_accession",
        "organism",
        "paired_accession",
    }
    genomes = post_ncbi_request(
        url,
        {
            "accessions": accessions,
            "filters": {
                "assembly_version": "all_assemblies"  # Include old or suppressed assemblies
            },
            "page_size": 500,  # Initial page size for pagination
        },
    )
    for genome_info in genomes:
        yield {k: genome_info[k] for k in keep_keys if k in genome_info}


@dlt.source
def ncbi_api_data(*, assembly_accessions: list[str]):
    return [ncbi_genomes(assembly_accessions)]


def load_ncbi_api_data(*, temp_folder_path: Path, dlt_pipeline_prefix: str):
    with duckdb.connect(get_db_path(temp_folder_path)) as con:
        # Query a list of unique accessions and select the list from the first item of the first row
        accessions = con.query(
            "select list(distinct accession) from catalog_source.assemblies"
        ).fetchall()[0][0]
        pipeline = dlt.pipeline(
            pipeline_name=dlt_pipeline_prefix + "ncbi_api",
            destination=dlt.destinations.duckdb(con),
            dataset_name="ncbi_api",
        )
        pipeline.run(ncbi_api_data(assembly_accessions=accessions))
