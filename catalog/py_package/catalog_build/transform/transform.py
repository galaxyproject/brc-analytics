import os
from dataclasses import dataclass
from pathlib import Path

from dlt.helpers.dbt.configuration import DBTRunnerConfiguration
from dlt.helpers.dbt.runner import DBTPackageRunner, create_runner

from ..utils import get_db_path_string

DBT_FOLDER_PATH = str(Path(__file__).parent / "dbt")


@dataclass
class DBTTestResult:
    test_name: str
    failed: bool
    message: str | None


@dataclass
class TransformResult:
    dbt_test_results: list[DBTTestResult]


def get_test_results(runner: DBTPackageRunner) -> list[DBTTestResult]:
    return [
        DBTTestResult(
            test_name=runner_result.model_name,
            failed=runner_result.status != "pass",
            message=runner_result.message,
        )
        for runner_result in runner.test()
    ]


def do_dbt_transformations(
    temp_folder_path: Path, *, taxonomic_levels: list[str], has_outbreaks: bool
) -> TransformResult:
    """
    Run the dbt transformations against the loaded DuckDB database.

    Sets the `CATALOG_BUILD_DUCKDB_PATH` environment variable, which the dbt profile
    reads to locate the database.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      taxonomic_levels: Taxonomic levels to build columns for, passed to dbt as a var
      has_outbreaks: Whether the catalog includes outbreaks, passed to dbt as a var so
        the shared models can skip outbreak-specific logic when absent

    Returns:
      A TransformResult containing the dbt test results
    """
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
    return TransformResult(dbt_test_results=get_test_results(runner))
