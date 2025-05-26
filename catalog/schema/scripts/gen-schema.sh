#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

# Generate Pydantic models for all source data types
gen-pydantic ./catalog/py_package/catalog_build/schema/schema.yaml > ./catalog/build/py/generated_schema/schema.py

# Generate TypeScript definitions for all source data types
python3 ./catalog/schema/scripts/gen-typescript.py ./catalog/py_package/catalog_build/schema/schema.yaml > ./catalog/schema/generated/schema.ts

# Generate a JSON schema for each source file
for name in ${SOURCE_FILE_SCHEMA_NAMES[@]}
do
  gen-json-schema "./catalog/py_package/catalog_build/schema/$name.yaml" > "./catalog/schema/generated/$name.json"
done
