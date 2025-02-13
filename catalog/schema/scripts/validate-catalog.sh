#!/bin/bash

for name in assemblies workflow_categories workflows
do
  echo "$name:"
  linkml-validate -s "./catalog/schema/$name.yaml" "./catalog/source/$name.yml"
  echo ""
done
