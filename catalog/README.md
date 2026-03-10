# BRC Analytics catalog directory

This directory provides the catalog data (information on genome assemblies, organisms, etc) that is presented by the app. The directory structure is as follows:

- `build` - Files related to the catalog build process.
  - `intermediate` - Intermediate data files.
  - `py` - Python scripts.
  - `ts` - Typescript scripts.
- `ga2` - Catalog directory for Genome Ark 2, with contents laid out in an analogous manner to this one.
- `output` - JSON files output by the catalog build process, to be consumed by the app.
- `py_package` - Python package used to share catalog features, such as the schemas and build process, with other projects.
- `schema` - Schema-related scripts and derived models.
- `source` - YAML/json files providing data used as input for building the catalog.

## Build process

The catalog build runs in two phases:

1. **Python phase** — fetches data from NCBI and generates intermediate files:
   ```
   npm run build-brc-from-ncbi
   ```
2. **TypeScript phase** — transforms intermediate and source files into the JSON output consumed by the app:
   ```
   npm run build-brc-db
   ```

The output JSON files in `catalog/output/` are checked into the repo. They are not rebuilt automatically during `npm run build:prod` or `next build` — you must run the above commands manually when source data changes.

### NODE_ENV=production

The `build-brc-db` script must run with `NODE_ENV=production`. This is already configured in `package.json`.

The reason: `next-mdx-remote`'s `serialize` function unconditionally overrides the `development` MDX option based on `NODE_ENV`, ignoring any user-provided value ([hashicorp/next-mdx-remote#495](https://github.com/hashicorp/next-mdx-remote/issues/495)). Without `NODE_ENV=production`, the MDX output uses the development JSX runtime (`jsxDEV`), which causes a `_jsxDEV is not a function` error in production.
