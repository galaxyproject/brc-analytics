# brc-analytics

## Setup

Using Node.js version `22.12.0`, run `npm install` in the root directory of the repository to install dependencies.

## Using the development server

The app can be run for development using `npm run dev`, and accessed at `http://localhost:3000`.

## Building the app locally

Run `npm run build:local` to build. The built app can be run using `npm start`, and accessed at `http://localhost:3000`.

## Running the full stack with Docker

To run the complete application stack (frontend, backend API, and Redis):

```shell
./backend/docker-build.sh
```

This extracts the version from package.json, builds the Next.js frontend inside a container, and serves it via nginx at `http://localhost:8080`. The backend API is available at `/api/v1/`.

To stop the stack:

```shell
cd backend && docker compose down
```

Note: The backend requires a `.env` file at `backend/api/.env` with LLM configuration for the catalog search feature. See `backend/api/.env.example` for required variables.

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
npm run build-brc-from-ncbi
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
2. **Publish Release Workflow**: Publishes the draft, deploys to production, and bumps main to the next version
3. **Version Display**: Shows build info in the UI footer using environment variables set at build time

### Branch Strategy

- **`main`**: Development branch, always contains the next version (e.g., `0.20.0`)
- **`production`**: Stable release branch, contains the current release (e.g., `0.19.0`)

This allows you to identify which environment you're looking at via the API version endpoint.

### Release Steps

#### 1. Verify Draft Release

```bash
# Check current draft releases
gh release list

# View the draft release details
gh release view v<VERSION> --json body,name,tagName,targetCommitish
```

#### 2. Publish the Release

```bash
# Identify the draft release tag from the list above (e.g., v0.19.0)
gh release list | grep "Draft"

# Publish using the workflow
gh workflow run publish-release.yml -f release_id=v0.19.0
```

The workflow automatically:

1. Merges `main` → `production` (triggers production deployment)
2. Publishes the release tag
3. Creates a PR to bump `main` to the next minor version (e.g., `0.19.0` → `0.20.0`)

#### 3. Merge Version Bump PR

After the workflow completes, merge the auto-created PR to update `main` to the next development version.

#### 4. Verify

```bash
# Check versions on deployed environments
curl -s https://platform-staging.brc-analytics.org/api/v1/health | jq .version  # Next version (main)
curl -s https://platform-beta.brc-analytics.org/api/v1/health | jq .version     # Released version (production)
```

## E2E Testing

This project uses Playwright for E2E testing to ensure reliability across different browsers and devices.

### Running Tests

To run FE E2E tests:

```
npm run test:e2e
```

To run BE E2E tests:

```
npm run test:e2e:api
```
