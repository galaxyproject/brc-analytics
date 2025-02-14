#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

for name in ${SOURCE_FILE_SCHEMA_NAMES[@]}
do
  echo "$name:"
  linkml-validate -s "./catalog/schema/$name.yaml" "./catalog/source/$name.yml"
  echo ""
done
