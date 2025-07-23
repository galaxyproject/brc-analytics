# Catalog-build package

## Development

In order to facilitate using the package outside the BRC Analytics repository, package versions should be tagged with Git tags of the form `catalog_build_v<VERSION>` once merged into main, where `<VERSION>` is the version number specified in `setup.py`. This version number should be updated in accordance with Semantic Versioning conventions.

## Usage

### Setup

#### Installation

The package can be installed using Pip with a command of the form:

```bash
pip install -e "git+https://github.com/galaxyproject/brc-analytics.git@catalog_build_v<VERSION>#egg=catalog_build&subdirectory=catalog/py_package"
```

This installs the package from the BRC Analytics GitHub repository, referencing a git tag named in the pattern `catalog_build_v<VERSION>`; `<VERSION>` should be replaced with the desired version number of the package as defined in `setup.py` (although note that this requires that a tag for that version actually exist in the BRC Analytics repository).

#### Scripts

The package provides modules that can be used to run scripts to manage the catalog and schema; it may be desirable to set up shortcuts for running these. See below for details on using each module.

### Updating

The package can be updated by using the same installation command as above, substituting in the new version tag. If using a `requirements.txt`, it may be updated manually by updating the version referenced in the line containing the `pip install` arguments for the package (i.e. the one starting with `-e "git+https://github.com/galaxyproject/...`).

When the package is updated, derived schema files must be re-generated to guarantee that they're up-to-date. (See `schema_utils.gen_schema` below.)

### Modules

#### Root

The package root exports `build_files` from the `build` module -- see below.

#### `build`

Used to build catalog data from local input files and external resources. The `build_files` function from this module goes through roughly the following actions:

- Read source YAML files (assemblies, organisms, outbreaks) from provided paths.
- Fetch additional data from UCSC (using the specified URL) and NCBI.
- Save output data to the specified paths. This includes:
  - Intermediate TSV files to be processed further in building the catalog.
  - Taxonomic tree JSON to be directly used by the app.
  - A quality control report in Markdown format.

A Python script can be used to call `build_files` with appropriate arguments in order to perform this initial data aggregation step of building the catalog.

Example:

```python
from catalog_build import build_files

build_files(
  assemblies_path="catalog/source/assemblies.yml",
  genomes_output_path="catalog/build/intermediate/genomes-from-ncbi.tsv",
  ucsc_assemblies_url="https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json",
  tree_output_path="catalog/output/ncbi-taxa-tree.json",
  taxonomic_levels_for_tree=[
    "domain",
    "realm",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
    "strain",
    "serotype",
    "isolate",
  ],
)
```

#### `iwc_manifest_to_workflows_yaml`

Can be run as a command-line script to update the catalog input workflows file based on the IWC manifest. Any missing workflows and workflow parameters are added to the specified workflows YAML file. New workflows will have `active` set to `false`, and must be manually updated in the YAML in order to be made available in the app, and new parameters will only contain a `type_guide` to be used for human reference, and must be manually given a value source (such as a `variable` field) in order to be populated by the app when launching Galaxy.

Example:

```bash
# Update the workflows source file at ./catalog/source/workflows.yaml, excluding
# workflows with an unclear category.
python -m catalog_build.iwc_manifest_to_workflows_yaml ./catalog/source/workflows.yml --exclude-other
```

#### `generated_schema.schema`

Contains Pydantic models for schema entities. Mainly included for internal use, but could be used by a custom Python script that interacts with the catalog source files.

#### `schema_utils.gen_schema`

Can be run as a command-line script to generate derived schema files (e.g. TypeScript definitions, JSON Schema, Pydantic models). As mentioned in the section on updating, this is important for keeping definitions up-to-date. (In particular, it's important for the TypeScript definitions used in the app to be consistent with the models used to manage the catalog.)

Example:

```bash
# Generate files for the `assemblies` and `organisms` schemas, exporting
# JSON Schemas under ./catalog/schema/generated; override schema list for
# the TypeScript generator, using the combined schema `schema` instead, and
# exporting its type definitions under ./catalog/schema/generated.
python -m catalog_build.schema_utils.gen_schema assemblies organisms --json-path ./catalog/schema/generated --ts-name schema --ts-path ./catalog/schema/generated
```

#### `schema_utils.gen_typescript`

Used internally to generate TypeScript definitions.

#### `schema_utils.validate_catalog`

Can be run as a command-line script to validate catalog YAML files. The catalog source files to be validated are assumed to be named in the form `<SCHEMA_NAME>.yml`, where `<SCHEMA_NAME>` is the name of the corresponding schema.

Example:

```bash
# Validate source files under ./catalog/source using schemas for assemblies,
# organisms, workflow categories, and workflows. For example, the `assemblies`
# schema will be used to validate ./catalog/source/assemblies.yml.
python -m catalog_build.schema_utils.validate_catalog ./catalog/source assemblies organisms workflow_categories workflows
```
