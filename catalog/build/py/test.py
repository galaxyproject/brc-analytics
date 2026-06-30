from pathlib import Path

import pandas as pd

from ...py_package.catalog_build.build import get_outbreak_taxonomy_ids, read_organisms
from ...py_package.catalog_build.load_taxonomy import load_taxonomy_data
from .build_files_from_ncbi import ORGANISMS_PATH, OUTBREAKS_PATH

TEMP_DIR_PATH = "catalog/build/temp"

organism_taxa = read_organisms(ORGANISMS_PATH)[["taxonomy_id"]]
outbreak_taxa = pd.DataFrame({"taxonomy_id": get_outbreak_taxonomy_ids(OUTBREAKS_PATH)})

load_taxonomy_data(
    TEMP_DIR_PATH,
    assembly_taxa_df=organism_taxa,  # substituting for simplicity/efficiency
    organism_taxa_df=organism_taxa,
    outbreak_taxa_df=outbreak_taxa,
)
