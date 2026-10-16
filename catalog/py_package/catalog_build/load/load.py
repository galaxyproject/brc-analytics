from dataclasses import dataclass
from pathlib import Path

from .catalog_source import load_catalog_source_data
from .common import LoadDestinationParams
from .ncbi_api import load_ncbi_api_data
from .ncbi_taxonomy import load_ncbi_taxonomy
from .ucsc import load_ucsc_data


@dataclass
class LoadParams(LoadDestinationParams):
    """
    Parameters required to load catalog data.

    Attributes:
        temp_folder_path: Path of the temporary folder holding the DuckDB database
        dlt_pipeline_prefix: Catalog-specific prefix applied to dlt pipeline names
        assemblies_path: Path to source assemblies YAML
        organisms_path: Path to source organisms YAML
        workflows_path: Path to source workflows YAML, or None for catalogs that don't build workflows
        taxa_path: Path to source curated taxa YAML, or None for catalogs without curated taxa
        outbreaks_path: Path to source outbreaks YAML, or None for catalogs without outbreaks
    """

    assemblies_path: Path
    organisms_path: Path
    workflows_path: Path | None
    taxa_path: Path | None
    outbreaks_path: Path | None
    ucsc_assemblies_url: str


@dataclass
class LoadResult:
    ncbi_taxdump_md5: str


def do_dlt_load(params: LoadParams):
    """
    Load NCBI taxonomy and catalog source taxa into DuckDB via dlt.

    Args:
      params: LoadParams instance

    Returns:
      A LoadResult with the verified NCBI taxdump MD5 digest
    """
    load_catalog_source_data(
        params,
        assemblies_path=params.assemblies_path,
        organisms_path=params.organisms_path,
        workflows_path=params.workflows_path,
        curated_taxa_path=params.taxa_path,
        outbreaks_path=params.outbreaks_path,
    )

    ncbi_taxdump_md5 = load_ncbi_taxonomy(params)

    load_ncbi_api_data(params)

    load_ucsc_data(params, ucsc_assemblies_url=params.ucsc_assemblies_url)

    return LoadResult(ncbi_taxdump_md5=ncbi_taxdump_md5)
