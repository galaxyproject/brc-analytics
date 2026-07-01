import pandas as pd

from ...py_package.catalog_build.build import (
    get_outbreak_taxonomy_ids,
    load_and_transform,
    read_organisms,
)
from .build_files_from_ncbi import ORGANISMS_PATH, OUTBREAKS_PATH

TEMP_DIR_PATH = "catalog/build/temp"

organism_taxa = read_organisms(ORGANISMS_PATH)[["taxonomy_id"]]
outbreak_taxa = pd.DataFrame({"taxonomy_id": get_outbreak_taxonomy_ids(OUTBREAKS_PATH)})

load_and_transform(
    TEMP_DIR_PATH,
    assemblies_df=organism_taxa,  # substituting for simplicity/efficiency
    organisms_df=organism_taxa,
    outbreaks_df=outbreak_taxa,
)
