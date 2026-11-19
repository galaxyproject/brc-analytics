import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

import duckdb
from dbt.adapters.duckdb.connections import DuckDBConnectionManager
from dbt.adapters.duckdb.environments.local import LocalEnvironment
from dbt.artifacts.schemas.results import NodeStatus
from dbt.artifacts.schemas.run import RunExecutionResult, RunResult
from dbt.cli.main import dbtRunner, dbtRunnerResult

from ..utils import get_db_path, get_db_path_string

DBT_FOLDER_PATH = str(Path(__file__).parent / "dbt")

# Number of failing rows to include per test in the QC report.
FAILURE_SAMPLE_SIZE = 20

# Node statuses that indicate a model or test could not be completed. Model
# (RunStatus) and test (TestStatus) statuses share their values with NodeStatus.
_UNSUCCESSFUL_NODE_STATUSES = {
    NodeStatus.Error,
    NodeStatus.Fail,
    NodeStatus.RuntimeErr,
}


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


class DbtCommandError(RuntimeError):
    """Raised when a dbt command doesn't complete successfully."""

    def __init__(
        self, command: str, dbt_result: dbtRunnerResult, log_path: Path
    ) -> None:
        self.command = command
        self.dbt_result = dbt_result
        super().__init__(_describe_dbt_failure(command, dbt_result, log_path))


def _get_node_results(dbt_result: dbtRunnerResult) -> Sequence[RunResult]:
    if isinstance(dbt_result.result, RunExecutionResult):
        return dbt_result.result.results
    return []


def _describe_dbt_failure(
    command: str, dbt_result: dbtRunnerResult, log_path: Path
) -> str:
    failed_nodes = [
        node_result
        for node_result in _get_node_results(dbt_result)
        if node_result.status in _UNSUCCESSFUL_NODE_STATUSES
    ]
    lines = [f"dbt {command} failed"]
    lines.extend(
        f"- {node_result.node.unique_id} ({node_result.status.value}): {node_result.message}"
        for node_result in failed_nodes
    )
    if not failed_nodes and dbt_result.exception is not None:
        # dbt failed before running any nodes, e.g. while parsing the project
        lines.append(f"- {dbt_result.exception}")
    lines.append(f"See {log_path / 'dbt.log'} for dbt's full log.")
    return "\n".join(lines)


def _invoke_dbt(
    command: str, common_args: Sequence[str], log_path: Path, *command_args: str
) -> dbtRunnerResult:
    """
    Run a dbt command in-process, raising DbtCommandError if it doesn't succeed.

    `common_args` must direct dbt's logs to `log_path`, which is referenced in the
    error message.
    """
    dbt_result = dbtRunner().invoke([command, *common_args, *command_args])
    if not dbt_result.success:
        raise DbtCommandError(command, dbt_result, log_path) from dbt_result.exception
    return dbt_result


def _close_dbt_duckdb_connection() -> None:
    """
    Close the DuckDB connection that dbt-duckdb keeps open after dbt finishes.

    dbt-duckdb caches the database connection at class level and leaves it open
    for the life of the process. Left open, it blocks opening the database with a
    different configuration (e.g. read-only), and a later connection to a
    recreated database file at the same path would reuse it, pointing at the old
    file.
    """
    try:
        env = DuckDBConnectionManager.env()
    except Exception:
        # No environment was created, e.g. because dbt failed while parsing
        env = None
    # A local DuckDB file, as our profile uses, is the environment type that holds
    # the connection
    if isinstance(env, LocalEnvironment):
        env.close()
    DuckDBConnectionManager.close_all_connections()


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
    return [dict(zip(columns, row, strict=True)) for row in relation.fetchall()]


def _test_status_is_success(status: str) -> bool:
    return status == "pass"


