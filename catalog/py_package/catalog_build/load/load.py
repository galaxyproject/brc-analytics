from pathlib import Path

import pandas as pd

from .catalog_source import load_catalog_taxa
from .ncbi_taxonomy import load_ncbi_taxonomy


def do_dlt_load(
    temp_folder_path: Path,
    *,
    assembly_taxa_df: pd.DataFrame,
    organism_taxa_df: pd.DataFrame,
    outbreak_taxa_df: pd.DataFrame,
):
    load_ncbi_taxonomy(temp_folder_path)

    load_catalog_taxa(
        temp_folder_path,
        assembly_taxa_df=assembly_taxa_df,
        organism_taxa_df=organism_taxa_df,
        outbreak_taxa_df=outbreak_taxa_df,
    )
