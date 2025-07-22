# Catalog-build package usage

## Setup

### Installation

The package can be installed using Pip with a command of the form:

```bash
pip install -e "git+https://github.com/galaxyproject/brc-analytics.git@catalog_build_v<VERSION>#egg=catalog_build&subdirectory=catalog/py_package"
```

This installs the package from the BRC Analytics GitHub repository, referencing a git tag named in the pattern `catalog_build_v<VERSION>`; `<VERSION>` should be replaced with the desired version number of the package as defined in `setup.py` (although note that this requires that a tag for that version actually exist in the BRC Analytics repository).

### Scripts

The package provides modules that can be used for scripts to manage the catalog and schema; it may be desirable to set up shortcuts for running these. See below for details on using each module.

## Updating

## Modules

### `build`

Used to build catalog data from local input files and external services.

### `iwc_manifest_to_workflows_yaml`

Can be run as a command-line script to update the catalog input workflows file based on the IWC manifest. Any missing workflows and workflow parameters are added to the specified workflows YAML file. New workflows will have `active` set to `false`, and must be manually updated in the YAML in order to be available in the app, and new parameters will only have a `type_guide` for human reference, and must be manually given a value source (such as a `variable` field) in order to be populated by the app when launching Galaxy.

Example:

```bash
# Update the workflows source file at ./catalog/source/workflows.yaml, excluding
# workflows with an unclear category.
python -m catalog_build.iwc_manifest_to_workflows_yaml ./catalog/source/workflows.yml --exclude-other
```

### `generated_schema.schema`

Contains Pydantic models for schema entities. Mainly included for internal use, but could be used by a custom Python script that interacts with the catalog source files.

### `schema_utils.gen_schema`

Can be run as a command-line script to generate derived schema files (e.g. TypeScript definitions, JSON Schema, Pydantic models). Notably, this should be used to keep types up-to-date if catalog files are being processed in TypeScript.

Example:

```bash
# Generate files for the `assemblies` and `organisms` schemas, exporting
# JSON Schemas under ./catalog/schema/generated; override schema list for
# the TypeScript generator, using the combined schema `schema` instead, and
# exporting its type definitions under ./catalog/schema/generated.
python -m catalog_build.schema_utils.gen_schema assemblies organisms --json-path ./catalog/schema/generated --ts-name schema --ts-path ./catalog/schema/generated
```

### `schema_utils.gen_typescript`

Used internally to generate TypeScript definitions.

### `schema_utils.validate_catalog`

Can be run as a command-line script to validate catalog YAML files.

Example:

```bash
# Validate source files under ./catalog/source using schemas for assemblies,
# organisms, workflow categories, and workflows. The catalog source files are
# assumed to be named `<SCHEMA_NAME>.yml`, where <SCHEMA_NAME> is the name of
# the corresponding schema. (E.g. the `assemblies` schema will be used to
# validate ./catalog/source/assemblies.yml, etc.)
python -m catalog_build.schema_utils.validate_catalog ./catalog/source assemblies organisms workflow_categories workflows
```
