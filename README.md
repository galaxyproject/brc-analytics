# brc-analytics

## Setup

Using Node.js version `20.10.0`, run `npm install` in the root directory of the repository to install dependencies.

## Using the development server

The app can be run for development using `npm run dev`, and accessed at `http://localhost:3000`.

## Building the app locally

Run `npm run build:local` to build. The built app can be run using `npm start`, and accessed at `http://localhost:3000`.

# BRC Analytics Data Catalog

## Building the data source files

Using Python version 3.12.4 is recommended.

Create a Python virtual environment and install requirements:

```shell
python3 -m venv ./venv
source ./venv/bin/activate
pip install -r ./catalog/build/py/requirements.txt
```

Then run the script:

```shell
npm run build-files-from-ncbi
```

The environment can be deactivated by running `deactivate`, and re-activated by running `source ./venv/bin/activate`
again.

## Building the catalog data

To build catalog data for use by the app, run the script:

```shell
npm run build-brc-db
```

## Adding new assemblies

The list of assemblies is defined in the YAML file `catalog/source/assemblies.yml`. Assemblies are labeled
with comments specifying the species name (as defined by NCBI), and sorted alphabetically by species.

To add a new assembly, add a new list item to the `assemblies` entry in the YAML, labeled and sorted as appropriate,
consisting of a dictionary with a single entry, `accession`, specifying the assembly's accession.

For instance, to add a new assembly for _Anopheles gambiae_ with the accession `XXX_000000000.0`, add this line below
the `# Anopheles gambiae` comment:

```yaml
- accession: XXX_000000000.0
```

### Updating workflows

Run

```shell
npm run iwc-manifest-to-workflows-yaml
npm run build-brc-db
```

to fetch a list of current workflows from https://iwc.galaxyproject.org/workflow_manifest.json.
Only workflows for currently enabled categories are fetched.
If necessary, update parameters that require a reference genome id, fasta or gtf file to include the variable slot,
containing one of `ASSEMBLY_ID`, `ASSEMBLY_FASTA_URL`, `GENE_MODEL_URL`, or `SANGER_READ_RUN`.
These values will be substituted with assembly-specific values at runtime.

## Editing the LinkML schemas

If the LinkML schemas in `catalog/schema` are edited, the derived JSON schemas and TypeScript definitions should be
updated
as follows:

1. Ensure that the Python virtual environment is activated, as described above.
1. Run `npm run gen-schema`.

## Overview of automated checks on catalog content

The `run-checks` GitHub workflow performs checks to ensure that the catalog data and schemas are well-formed; this is
done by:

- Linting the schemas via `linkml-lint`.
- Converting the schemas to Python, to catch any errors that occur.
- Validating the catalog source files against their corresponding schemas.

## Release Process

This repository uses [Release Drafter](https://github.com/release-drafter/release-drafter) to automatically generate release notes based on PR titles.

### How it works

1. PRs are categorized based on their titles using the conventional commit format (e.g., `feat:`, `fix:`, `docs:`, etc.)
2. When PRs are merged to `main`, a draft release is automatically updated
3. The version number is determined based on the type of changes:
   - PRs with `breaking` or `major` labels trigger a major version bump
   - PRs with `feat`, `feature`, `enhancement`, or `minor` labels trigger a minor version bump
   - All other types trigger a patch version bump
4. When ready to release, the draft can be published manually through the GitHub interface or using the `publish-release` workflow
