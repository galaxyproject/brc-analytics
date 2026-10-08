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

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../schema")


def _line(node):
    return node.start_mark.line + 1


def _mapping_value(mapping_node, key):
    return next(
        (value for key_node, value in mapping_node.value if key_node.value == key),
        None,
    )


def find_assembly_accession_errors(assemblies_path):
    """
    Check an assemblies source file for accessions listed more than once, and for
    entries too malformed to check.

    Args:
        assemblies_path: Path of the assemblies YAML file.

    Returns:
        A list of error messages, empty if the file has no errors. Messages about a
        duplicate or a malformed entry name the (1-based) line numbers involved.
    """
    with open(assemblies_path) as f:
        root = yaml.compose(f)
    if not isinstance(root, yaml.MappingNode):
        return ["Expected a mapping with an `assemblies` list at the top level"]
    assemblies_node = _mapping_value(root, "assemblies")
    if assemblies_node is None:
        return ["No `assemblies` list found at the top level"]
    if not isinstance(assemblies_node, yaml.SequenceNode):
        return [f"`assemblies` on line {_line(assemblies_node)} is not a list"]
    errors = []
    lines_by_accession = defaultdict(list)
    for entry_node in assemblies_node.value:
        if not isinstance(entry_node, yaml.MappingNode):
            errors.append(
                f"Assembly entry on line {_line(entry_node)} is not a mapping"
            )
            continue
        accession_node = _mapping_value(entry_node, "accession")
        if accession_node is None:
            errors.append(
                f"Assembly entry on line {_line(entry_node)} has no accession"
            )
        elif not isinstance(accession_node, yaml.ScalarNode):
            errors.append(
                f"Accession on line {_line(accession_node)} is not a single value"
            )
        else:
            lines_by_accession[accession_node.value].append(_line(accession_node))
    for accession, lines in lines_by_accession.items():
        if len(lines) > 1:
            line_list = ", ".join(map(str, lines))
            errors.append(f"Duplicate accession {accession} on lines {line_list}")
    return errors


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
        if name == "assemblies":
            accession_errors = find_assembly_accession_errors(source_path)
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
