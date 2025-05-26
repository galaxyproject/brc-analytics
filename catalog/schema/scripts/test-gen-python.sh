#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

validation_failed=false

for name in schema ${SOURCE_FILE_SCHEMA_NAMES[@]}
do
  gen-python "./catalog/py_package/catalog_build/schema/$name.yaml" > /dev/null
  if [ $? -ne 0 ]; then
    validation_failed=true
  fi
done

if [ "$validation_failed" = true ]; then
  echo "Generation failed for one or more schemas."
  exit 1
fi
