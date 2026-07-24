import hashlib
import tarfile
from itertools import batched
from pathlib import Path

import dlt
import pandas as pd
import requests

from ..utils import get_db_path_string

TAXDUMP_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz"
TAXDUMP_MD5_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz.md5"
TAXDUMP_DOWNLOAD_NAME = "ncbi_taxdump.tar.gz"
TAXDUMP_DIR_NAME = "ncbi_taxdump"
TAXDUMP_NODES_FILE_NAME = "nodes.dmp"
TAXDUMP_NAMES_FILE_NAME = "names.dmp"
TAXDUMP_MERGED_FILE_NAME = "merged.dmp"

# Rows per yielded DataFrame. Tuning knob: larger means fewer dlt round-trips but
# higher peak memory; smaller means lower memory but more per-chunk overhead.
DMP_CHUNK_SIZE = 100_000


def dmp_rows(path: Path, cols: list[str | None]):
    """
    Parse rows from an NCBI taxdump `.dmp` file.

    These files terminate each row with `\\t|\\n` and separate fields with `\\t|\\t`,
    rather than using a plain tab delimiter.

    Args:
      path: Path of the `.dmp` file to read
      cols: Column names, in file order; an entry of None omits that column from the
        yielded rows (used to skip columns that aren't needed)

    Yields:
      A dict mapping each named column to its value, for each row in the file

    Raises:
      Exception: If a row's field count doesn't match the number of columns provided
    """
    n_cols = len(cols)
    with open(path, encoding="utf-8") as f:
        line_num = 1
        for line in f:
            values = line.removesuffix("\t|\n").split("\t|\t")
            if len(values) != n_cols:
                raise Exception(
                    f"Column number mismatch in {path}: expected {n_cols}, found {len(values)} on line {line_num}"
                )
            yield {col: value for col, value in zip(cols, values) if col is not None}
            line_num += 1


def dmp_dataframes(path: Path, cols: list[str | None], dtypes: dict[str, str]):
    """
    Yield DataFrames of at most `DMP_CHUNK_SIZE` rows parsed from a `.dmp` file.

    Chunking the file into multiple DataFrames avoids materializing the entire file
    in memory at once, at the cost of more items handed to dlt.

    Args:
      path: Path of the `.dmp` file to read
      cols: Column names passed through to `dmp_rows`
      dtypes: Column dtypes applied to each yielded DataFrame

    Yields:
      A DataFrame for each chunk of rows read from the file
    """
    for chunk in batched(dmp_rows(path, cols), DMP_CHUNK_SIZE):
        yield pd.DataFrame(chunk).astype(dtypes)


@dlt.resource(name="taxonomy_names", write_disposition="replace")
def ncbi_taxonomy_names(path: Path):
    yield from dmp_dataframes(
        path,
        [
            "tax_id",
            "name_txt",
            None,  # unique name
            "name_class",
        ],
        {
            "tax_id": "Int64",
        },
    )


@dlt.resource(name="taxonomy_nodes", write_disposition="replace")
def ncbi_taxonomy_nodes(path: Path):
    yield from dmp_dataframes(
        path,
        [
            "tax_id",
            "parent_tax_id",
            "rank",
            None,  # embl code
            None,  # division id
            None,  # inherited div flag
            None,  # genetic code id
            None,  # inherited GC  flag
            None,  # mitochondrial genetic code id
            None,  # inherited MGC flag
            None,  # GenBank hidden flag
            None,  # hidden subtree root flag
            None,  # comments
        ],
        {
            "tax_id": "Int64",
            "parent_tax_id": "Int64",
        },
    )


@dlt.resource(name="taxonomy_merged", write_disposition="replace")
def ncbi_taxonomy_merged(path: Path):
    yield from dmp_dataframes(
        path,
        [
            "old_tax_id",
            "new_tax_id",
        ],
        {
            "old_tax_id": "Int64",
            "new_tax_id": "Int64",
        },
    )


@dlt.source
def ncbi_taxdump(dmp_dir: Path):
    return [
        ncbi_taxonomy_nodes(dmp_dir / TAXDUMP_NODES_FILE_NAME),
        ncbi_taxonomy_names(dmp_dir / TAXDUMP_NAMES_FILE_NAME),
        ncbi_taxonomy_merged(dmp_dir / TAXDUMP_MERGED_FILE_NAME),
    ]


def load_taxdump(*, temp_folder_path: Path, dlt_pipeline_prefix: str):
    pipeline = dlt.pipeline(
        pipeline_name=dlt_pipeline_prefix + "ncbi_taxonomy",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="ncbi",
    )
    pipeline.run(ncbi_taxdump(temp_folder_path / TAXDUMP_DIR_NAME))


def calc_taxdump_md5(temp_folder_path: Path) -> str:
    taxdump_path = temp_folder_path / TAXDUMP_DOWNLOAD_NAME
    with open(taxdump_path, "rb") as f:
        return hashlib.file_digest(f, "md5").hexdigest()


def verify_taxdump_md5(temp_folder_path: Path, fetched_md5: str):
    if calc_taxdump_md5(temp_folder_path).lower() != fetched_md5.lower():
        raise Exception("Taxdump MD5 provided by NCBI does not match calculated MD5")


def fetch_taxdump_md5() -> str:
    """
    Fetch the expected MD5 digest of the taxdump archive from NCBI.

    Returns:
      The MD5 digest as a hex string. NCBI's `.md5` file has the form
      "<md5>  <filename>", so the first 32 characters are the digest.
    """
    response = requests.get(TAXDUMP_MD5_URL, timeout=(10, 30))
    response.raise_for_status()
    return response.text[:32]


def download_taxdump(temp_folder_path: Path, fetched_md5: str):
    taxdump_path = temp_folder_path / TAXDUMP_DOWNLOAD_NAME

    with requests.get(TAXDUMP_URL, stream=True, timeout=(10, 60)) as response:
        response.raise_for_status()
        with open(taxdump_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)

    verify_taxdump_md5(temp_folder_path, fetched_md5)

    taxdump_dir_path = temp_folder_path / TAXDUMP_DIR_NAME
    taxdump_dir_path.mkdir(exist_ok=True)

    with tarfile.open(taxdump_path) as tar:
        tar.extractall(
            taxdump_dir_path,
            members=[
                tar.getmember(TAXDUMP_NODES_FILE_NAME),
                tar.getmember(TAXDUMP_NAMES_FILE_NAME),
                tar.getmember(TAXDUMP_MERGED_FILE_NAME),
            ],
            filter="data",
        )


def load_ncbi_taxonomy(*, temp_folder_path: Path, dlt_pipeline_prefix: str) -> str:
    """
    Download the NCBI taxdump, verify its MD5, and load its nodes and names into DuckDB.

    Args:
      temp_folder_path: Path of the temporary folder used for downloads and the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to the dlt pipeline name

    Returns:
      The verified MD5 digest of the downloaded taxdump archive
    """
    fetched_md5 = fetch_taxdump_md5()
    download_taxdump(temp_folder_path, fetched_md5)
    load_taxdump(
        temp_folder_path=temp_folder_path, dlt_pipeline_prefix=dlt_pipeline_prefix
    )
    return fetched_md5
