#!/bin/bash

# Generate TypeScript definitions for all source data types
python3 ./catalog/schema/scripts/gen-typescript.py ./catalog/schema/schema.yaml > ./catalog/schema/generated/schema.ts

# Generate a JSON schema for each source file
for name in assemblies workflow_categories workflows
do
  gen-json-schema "./catalog/schema/$name.yaml" > "./catalog/schema/generated/$name.json"
done
