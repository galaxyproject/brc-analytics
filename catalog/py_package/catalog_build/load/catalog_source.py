from pathlib import Path

import dlt
import pandas as pd
from linkml_runtime.loaders import YAMLLoader

from ..generated_schema import schema
from ..utils import get_db_path_string


def read_dataframe_from_yaml(
    yaml_path: Path, schema_model: type[schema.ConfiguredBaseModel], list_key: str
):
    """
    Reads a YAML file using a given Pydantic model, and creates a dataframe from a list of entities provided by the data.

    Args:
        yaml_path: Path of the YAML file to read.
        schema_model: Pydantic model representing the root schema class for the YAML file.
        list_key: Key of the root object in which the list of entities is held.

    Returns:
        df: Dataframe representing the list of entities.
    """
    yaml_data = YAMLLoader().load(source=str(yaml_path), target_class=schema_model)
    return pd.DataFrame(row.model_dump() for row in getattr(yaml_data, list_key))


def read_assemblies(assemblies_path: Path):
    return read_dataframe_from_yaml(assemblies_path, schema.Assemblies, "assemblies")


def read_organisms(organisms_path: Path):
    return read_dataframe_from_yaml(organisms_path, schema.Organisms, "organisms")


def read_outbreaks(outbreaks_path: Path):
    return read_dataframe_from_yaml(outbreaks_path, schema.Outbreaks, "outbreaks")


@dlt.resource(name="outbreaks", write_disposition="replace")
def outbreaks_source(outbreaks_path: Path):
    yield read_outbreaks(outbreaks_path)


@dlt.resource(name="organisms", write_disposition="replace")
def organisms_source(organisms_path: Path):
    yield read_organisms(organisms_path)


@dlt.resource(name="assemblies", write_disposition="replace")
def assemblies_source(assemblies_path: Path):
    yield read_assemblies(assemblies_path)


@dlt.source
def catalog_source(
    *,
    assemblies_path: Path,
    organisms_path: Path,
    outbreaks_path: Path | None,
):
    resources = [
        assemblies_source(assemblies_path),
        organisms_source(organisms_path),
    ]
    # Only load outbreaks for catalogs that have them; when absent, the shared
    # dbt models skip using outbreaks data entirely (see has_outbreaks var)
    if outbreaks_path is not None:
        resources.append(outbreaks_source(outbreaks_path))
    return resources


def load_catalog_source_data(
    *,
    temp_folder_path: Path,
    dlt_pipeline_prefix: str,
    assemblies_path: Path,
    organisms_path: Path,
    outbreaks_path: Path | None,
):
    """
    Load unique taxonomy IDs for the catalog's assemblies, organisms, and outbreaks into
    DuckDB, along with the organisms' curated synonyms.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      dlt_pipeline_prefix: Catalog-specific prefix applied to the dlt pipeline name
      assemblies_df: DataFrame of source assemblies (must include a `taxonomy_id` column)
      organisms_df: DataFrame of source organisms (must include `taxonomy_id` and `synonyms` columns, the latter containing a list of curated synonyms or None per organism)
      outbreaks_df: DataFrame of source outbreaks (must include a `taxonomy_id` column), or None for catalogs without outbreaks
    """
    pipeline = dlt.pipeline(
        pipeline_name=dlt_pipeline_prefix + "catalog_source",
        destination=dlt.destinations.duckdb(get_db_path_string(temp_folder_path)),
        dataset_name="catalog_source",
    )
    pipeline.run(
        catalog_source(
            assemblies_path=assemblies_path,
            organisms_path=organisms_path,
            outbreaks_path=outbreaks_path,
        )
    )
