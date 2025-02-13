#!/bin/bash

for name in schema assemblies workflow_categories workflows
do
  gen-python "./catalog/schema/$name.yaml" > /dev/null
done
