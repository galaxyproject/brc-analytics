from pathlib import Path

import pandas as pd

from .catalog_source import load_catalog_taxa
from .ncbi_taxonomy import load_ncbi_taxonomy


def do_dlt_load(
    *,
    temp_folder_path: Path,
    dlt_pipeline_prefix: str,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame | None,
):
    load_ncbi_taxonomy(
        temp_folder_path=temp_folder_path, dlt_pipeline_prefix=dlt_pipeline_prefix
    )

    load_catalog_taxa(
        temp_folder_path=temp_folder_path,
        dlt_pipeline_prefix=dlt_pipeline_prefix,
        assemblies_df=assemblies_df,
        organisms_df=organisms_df,
        outbreaks_df=outbreaks_df,
    )
