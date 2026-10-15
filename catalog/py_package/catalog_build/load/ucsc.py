import dlt
import pandas as pd
import requests
from pydantic import BaseModel

from ..utils import get_db_path_string
from .load import LoadDestinationParams


class UcscAssembly(BaseModel):
    ucscBrowser: str
    genBank: str | None
    refSeq: str | None


@dlt.resource(name="assembly_list", write_disposition="replace", columns=UcscAssembly)
def ucsc_assembly_list(url: str):
    yield pd.DataFrame(requests.get(url).json()["data"])


@dlt.source
def ucsc_data(*, assemblies_url: str):
    return [ucsc_assembly_list(assemblies_url)]


def load_ucsc_data(dest: LoadDestinationParams, ucsc_assemblies_url: str):
    pipeline = dlt.pipeline(
        pipeline_name=dest.dlt_pipeline_prefix + "ucsc",
        destination=dlt.destinations.duckdb(get_db_path_string(dest.temp_folder_path)),
        dataset_name="ucsc",
    )
    pipeline.run(ucsc_data(assemblies_url=ucsc_assemblies_url))
