for name in assemblies workflow_categories workflows
do
  gen-json-schema "./catalog/schema/$name.yaml" > "./catalog/schema/generated/$name.json"
done
