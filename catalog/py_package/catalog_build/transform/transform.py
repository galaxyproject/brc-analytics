import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

import duckdb
from dlt.helpers.dbt.configuration import DBTRunnerConfiguration
from dlt.helpers.dbt.exceptions import DBTNodeResult
from dlt.helpers.dbt.runner import DBTPackageRunner, create_runner

from ..utils import get_db_path, get_db_path_string

DBT_FOLDER_PATH = str(Path(__file__).parent / "dbt")

# Number of failing rows to include per test in the QC report.
FAILURE_SAMPLE_SIZE = 20


@dataclass
class DBTTestResult:
    test_name: str
    success: bool
    status: str
    message: str | None
    failure_count: int | None = None
    # A sample of failing rows (column name -> value). Empty when the test
    # passed, stored no failures, or the rows couldn't be read.
    failure_sample: list[dict[str, object]] = field(default_factory=list)


@dataclass
class TransformResult:
    dbt_test_results: list[DBTTestResult]


def _load_run_results() -> dict:
    """Read dbt's run_results.json artifact from the most recent dbt invocation."""
    run_results_path = Path(DBT_FOLDER_PATH) / "target" / "run_results.json"
    with open(run_results_path, encoding="utf-8") as file:
        return json.load(file)


def _test_name_from_unique_id(unique_id: str) -> str:
    # Test unique IDs have the form `test.<package>.<name>.<hash>`. The custom
    # names set in schema.yml keep `<name>` short and meaningful.
    parts = unique_id.split(".")
    return parts[-2] if len(parts) >= 2 else unique_id


def _fetch_failure_sample(
    con: duckdb.DuckDBPyConnection, relation_name: str, sample_size: int
) -> list[dict[str, object]]:
    # `relation_name` comes straight from dbt and is already fully qualified and
    # quoted, so we rely on it rather than reconstructing the (potentially
    # truncated) audit table name ourselves. `ORDER BY ALL` (sort by every
    # column, left to right) makes the sampled rows deterministic across runs,
    # since `LIMIT` on its own would otherwise return an arbitrary subset.
    relation = con.query(
        f"SELECT * FROM {relation_name} ORDER BY ALL LIMIT {sample_size}"
    )
    columns = relation.columns
    return [dict(zip(columns, row)) for row in relation.fetchall()]


def _test_status_is_success(status: str) -> bool:
    return status == "pass"


def _get_test_results_from_runner(
    runner_results: Sequence[DBTNodeResult],
) -> list[DBTTestResult]:
    # Sorted by name, since dbt reports the tests in the order they finished
    return sorted(
        (
            DBTTestResult(
                test_name=runner_result.model_name,
                success=_test_status_is_success(runner_result.status),
                status=runner_result.status,
                message=runner_result.message,
            )
            for runner_result in runner_results
        ),
        key=lambda result: result.test_name,
    )


def _get_detailed_test_results(temp_folder_path: Path) -> list[DBTTestResult]:
    """
    Collect detailed results from a previous dbt test run, including a sample of
    failing rows for each unsuccessful test.

    With store_failures enabled, dbt writes failing rows to audit tables; the
    run_results.json artifact records the exact table name for each test via its
    `relation_name`, which we query to pull the sample.
    """
    run_results = _load_run_results()

    results: list[DBTTestResult] = []
    with duckdb.connect(str(get_db_path(temp_folder_path)), read_only=True) as con:
        for node in run_results["results"]:
            status = node["status"]
            success = _test_status_is_success(status)
            test_name = _test_name_from_unique_id(node["unique_id"])
            failure_count = node.get("failures")
            relation_name = node.get("relation_name")

            failure_sample: list[dict[str, object]] = []
            if not success and relation_name and (failure_count or 0) > 0:
                try:
                    failure_sample = _fetch_failure_sample(
                        con, relation_name, FAILURE_SAMPLE_SIZE
                    )
                except duckdb.Error as error:
                    print(
                        f"Could not read failing rows for dbt test {test_name} "
                        f"from {relation_name}: {error}"
                    )

            results.append(
                DBTTestResult(
                    test_name=test_name,
                    success=success,
                    status=status,
                    message=node.get("message"),
                    failure_count=failure_count,
                    failure_sample=failure_sample,
                )
            )
    # Sorted by name, since dbt runs the tests across several threads and records them
    # in the order they finished
    results.sort(key=lambda result: result.test_name)
    return results


def get_test_results(
    runner: DBTPackageRunner, temp_folder_path: Path
) -> list[DBTTestResult]:
    """
    Run the dbt tests and collect their results.
    """
    # Execute the tests (this also refreshes run_results.json with the detailed results).
    runner_results = runner.test()

    try:
        return _get_detailed_test_results(temp_folder_path)
    except Exception as e:
        print(
            f"Falling back to tests summary from dbt runner; reading detailed results failed: {e}"
        )
        return _get_test_results_from_runner(runner_results)


def do_dbt_transformations(
    temp_folder_path: Path,
    *,
    taxonomic_levels: list[str],
    has_outbreaks: bool,
    has_curated_synonyms: bool,
) -> TransformResult:
    """
    Run the dbt transformations against the loaded DuckDB database.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      taxonomic_levels: Taxonomic levels to build columns for, passed to dbt as a var
      has_outbreaks: Whether the catalog includes outbreaks, passed to dbt as a var so
        the shared models can skip outbreak-specific logic when absent
      has_curated_synonyms: Whether any curated organism synonyms were loaded, passed to
        dbt as a var so the shared models can skip the source table when it's absent

    Returns:
      A TransformResult containing the dbt test results
    """
    runner = create_runner(
        None,
        None,
        None,
        config=DBTRunnerConfiguration(
            package_location=DBT_FOLDER_PATH,
            package_profiles_dir=DBT_FOLDER_PATH,
            package_profile_name="catalog_build",
            package_additional_vars={
                "duckdb_path": get_db_path_string(temp_folder_path),
                "taxonomic_levels": taxonomic_levels,
                "has_outbreaks": has_outbreaks,
                "has_curated_synonyms": has_curated_synonyms,
            },
        ),
    )
    runner.run_all()
    return TransformResult(dbt_test_results=get_test_results(runner, temp_folder_path))
