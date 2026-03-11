#!/usr/bin/env bash
set -euo pipefail

# JSON source root
SRC_ROOT="catalog/output"

API_DIR="public/api"
mkdir -p "$API_DIR"

PER_APP_JSONS=("assemblies" "workflows" "workflow-assembly-mappings")

rm -f "$API_DIR"/*.json

for name in "${PER_APP_JSONS[@]}"; do
  src="$SRC_ROOT/${name}.json"
  dst="$API_DIR/${name}.json"
  cp "$src" "$dst"
  
  # Copy type declaration file if it exists
  if [ -f "$SRC_ROOT/${name}.json.d.ts" ]; then
    cp "$SRC_ROOT/${name}.json.d.ts" "$API_DIR/${name}.json.d.ts"
  fi
done
