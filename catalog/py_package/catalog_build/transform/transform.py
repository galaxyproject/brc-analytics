import os
from pathlib import Path

from dlt.helpers.dbt.configuration import DBTRunnerConfiguration
from dlt.helpers.dbt.runner import create_runner

from ..utils import get_db_path_string

DBT_FOLDER_PATH = str(Path(__file__).parent / "dbt")


def do_dbt_transformations(
    temp_folder_path: Path, *, taxonomic_levels: list[str], has_outbreaks: bool
):
    os.environ["CATALOG_BUILD_DUCKDB_PATH"] = get_db_path_string(temp_folder_path)
    runner = create_runner(
        None,
        None,
        None,
        config=DBTRunnerConfiguration(
            package_location=DBT_FOLDER_PATH,
            package_profiles_dir=DBT_FOLDER_PATH,
            package_profile_name="catalog_build",
            package_additional_vars={
                "taxonomic_levels": taxonomic_levels,
                "has_outbreaks": has_outbreaks,
            },
        ),
    )
    runner.run_all()
