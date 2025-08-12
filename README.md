# brc-analytics

## Setup

Using Node.js version `20.10.0`, run `npm install` in the root directory of the repository to install dependencies.

## Using the development server

### Running the web app only

The app can be run for development using `npm run dev`, and accessed at `http://localhost:3000`.

### Running the Genkit server only

The Genkit server can be run for development using `npm run genkit:dev`, and accessed at `http://localhost:3100`.

### Running both services together

To run both the web app and Genkit server together, use `npm run dev:all`. This will start:

- The web app at `http://localhost:3000`
- The Genkit server at `http://localhost:3100`

This is the recommended approach for development, especially when working with features that require both services, such as the chat component.

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
containing one of `ASSEMBLY_ID`, `ASSEMBLY_FASTA_URL`, `GENE_MODEL_URL`, `SANGER_READ_RUN_SINGLE` or `SANGER_READ_RUN_PAIRED`.
These values will be substituted with assembly-specific values at runtime.

## Editing the LinkML schemas

If the LinkML schemas in `catalog/py_package/catalog_build/schema` are edited, the derived JSON schemas and TypeScript definitions should be
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

This repository uses [Release Drafter](https://github.com/release-drafter/release-drafter) to automatically generate release notes based on PR titles and semantic versioning.

### Overview

The release process involves three main components:

1. **Release Drafter**: Automatically creates/updates draft releases based on merged PRs
2. **Publish Release Workflow**: Publishes the draft and creates a version bump PR
3. **Version Display**: Shows build info in the UI footer using environment variables set at build time

### Automated Version Determination

PRs are categorized based on their titles using conventional commit format:

- `breaking!` or `major` labels → **major** version bump (e.g., 1.0.0 → 2.0.0)
- `feat:`, `feature:`, `enhancement:`, `minor` labels → **minor** version bump (e.g., 1.0.0 → 1.1.0)
- `fix:`, `docs:`, `chore:`, etc. → **patch** version bump (e.g., 1.0.0 → 1.0.1)

### Manual Release Steps

#### 1. Verify Draft Release

```bash
# Check current draft releases
gh release list

# View the draft release details
gh release view v<VERSION> --json body,name,tagName,targetCommitish
```

#### 2. Publish the Release

```bash
# Get the release ID from the list above
gh release list | grep "Draft"

# Publish using the workflow (recommended)
gh workflow run publish-release.yml -f release_id=<RELEASE_ID>
```

**OR** publish directly:

```bash
gh release edit <RELEASE_ID> --draft=false
```

#### 3. Handle Version Bump PR

The `publish-release` workflow will automatically:

- Create a branch `release/update-version-<VERSION>`
- Update `package.json` and `package-lock.json`
- Create a PR with the version changes

**You must manually merge this PR** to complete the release process.

#### 4. Verify Release Success

```bash
# Check that tag points to correct commit
git fetch --tags
git log --oneline --decorate | head -5

# Verify version display will work
git tag --points-at HEAD  # Should show the new version tag
```

### Deployment

Production deployment happens automatically when changes are merged to the `prod` branch. To deploy a release:

1. Merge the release version bump PR to `main`
2. Create a PR from `main` to `prod`
3. Once merged to `prod`, the deployment workflow automatically builds and deploys to production
