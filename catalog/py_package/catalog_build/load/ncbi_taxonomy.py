import tarfile
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


def dmp_rows(path: Path, cols: list[str | None]):
    n_cols = len(cols)
    with open(path) as f:
        line_num = 1
        for line in f:
            values = line.removesuffix("\t|\n").split("\t|\t")
            if len(values) != n_cols:
                raise Exception(
                    f"Column number mismatch in {path}: expected {n_cols}, found {len(values)} on line {line_num}"
                )
            yield {col: value for col, value in zip(cols, values) if col is not None}
            line_num += 1


@dlt.resource(name="ncbi_taxonomy_names", write_disposition="replace")
def ncbi_taxonomy_names(path: Path):
    yield pd.DataFrame(
        dmp_rows(
            path,
            [
                "tax_id",
                "name_txt",
                None,  # unique name
                "name_class",
            ],
        )
    ).astype(
        {
            "tax_id": "Int64",
        }
    )


@dlt.resource(name="ncbi_taxonomy_nodes", write_disposition="replace")
def ncbi_taxonomy_nodes(path: Path):
    yield pd.DataFrame(
        dmp_rows(
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
        )
    ).astype(
        {
            "tax_id": "Int64",
            "parent_tax_id": "Int64",
        }
    )


@dlt.source
def ncbi_taxdump(dmp_dir: Path):
    return [
        ncbi_taxonomy_nodes(dmp_dir / TAXDUMP_NODES_FILE_NAME),
        ncbi_taxonomy_names(dmp_dir / TAXDUMP_NAMES_FILE_NAME),
    ]


def load_taxdump(*, temp_folder_path: Path, dlt_pipeline_prefix: str):
    pipeline = dlt.pipeline(
        pipeline_name=dlt_pipeline_prefix + "ncbi_taxonomy",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="raw",
    )
    pipeline.run(ncbi_taxdump(temp_folder_path / TAXDUMP_DIR_NAME))


def download_taxdump(temp_folder_path: Path):
    taxdump_path = temp_folder_path / TAXDUMP_DOWNLOAD_NAME

    with requests.get(TAXDUMP_URL, stream=True, timeout=(10, 60)) as response:
        response.raise_for_status()
        with open(taxdump_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)

    taxdump_dir_path = temp_folder_path / TAXDUMP_DIR_NAME
    taxdump_dir_path.mkdir(exist_ok=True)

    with tarfile.open(taxdump_path) as tar:
        tar.extractall(
            taxdump_dir_path,
            members=[
                tar.getmember(TAXDUMP_NODES_FILE_NAME),
                tar.getmember(TAXDUMP_NAMES_FILE_NAME),
            ],
            filter="data",
        )


def load_ncbi_taxonomy(*, temp_folder_path: Path, dlt_pipeline_prefix: str):
    download_taxdump(temp_folder_path)
    load_taxdump(
        temp_folder_path=temp_folder_path, dlt_pipeline_prefix=dlt_pipeline_prefix
    )
