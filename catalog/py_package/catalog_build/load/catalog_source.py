from pathlib import Path

import dlt
import pandas as pd

from ..utils import get_db_path_string


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


def load_catalog_taxa(
    temp_folder_path: Path,
    *,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame,
):
    # Get dataframes with just taxonomy IDs as ints
    assembly_taxa_df = assemblies_df[["taxonomy_id"]].astype(int)
    organism_taxa_df = organisms_df[["taxonomy_id"]].astype(int)
    outbreak_taxa_df = outbreaks_df[["taxonomy_id"]].astype(int)

    pipeline = dlt.pipeline(
        pipeline_name="catalog_data",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="catalog_data",
    )
    pipeline.run(
        catalog_taxa(
            assembly_taxa_df=assembly_taxa_df,
            organism_taxa_df=organism_taxa_df,
            outbreak_taxa_df=outbreak_taxa_df,
        )
    )
