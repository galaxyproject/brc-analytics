from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from .catalog_source import load_catalog_source_data
from .ncbi_taxonomy import load_ncbi_taxonomy


@dataclass
class LoadResult:
    ncbi_taxdump_md5: str


def do_dlt_load(
    *,
    temp_folder_path: Path,
    dlt_pipeline_prefix: str,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame | None,
):
    """
    Load NCBI taxonomy and catalog source taxa into DuckDB via dlt.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to dlt pipeline names
      assemblies_df: DataFrame of source assemblies (must include a `taxonomy_id` column)
      organisms_df: DataFrame of source organisms (must include a `taxonomy_id` column)
      outbreaks_df: DataFrame of source outbreaks (must include a `taxonomy_id` column), or None for catalogs without outbreaks

    Returns:
      A LoadResult with the verified NCBI taxdump MD5 digest
    """
    ncbi_taxdump_md5 = load_ncbi_taxonomy(
        temp_folder_path=temp_folder_path, dlt_pipeline_prefix=dlt_pipeline_prefix
    )

    load_catalog_source_data(
        temp_folder_path=temp_folder_path,
        dlt_pipeline_prefix=dlt_pipeline_prefix,
        assemblies_df=assemblies_df,
        organisms_df=organisms_df,
        outbreaks_df=outbreaks_df,
    )

    return LoadResult(ncbi_taxdump_md5=ncbi_taxdump_md5)
