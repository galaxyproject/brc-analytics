import os.path
import sys
from argparse import ArgumentParser

from linkml.validator import (
    JsonschemaValidationPlugin,
    Validator,
    default_loader_for_file,
)
from linkml.validator.report import Severity

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../schema")


def validate_catalog(source_dir, source_types):
    source_dir = os.path.abspath(source_dir)
    found_errors = False
    for name in source_types:
        print(f"{name}:")
        validator = Validator(
            os.path.join(SCHEMA_DIR, f"{name}.yaml"),
            validation_plugins=[JsonschemaValidationPlugin(closed=True)],
        )
        loader = default_loader_for_file(os.path.join(source_dir, f"{name}.yml"))
        severities = set()
        for result in validator.iter_results_from_source(loader):
            severities.add(result.severity)
            print(f"[{result.severity.value}] {result.message}")
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
