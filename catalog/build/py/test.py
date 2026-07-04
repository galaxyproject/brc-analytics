import pandas as pd

from ...py_package.catalog_build.build import (
    get_outbreak_taxonomy_ids,
    load_and_transform,
    read_organisms,
)
from .build_files_from_ncbi import (
    ORGANISMS_PATH,
    OUTBREAKS_PATH,
    TAXANOMIC_LEVELS_FOR_TREE,
)

TEMP_DIR_PATH = "catalog/build/temp"

organisms_df = read_organisms(ORGANISMS_PATH)
outbreaks_df = pd.DataFrame({"taxonomy_id": get_outbreak_taxonomy_ids(OUTBREAKS_PATH)})

dfs = load_and_transform(
    TEMP_DIR_PATH,
    taxonomic_levels=TAXANOMIC_LEVELS_FOR_TREE,
    assemblies_df=organisms_df,  # substituting for simplicity/efficiency
    organisms_df=organisms_df,
    outbreaks_df=outbreaks_df,
)

for df in dfs:
    print(df)
