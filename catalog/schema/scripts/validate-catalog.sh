#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

validation_failed=false

for name in ${SOURCE_FILE_SCHEMA_NAMES[@]}
do
  echo "$name:"
  linkml-validate -s "./catalog/py_package/catalog_build/schema/$name.yaml" "./catalog/source/$name.yml"
  if [ $? -ne 0 ]; then
    validation_failed=true
  fi
  echo ""
done

if [ "$validation_failed" = true ]; then
  echo "Validation failed for one or more schemas."
  exit 1
fi
