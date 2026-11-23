import shutil
from pathlib import Path
from types import SimpleNamespace

import duckdb
import pytest
from catalog_build.transform import transform
from catalog_build.transform.transform import (
    DbtCommandError,
    DBTTestResult,
    _get_test_results,
    do_dbt_transformations,
)
from catalog_build.utils import get_db_path
from dbt.artifacts.schemas.results import TestStatus

FIXTURE_PROJECT_PATH = Path(__file__).parent / "data" / "dbt_transform_project"


@pytest.fixture(autouse=True)
def no_dbt_tracking(monkeypatch):
    # Keep dbt from sending anonymous usage stats during tests
    monkeypatch.setenv("DO_NOT_TRACK", "1")


@pytest.fixture
def dbt_project_path(tmp_path, monkeypatch):
    """
    A copy of the fixture dbt project, used in place of the catalog's own project.
    Copying it lets tests add models without touching the fixture.
    """
    project_path = tmp_path / "dbt"
    shutil.copytree(FIXTURE_PROJECT_PATH, project_path)
    monkeypatch.setattr(transform, "DBT_FOLDER_PATH", str(project_path))
    return project_path


@pytest.fixture
def temp_folder_path(tmp_path):
    path = tmp_path / "temp"
    path.mkdir()
    return path


def run_transformations(temp_folder_path):
    return do_dbt_transformations(
        temp_folder_path,
        taxonomic_levels=["species"],
        has_curated_taxa=False,
        has_outbreaks=False,
        has_workflows=False,
    )


def test_test_results_include_status_failure_count_and_sample(
    dbt_project_path, temp_folder_path
):
    result = run_transformations(temp_folder_path)

    assert result.dbt_test_results == [
        DBTTestResult(
            test_name="items_id_unique",
            success=False,
            status="warn",
            message="Got 1 result, configured to warn if != 0",
            failure_count=1,
            failure_sample=[{"unique_field": 1, "n_records": 2}],
        ),
        DBTTestResult(
            test_name="items_name_not_null",
            success=True,
            status="pass",
            message=None,
            failure_count=0,
        ),
    ]


def test_dbt_output_is_written_under_temp_folder(dbt_project_path, temp_folder_path):
    run_transformations(temp_folder_path)

    assert (temp_folder_path / "dbt" / "target" / "run_results.json").is_file()
    assert (temp_folder_path / "dbt" / "logs" / "dbt.log").is_file()
    assert not (dbt_project_path / "target").exists()
    assert not (dbt_project_path / "logs").exists()


def test_database_opens_read_only_after_transformations(
    dbt_project_path, temp_folder_path
):
    run_transformations(temp_folder_path)

    with duckdb.connect(str(get_db_path(temp_folder_path)), read_only=True) as con:
        assert con.query("select count(*) from items").fetchone() == (3,)


def test_failing_model_raises_naming_the_node(dbt_project_path, temp_folder_path):
    (dbt_project_path / "models" / "broken.sql").write_text(
        "select * from missing_table"
    )

    with pytest.raises(DbtCommandError) as exc_info:
        run_transformations(temp_folder_path)

    assert exc_info.value.command == "run"
    message = str(exc_info.value)
    assert "model.transform_fixture.broken (error)" in message
    assert str(temp_folder_path.resolve() / "dbt" / "logs" / "dbt.log") in message
    # dbt-duckdb's connection is closed even when dbt fails
    with duckdb.connect(str(get_db_path(temp_folder_path)), read_only=True):
        pass


def test_project_error_raises_with_dbt_exception(dbt_project_path, temp_folder_path):
    (dbt_project_path / "models" / "broken.sql").write_text(
        "select * from {{ ref('missing_model') }}"
    )

    with pytest.raises(DbtCommandError) as exc_info:
        run_transformations(temp_folder_path)

    assert exc_info.value.command == "run"
    assert "missing_model" in str(exc_info.value)


def test_test_results_are_sorted_by_name(temp_folder_path):
    # With several threads, dbt reports tests in the order they finish, so the
    # results are passed in shuffled. Stand-ins replace dbt's RunResults, since a
    # dbt run with one thread already reports tests in name order.
    def passing_test_result(name):
        return SimpleNamespace(
            status=TestStatus.Pass,
            node=SimpleNamespace(unique_id=f"test.transform_fixture.{name}.abc123"),
            failures=0,
            message=None,
        )

    duckdb.connect(str(get_db_path(temp_folder_path))).close()

    results = _get_test_results(
        [passing_test_result(name) for name in ("b_test", "c_test", "a_test")],
        temp_folder_path,
    )

    assert [result.test_name for result in results] == ["a_test", "b_test", "c_test"]
