from pathlib import Path

import dlt
import pandas as pd

from ..utils import get_db_path_string


@dlt.resource(name="outbreak_taxa", write_disposition="replace")
def outbreak_taxa(df: pd.DataFrame):
    yield df


@dlt.resource(
    name="curated_taxa",
    write_disposition="replace",
    # The type is specified explicitly because it can't be inferred when no taxon
    # specifies any other names, in which case the column wouldn't be materialized at all
    columns={"other_names": {"data_type": "json"}},
)
def curated_taxa(df: pd.DataFrame):
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
    curated_taxa_df: pd.DataFrame | None,
    outbreak_taxa_df: pd.DataFrame | None,
):
    resources = [
        assembly_taxa(assembly_taxa_df),
        organism_taxa(organism_taxa_df),
    ]
    # Only load curated taxa for catalogs that curate any; when absent, the shared
    # dbt models skip the curated_taxa source entirely (see has_curated_taxa var)
    if curated_taxa_df is not None:
        resources.append(curated_taxa(curated_taxa_df))
    # Only load outbreak taxa for catalogs that have outbreaks; when absent, the
    # shared dbt models skip the outbreak_taxa source entirely (see has_outbreaks var)
    if outbreak_taxa_df is not None:
        resources.append(outbreak_taxa(outbreak_taxa_df))
    return resources


def load_catalog_source_data(
    *,
    temp_folder_path: Path,
    dlt_pipeline_prefix: str,
    assemblies_df: pd.DataFrame,
    organisms_df: pd.DataFrame,
    taxa_df: pd.DataFrame | None,
    outbreaks_df: pd.DataFrame | None,
):
    """
    Load unique taxonomy IDs for the catalog's assemblies, organisms, and outbreaks into
    DuckDB, along with the curated information provided for individual taxa.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to the dlt pipeline name
      assemblies_df: DataFrame of source assemblies (must include a `taxonomy_id` column)
      organisms_df: DataFrame of source organisms (must include a `taxonomy_id` column)
      taxa_df: DataFrame of source curated taxa (must include `taxonomy_id` and `other_names` columns, the latter containing a list of curated other names per taxon), or None for catalogs without curated taxa
      outbreaks_df: DataFrame of source outbreaks (must include a `taxonomy_id` column), or None for catalogs without outbreaks
    """
    # Get dataframes with just unique taxonomy IDs as ints, plus the curated taxa's
    # other names; duplicates are dropped by taxonomy ID alone, since the lists of other names
    # aren't hashable
    assembly_taxa_df = assemblies_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
    organism_taxa_df = organisms_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
    curated_taxa_df = (
        taxa_df[["taxonomy_id", "other_names"]]
        .astype({"taxonomy_id": "Int64"})
        .drop_duplicates(subset="taxonomy_id")
        if taxa_df is not None
        else None
    )
    outbreak_taxa_df = (
        outbreaks_df[["taxonomy_id"]].astype("Int64").drop_duplicates()
        if outbreaks_df is not None
        else None
    )

    pipeline = dlt.pipeline(
        pipeline_name=dlt_pipeline_prefix + "catalog_source",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="catalog_source",
    )
    pipeline.run(
        catalog_taxa(
            assembly_taxa_df=assembly_taxa_df,
            organism_taxa_df=organism_taxa_df,
            curated_taxa_df=curated_taxa_df,
            outbreak_taxa_df=outbreak_taxa_df,
        )
    )
