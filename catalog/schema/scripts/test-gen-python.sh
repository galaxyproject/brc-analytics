#!/bin/bash

source ./catalog/schema/scripts/source-file-schema-names.sh

for name in schema ${SOURCE_FILE_SCHEMA_NAMES[@]}
do
  gen-python "./catalog/schema/$name.yaml" > /dev/null
done
