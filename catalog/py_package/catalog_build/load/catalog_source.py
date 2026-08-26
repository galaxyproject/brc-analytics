from pathlib import Path
from typing import ClassVar

import dlt
import yaml

from ..generated_schema import schema
from ..utils import get_db_path_string


def read_entity_list_from_yaml(yaml_path: Path, list_key: str):
    """
    Reads a YAML file and extracts a list of entities provided therein.

    Args:
        yaml_path: Path of the YAML file to read.
        list_key: Key of the root object in which the list of entities is held.

    Returns:
        entities: List of entities.
    """
    with yaml_path.open() as f:
        yaml_data = yaml.safe_load(f)
    return yaml_data[list_key]


def read_assemblies(assemblies_path: Path):
    return read_entity_list_from_yaml(assemblies_path, "assemblies")


def read_organisms(organisms_path: Path):
    return read_entity_list_from_yaml(organisms_path, "organisms")


def read_outbreaks(outbreaks_path: Path):
    return read_entity_list_from_yaml(outbreaks_path, "outbreaks")


@dlt.resource(name="outbreaks", write_disposition="replace", columns=schema.Outbreak)
def outbreaks_source(outbreaks_path: Path):
    yield read_outbreaks(outbreaks_path)


@dlt.resource(name="organisms", write_disposition="replace", columns=schema.Organism)
def organisms_source(organisms_path: Path):
    yield read_organisms(organisms_path)


@dlt.resource(name="assemblies", write_disposition="replace", columns=schema.Assembly)
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
      assemblies_path: Path of source assemblies YAML
      organisms_path: Path of source organisms YAML
      outbreaks_path: Path of source outbreaks YAML, or None for catalogs without outbreaks
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
