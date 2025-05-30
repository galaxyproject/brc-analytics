#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

python3 -m catalog.py_package.catalog_build.schema_utils.gen_schema "${SOURCE_FILE_SCHEMA_NAMES[@]}" \
  --json-path ./catalog/schema/generated \
  --py-path ./catalog/py_package/catalog_build/generated_schema --py-name schema \
  --ts-path ./catalog/schema/generated --ts-name schema
