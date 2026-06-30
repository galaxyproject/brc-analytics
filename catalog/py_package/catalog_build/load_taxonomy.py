import tarfile
from pathlib import Path

import dlt
import pandas as pd
import requests

TAXDUMP_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz"
TAXDUMP_MD5_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz.md5"
TAXDUMP_DOWNLOAD_NAME = "ncbi_taxdump.tar.gz"
TAXDUMP_DIR_NAME = "ncbi_taxdump"
TAXDUMP_NODES_FILE_NAME = "nodes.dmp"
TAXDUMP_NAMES_FILE_NAME = "names.dmp"


@dlt.resource(name="outbreak_taxa", write_disposition="replace")
def outbreak_taxa(df: pd.DataFrame):
    yield df


@dlt.resource(name="organism_taxa", write_disposition="replace")
def organism_taxa(df: pd.DataFrame):
    yield df


@dlt.resource(name="assembly_taxa", write_disposition="replace")
def assembly_taxa(df: pd.DataFrame):
    yield df


@dlt.source
def catalog_taxa(
    *,
    assembly_taxa_df: pd.DataFrame,
    organism_taxa_df: pd.DataFrame,
    outbreak_taxa_df: pd.DataFrame,
):
    return [
        assembly_taxa(assembly_taxa_df),
        organism_taxa(organism_taxa_df),
        outbreak_taxa(outbreak_taxa_df),
    ]


def import_catalog_taxa(
    temp_folder_path: Path,
    *,
    assembly_taxa_df: pd.DataFrame,
    organism_taxa_df: pd.DataFrame,
    outbreak_taxa_df: pd.DataFrame,
):
    pipeline = dlt.pipeline(
        pipeline_name="catalog_data",
        destination=dlt.destinations.duckdb(str(temp_folder_path / "catalog.duckdb")),
        dataset_name="catalog_data",
    )
    pipeline.run(
        catalog_taxa(
            assembly_taxa_df=assembly_taxa_df,
            organism_taxa_df=organism_taxa_df,
            outbreak_taxa_df=outbreak_taxa_df,
        )
    )


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
    )


@dlt.source
def ncbi_taxdump(dmp_dir: Path):
    return [
        ncbi_taxonomy_nodes(dmp_dir / TAXDUMP_NODES_FILE_NAME),
        ncbi_taxonomy_names(dmp_dir / TAXDUMP_NAMES_FILE_NAME),
    ]


def import_taxdump(temp_folder_path: Path):
    pipeline = dlt.pipeline(
        pipeline_name="ncbi_taxonomy",
        destination=dlt.destinations.duckdb(str(temp_folder_path / "catalog.duckdb")),
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


def load_taxonomy_data(
    temp_folder_path_string: str,
    *,
    assembly_taxa_df: pd.DataFrame,
    organism_taxa_df: pd.DataFrame,
    outbreak_taxa_df: pd.DataFrame,
):
    temp_folder_path = Path(temp_folder_path_string).resolve()
    temp_folder_path.mkdir(exist_ok=True)

    download_taxdump(temp_folder_path)

    import_taxdump(temp_folder_path)

    import_catalog_taxa(
        temp_folder_path,
        assembly_taxa_df=assembly_taxa_df,
        organism_taxa_df=organism_taxa_df,
        outbreak_taxa_df=outbreak_taxa_df,
    )
