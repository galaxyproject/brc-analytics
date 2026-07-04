from pathlib import Path

import pandas as pd

from .catalog_source import load_catalog_taxa
from .ncbi_taxonomy import load_ncbi_taxonomy


def do_dlt_load(
    temp_folder_path: Path,
    *,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame,
):
    load_ncbi_taxonomy(temp_folder_path)

    load_catalog_taxa(
        temp_folder_path,
        assemblies_df=assemblies_df,
        organisms_df=organisms_df,
        outbreaks_df=outbreaks_df,
    )
