#!/usr/bin/env bash
set -euo pipefail

# JSON source root
SRC_ROOT="catalog/output"

API_DIR="sites/brc-analytics/public/api"
mkdir -p "$API_DIR"

PER_APP_JSONS=("assemblies" "organisms" "workflows" "workflow-assembly-mappings")

# Optional JSONs: copied when present, skipped when absent. Pangenome data is
# mock-backed and may not exist before its catalog build lands (#1341), so a
# missing source must not fail the whole sync under `set -e`.
OPTIONAL_JSONS=("pangenomes")

rm -f "$API_DIR"/*.json

for name in "${PER_APP_JSONS[@]}"; do
  src="$SRC_ROOT/${name}.json"
  dst="$API_DIR/${name}.json"
  cp "$src" "$dst"
done

for name in "${OPTIONAL_JSONS[@]}"; do
  src="$SRC_ROOT/${name}.json"
  dst="$API_DIR/${name}.json"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
  else
    echo "Skipping optional ${name}.json (not found at $src)"
  fi
done
