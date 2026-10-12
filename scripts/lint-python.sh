#!/bin/bash

# Lint Python files using Ruff and mypy

failed=()

echo "Running Ruff linter..."
ruff check catalog/ || failed+=("Ruff")

echo ""
echo "Running mypy type checker..."
mypy catalog/py_package/ || failed+=("mypy")

if [ ${#failed[@]} -gt 0 ]; then
  echo ""
  echo "Errors reported by:"
  for name in "${failed[@]}"; do
    echo "$name"
  done
  exit 1
fi
