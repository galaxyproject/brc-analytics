import dlt
import pandas as pd
import requests
from pydantic import BaseModel


class UcscAssembly(BaseModel):
    ucscBrowser: str
    genBank: str | None
    refSeq: str | None


@dlt.resource(name="assembly_list", write_disposition="replace", columns=UcscAssembly)
def ucsc_assembly_list(url: str):
    yield pd.DataFrame(requests.get(url).json()["data"])
