import pytest
from catalog_build.schema_utils.validate_catalog import (
    find_assembly_accession_errors,
    validate_catalog,
)


def write_assemblies(directory, content):
    path = directory / "assemblies.yml"
    path.write_text(content)
    return path


def test_unique_accessions_have_no_errors(tmp_path):
    path = write_assemblies(
        tmp_path,
        "assemblies:\n  - accession: GCA_000001.1\n  - accession: GCA_000002.1\n",
    )
    assert find_assembly_accession_errors(path) == []


def test_duplicate_accession_is_reported_with_line_numbers(tmp_path):
    path = write_assemblies(
        tmp_path,
        "assemblies:\n"
        "  # organism: Example organism\n"
        "  - accession: GCA_000001.1\n"
        "  - accession: GCA_000002.1\n"
        "  - accession: GCA_000001.1\n"
        "  - accession: GCA_000002.1\n"
        "  - accession: GCA_000001.1\n",
    )
    assert find_assembly_accession_errors(path) == [
        "Duplicate accession GCA_000001.1 on lines 3, 5, 7",
        "Duplicate accession GCA_000002.1 on lines 4, 6",
    ]


@pytest.mark.parametrize(
    ("content", "expected_error"),
    [
        ("", "Expected a mapping with an `assemblies` list at the top level"),
        (
            "- accession: GCA_000001.1\n",
            "Expected a mapping with an `assemblies` list at the top level",
        ),
        ("other: 1\n", "No `assemblies` list found at the top level"),
        ("assemblies: GCA_000001.1\n", "`assemblies` on line 1 is not a list"),
        (
            "assemblies:\n  - accession: GCA_000001.1\n  - GCA_000002.1\n",
            "Assembly entry on line 3 is not a mapping",
        ),
        ("assemblies:\n  - name: x\n", "Assembly entry on line 2 has no accession"),
        (
            "assemblies:\n  - accession: [a, b]\n",
            "Accession on line 2 is not a single value",
        ),
    ],
)
def test_badly_shaped_file_is_reported(tmp_path, content, expected_error):
    path = write_assemblies(tmp_path, content)
    assert find_assembly_accession_errors(path) == [expected_error]


def test_validate_catalog_passes_unique_accessions(tmp_path, capsys):
    write_assemblies(tmp_path, "assemblies:\n  - accession: GCA_000001.1\n")
    validate_catalog(str(tmp_path), ["assemblies"])
    assert "No issues found" in capsys.readouterr().out


@pytest.mark.parametrize(
    ("content", "expected_output"),
    [
        (
            "assemblies:\n  - accession: GCA_000001.1\n  - accession: GCA_000001.1\n",
            "[ERROR] Duplicate accession GCA_000001.1 on lines 2, 3",
        ),
        ("", "[ERROR] Expected a mapping with an `assemblies` list at the top level"),
        (
            "assemblies:\n  - GCA_000001.1\n",
            "[ERROR] Assembly entry on line 2 is not a mapping",
        ),
    ],
)
def test_validate_catalog_fails_with_reason(tmp_path, capsys, content, expected_output):
    write_assemblies(tmp_path, content)
    with pytest.raises(SystemExit) as exit_info:
        validate_catalog(str(tmp_path), ["assemblies"])
    assert exit_info.value.code == 1
    output = capsys.readouterr().out
    assert expected_output in output
    assert "Validation failed for one or more schemas." in output
