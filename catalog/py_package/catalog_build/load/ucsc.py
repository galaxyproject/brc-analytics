import gzip
import io

import dlt
import requests
from pydantic import BaseModel

from .common import LoadDestinationParams, rows_to_chunked_dataframes


class UcscAssembly(BaseModel):
    ucscBrowser: str
    genBank: str | None
    refSeq: str | None


def load_gen_ark_file_list():
    print("Downloading genArkFileList.txt.gz...")
    genark_url = "https://hgdownload.soe.ucsc.edu/hubs/genArkFileList.txt.gz"
    response = requests.get(genark_url)
    response.raise_for_status()
    with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as f:
        for line in f:
            line = line.decode("utf-8").strip()
            yield {"path": line}


@dlt.resource(name="gen_ark_file_list", write_disposition="replace")
def gen_ark_file_list():
    yield from rows_to_chunked_dataframes(load_gen_ark_file_list())


@dlt.resource(name="assembly_list", write_disposition="replace", columns=UcscAssembly)
def ucsc_assembly_list(url: str):
    yield requests.get(url).json()["data"]


@dlt.source
def ucsc_data(*, assemblies_url: str):
    return [ucsc_assembly_list(assemblies_url), gen_ark_file_list()]


def load_ucsc_data(dest: LoadDestinationParams, ucsc_assemblies_url: str):
    pipeline = dlt.pipeline(
        pipeline_name=dest.get_dlt_pipeline_name("ucsc"),
        destination=dlt.destinations.duckdb(dest.get_db_path_string()),
        dataset_name="ucsc",
    )
    pipeline.run(ucsc_data(assemblies_url=ucsc_assemblies_url))
