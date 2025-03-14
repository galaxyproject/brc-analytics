# BRC Analytis catalog directory

This directory provides the catalog data (information on genome assemblies, organisms, etc) that is presented by the app. The directory structure is as follows:

- `build` - Files related to the catalog build process.
  - `intermediate` - Intermediate data files.
  - `py` - Python scripts.
  - `ts` - Typescript scripts.
- `output` - JSON files output by the catalog build process, to be consumed by the app.
- `schema` - LinkML schemas for source files.
- `source` - YAML files providing data used as input for building the catalog.
