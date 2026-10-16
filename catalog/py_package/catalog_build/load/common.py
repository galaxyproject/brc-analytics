from collections.abc import Iterable
from dataclasses import dataclass
from itertools import batched
from pathlib import Path

import pandas as pd

# Rows per yielded DataFrame for large input datasets. Tuning knob: larger means
# fewer dlt round-trips but higher peak memory; smaller means lower memory but
# more per-chunk overhead.
INPUT_LIST_CHUNK_SIZE = 100_000


@dataclass
class LoadDestinationParams:
    """
    Parameters used to determine the destinations at which to load catalog data.

    Attributes:
        temp_folder_path: Path of the temporary folder holding the DuckDB database
        dlt_pipeline_prefix: Catalog-specific prefix applied to dlt pipeline names
    """

    temp_folder_path: Path
    dlt_pipeline_prefix: str


def rows_to_chunked_dataframes(rows: Iterable, dtypes: dict[str, str] | None = None):
    """
    Yield DataFrames of at most `INPUT_LIST_CHUNK_SIZE` rows read from the specified iterable.

    Chunking the file into multiple DataFrames avoids materializing the entire dataset
    in memory at once, at the cost of more items handed to dlt.

    Args:
      rows: Iterable of rows to be passed to the DataFrame constructor
      dtypes: Optional column dtypes applied to each yielded DataFrame

    Yields:
      A DataFrame for each chunk of rows read from the iterable
    """
    for chunk in batched(rows, INPUT_LIST_CHUNK_SIZE):
        df = pd.DataFrame(chunk)
        if dtypes is not None:
            df = df.astype(dtypes)
        yield df