def _to_test_result(
    node_result: RunResult, con: duckdb.DuckDBPyConnection | None
) -> DBTTestResult:
    status = node_result.status.value
    success = _test_status_is_success(status)
    test_name = _test_name_from_unique_id(node_result.node.unique_id)
    failure_count = node_result.failures
    relation_name = getattr(node_result.node, "relation_name", None)

    failure_sample: list[dict[str, object]] = []
    if con is not None and not success and relation_name and (failure_count or 0) > 0:
        try:
            failure_sample = _fetch_failure_sample(
                con, relation_name, FAILURE_SAMPLE_SIZE
            )
        except duckdb.Error as error:
            print(
                f"Could not read failing rows for dbt test {test_name} "
                f"from {relation_name}: {error}"
            )

    return DBTTestResult(
        test_name=test_name,
        success=success,
        status=status,
        message=node_result.message,
        failure_count=failure_count,
        failure_sample=failure_sample,
    )


def _get_test_results(
    test_node_results: Sequence[RunResult], temp_folder_path: Path
) -> list[DBTTestResult]:
    """
    Convert dbt's test results into DBTTestResults, including a sample of failing
    rows for each unsuccessful test.

    With store_failures enabled, dbt writes failing rows to audit tables; each
    test result records the exact table name via its node's `relation_name`,
    which we query to pull the sample. If the database can't be opened, the
    results are returned without samples rather than failing the build.
    """
    con: duckdb.DuckDBPyConnection | None
    try:
        con = duckdb.connect(str(get_db_path(temp_folder_path)), read_only=True)
    except duckdb.Error as error:
        print(
            f"Could not open the database to read failing rows for dbt tests: {error}"
        )
        con = None
    try:
        results = [
            _to_test_result(node_result, con) for node_result in test_node_results
        ]
    finally:
        if con is not None:
            con.close()
    # Sorted by name, since dbt runs the tests across several threads and reports
    # them in the order they finished
    results.sort(key=lambda result: result.test_name)
    return results


def do_dbt_transformations(
    temp_folder_path: Path,
    *,
    taxonomic_levels: list[str],
    has_curated_taxa: bool,
    has_outbreaks: bool,
    has_workflows: bool,
) -> TransformResult:
    """
    Run the dbt transformations and tests against the loaded DuckDB database.

    dbt's artifacts (`target/`) and logs are written under the temporary folder, so
    that each catalog's build keeps its own.

    Args:
      temp_folder_path: Path of the temporary folder holding the DuckDB database
      taxonomic_levels: Taxonomic levels to build columns for, passed to dbt as a var
      has_curated_taxa: Whether the catalog curates information for individual taxa,
        passed to dbt as a var so the shared models can skip the curated_taxa source
        when absent
      has_outbreaks: Whether the catalog includes outbreaks, passed to dbt as a var so
        the shared models can skip outbreak-specific logic when absent
      has_workflows: Whether the catalog includes workflows, passed to dbt as a var

    Returns:
      A TransformResult containing the dbt test results

    Raises:
      DbtCommandError: If a model fails to build or a test can't be run (tests that
        merely find failing rows are reported as warnings, not errors)
    """
    dbt_vars = {
        "duckdb_path": get_db_path_string(temp_folder_path),
        "taxonomic_levels": taxonomic_levels,
        "has_curated_taxa": has_curated_taxa,
        "has_outbreaks": has_outbreaks,
        "has_workflows": has_workflows,
    }
    dbt_output_path = temp_folder_path.resolve() / "dbt"
    log_path = dbt_output_path / "logs"
    common_args = [
        "--project-dir",
        DBT_FOLDER_PATH,
        "--profiles-dir",
        DBT_FOLDER_PATH,
        "--target-path",
        str(dbt_output_path / "target"),
        "--log-path",
        str(log_path),
        "--vars",
        json.dumps(dbt_vars),
        "--quiet",
    ]

    try:
        _invoke_dbt("run", common_args, log_path, "--fail-fast")
        test_result = _invoke_dbt("test", common_args, log_path)
    finally:
        _close_dbt_duckdb_connection()

    return TransformResult(
        dbt_test_results=_get_test_results(
            _get_node_results(test_result), temp_folder_path
        )
    )
