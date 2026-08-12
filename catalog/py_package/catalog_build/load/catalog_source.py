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


@dlt.resource(name="organism_curated_synonyms", write_disposition="replace")
def organism_curated_synonyms(df: pd.DataFrame):
    yield df


@dlt.source
def catalog_taxa(
    *,
    assembly_taxa_df: pd.DataFrame,
    organism_taxa_df: pd.DataFrame,
    organism_curated_synonyms_df: pd.DataFrame | None,
    outbreak_taxa_df: pd.DataFrame | None,
):
    resources = [
        assembly_taxa(assembly_taxa_df),
        organism_taxa(organism_taxa_df),
    ]
    # Only load outbreak taxa for catalogs that have outbreaks; when absent, the
    # shared dbt models skip the outbreak_taxa source entirely (see has_outbreaks var)
    if outbreak_taxa_df is not None:
        resources.append(outbreak_taxa(outbreak_taxa_df))
    # Likewise, only load curated synonyms when the catalog's organisms specify any;
    # the shared dbt models skip the source otherwise (see has_curated_synonyms var)
    if organism_curated_synonyms_df is not None:
        resources.append(organism_curated_synonyms(organism_curated_synonyms_df))
    return resources


def get_organism_curated_synonyms_df(organisms_df: pd.DataFrame):
    """
    Build a DataFrame of one curated synonym per row from the source organisms.

    Args:
      organisms_df: DataFrame of source organisms, optionally with a `synonyms` column
        containing a list of synonyms per organism

    Returns:
      A DataFrame with `taxonomy_id` and `synonym` columns, or None if the catalog's
      organisms specify no synonyms (in which case there's no table for dbt to read)
    """
    if "synonyms" not in organisms_df.columns:
        return None
    synonyms_df = (
        organisms_df[["taxonomy_id", "synonyms"]]
        .explode("synonyms")
        .dropna()
        .rename(columns={"synonyms": "synonym"})
        .astype({"taxonomy_id": "Int64", "synonym": "string"})
        .drop_duplicates()
    )
    return None if synonyms_df.empty else synonyms_df


def load_catalog_source_data(
    *,
    temp_folder_path: Path,
    dlt_pipeline_prefix: str,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    outbreaks_df: pd.DataFrame | None,
):
    """
    Load unique taxonomy IDs for the catalog's assemblies, organisms, and outbreaks into
    DuckDB, along with the organisms' curated synonyms.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to the dlt pipeline name
      assemblies_df: DataFrame of source assemblies (must include a `taxonomy_id` column)
      organisms_df: DataFrame of source organisms (must include a `taxonomy_id` column, and optionally a `synonyms` column)
      outbreaks_df: DataFrame of source outbreaks (must include a `taxonomy_id` column), or None for catalogs without outbreaks

    Returns:
      Whether any curated organism synonyms were loaded
    """
    # Get dataframes with just unique taxonomy IDs as ints
    assembly_taxa_df = assemblies_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
    organism_taxa_df = organisms_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
    outbreak_taxa_df = (
        outbreaks_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
        if outbreaks_df is not None
        else None
    )

    organism_curated_synonyms_df = get_organism_curated_synonyms_df(organisms_df)

    pipeline = dlt.pipeline(
        pipeline_name=dlt_pipeline_prefix + "catalog_source",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="catalog_source",
    )
    pipeline.run(
        catalog_taxa(
            assembly_taxa_df=assembly_taxa_df,
            organism_taxa_df=organism_taxa_df,
            organism_curated_synonyms_df=organism_curated_synonyms_df,
            outbreak_taxa_df=outbreak_taxa_df,
        )
    )

    return organism_curated_synonyms_df is not None
