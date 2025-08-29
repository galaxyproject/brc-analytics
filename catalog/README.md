# BRC Analytis catalog directory

This directory provides the catalog data (information on genome assemblies, organisms, etc) that is presented by the app. The directory structure is as follows:

- `build` - Files related to the catalog build process.
  - `intermediate` - Intermediate data files.
  - `py` - Python scripts.
  - `ts` - Typescript scripts.
- `ga2` - Catalog directory for Genome Ark 2, with contents laid out in an analogous manner to this one.
- `output` - JSON files output by the catalog build process, to be consumed by the app.
- `py_package` - Python package used to share catalog features, such as the schemas and build process, with other projects.
- `schema` - Schema-related scripts and derived models.
- `source` - YAML files providing data used as input for building the catalog.
