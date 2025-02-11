# brc-analytics

## Setup

Using Node.js version `20.10.0`, run `npm install` in the root directory of the repository to install dependencies.

## Using the development server

The app can be run for development using `npm run dev`, and accessed at `http://localhost:3000`.

## Building the app locally

Run `npm run build:local` to build. The built app can be run using `npm start`, and accessed at `http://localhost:3000`.

# BRC Analytics Data Catalog

## Building the data source files

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
