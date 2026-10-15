import os.path
import sys
from argparse import ArgumentParser
from collections import defaultdict

import yaml
from linkml.validator import (
    JsonschemaValidationPlugin,
    Validator,
    default_loader_for_file,
)
from linkml.validator.report import Severity
from pydantic import ValidationError

from ..generated_schema import schema

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../schema")


def find_duplicate_accessions(assemblies):
    """
    Find accessions listed more than once in an assemblies source file.

    Args:
        assemblies: Parsed contents of the assemblies source file.

    Returns:
        A list of error messages, one per duplicated accession, naming the paths of
        the entries that list it, or an empty list if there are no duplicates.
    """
    paths_by_accession = defaultdict(list)
    for index, assembly in enumerate(assemblies.assemblies):
        paths_by_accession[assembly.accession].append(f"/assemblies/{index}")
    return [
        f"Duplicate accession {accession} at {', '.join(paths)}"
        for accession, paths in paths_by_accession.items()
        if len(paths) > 1
    ]


def validate_catalog(source_dir, source_types):
    source_dir = os.path.abspath(source_dir)
    found_errors = False
    for name in source_types:
        print(f"{name}:")
        validator = Validator(
            os.path.join(SCHEMA_DIR, f"{name}.yaml"),
            validation_plugins=[JsonschemaValidationPlugin(closed=True)],
        )
        source_path = os.path.join(source_dir, f"{name}.yml")
        loader = default_loader_for_file(source_path)
        severities = set()
        for result in validator.iter_results_from_source(loader):
            severities.add(result.severity)
            print(f"[{result.severity.value}] {result.message}")
        # Checks beyond the schema rely on the data matching it, so they're skipped
        # if there are schema errors
        if name == "assemblies" and Severity.ERROR not in severities:
            with open(source_path) as f:
                source_data = yaml.safe_load(f)
            try:
                assemblies = schema.Assemblies.model_validate(source_data)
            except ValidationError as e:
                # Can happen when LinkML has no instance to check, e.g. an empty file
                accession_errors = [str(e)]
            else:
                accession_errors = find_duplicate_accessions(assemblies)
            if accession_errors:
                severities.add(Severity.ERROR)
            for message in accession_errors:
                print(f"[{Severity.ERROR.value}] {message}")
        if not severities:
            print("No issues found")
        elif Severity.ERROR in severities:
            found_errors = True
        print("")
    if found_errors:
        print("Validation failed for one or more schemas.")
        sys.exit(1)


def cli():
    parser = ArgumentParser()
    parser.add_argument(
        "source_dir", help="path of directory to validate catalog source files from"
    )
    parser.add_argument(
        "source_type", nargs="+", help="name of a schema/entity type to validate"
    )
    args = parser.parse_args()
    validate_catalog(args.source_dir, args.source_type)


if __name__ == "__main__":
    cli()
