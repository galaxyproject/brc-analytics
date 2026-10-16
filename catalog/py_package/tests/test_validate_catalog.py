import pytest
from catalog_build.generated_schema import schema
from catalog_build.schema_utils.validate_catalog import (
    find_duplicate_accessions,
    validate_catalog,
)


def make_assemblies(*accessions):
    return schema.Assemblies(
        assemblies=[schema.Assembly(accession=accession) for accession in accessions]
    )


def write_assemblies(directory, content):
    path = directory / "assemblies.yml"
    path.write_text(content)
    return path


def test_unique_accessions_have_no_errors():
    assert (
        find_duplicate_accessions(make_assemblies("GCA_000001.1", "GCA_000002.1")) == []
    )


def test_duplicate_accession_is_reported_with_paths():
    assemblies = make_assemblies(
        "GCA_000001.1", "GCA_000002.1", "GCA_000001.1", "GCA_000002.1", "GCA_000001.1"
    )
    assert find_duplicate_accessions(assemblies) == [
        "Duplicate accession GCA_000001.1 at "
        "/assemblies/0, /assemblies/2, /assemblies/4",
        "Duplicate accession GCA_000002.1 at /assemblies/1, /assemblies/3",
    ]


def test_validate_catalog_passes_unique_accessions(tmp_path, capsys):
    write_assemblies(tmp_path, "assemblies:\n  - accession: GCA_000001.1\n")
    validate_catalog(str(tmp_path), ["assemblies"])
    assert "No issues found" in capsys.readouterr().out


def test_validate_catalog_skips_accession_check_for_other_schemas(tmp_path, capsys):
    (tmp_path / "taxa.yml").write_text(
        "taxa:\n  - taxonomy_id: 573\n    other_names:\n      - K. pneumoniae\n"
    )
    validate_catalog(str(tmp_path), ["taxa"])
    assert "No issues found" in capsys.readouterr().out


def test_validate_catalog_fails_on_duplicate_accession(tmp_path, capsys):
    write_assemblies(
        tmp_path,
        "assemblies:\n  - accession: GCA_000001.1\n  - accession: GCA_000001.1\n",
    )
    with pytest.raises(SystemExit) as exit_info:
        validate_catalog(str(tmp_path), ["assemblies"])
    assert exit_info.value.code == 1
    output = capsys.readouterr().out
    assert (
        "[ERROR] Duplicate accession GCA_000001.1 at /assemblies/0, /assemblies/1"
        in output
    )
    assert "Validation failed for one or more schemas." in output


def test_validate_catalog_fails_on_empty_assemblies_file(tmp_path, capsys):
    write_assemblies(tmp_path, "")
    with pytest.raises(SystemExit) as exit_info:
        validate_catalog(str(tmp_path), ["assemblies"])
    assert exit_info.value.code == 1
    output = capsys.readouterr().out
    assert "[ERROR] 1 validation error for Assemblies" in output
    assert "Validation failed for one or more schemas." in output


def test_validate_catalog_skips_accession_check_on_schema_errors(tmp_path, capsys):
    write_assemblies(
        tmp_path,
        "assemblies:\n"
        "  - accession: GCA_000001.1\n"
        "  - accession: GCA_000001.1\n"
        "  - GCA_000002.1\n",
    )
    with pytest.raises(SystemExit) as exit_info:
        validate_catalog(str(tmp_path), ["assemblies"])
    assert exit_info.value.code == 1
    output = capsys.readouterr().out
    assert "[ERROR] 'GCA_000002.1' is not of type 'object' in /assemblies/2" in output
    assert "Duplicate accession" not in output
    assert "Validation failed for one or more schemas." in output
