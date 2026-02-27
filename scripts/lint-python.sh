#!/bin/bash

# Lint Python files using Ruff and mypy

echo "Running Ruff linter..."
ruff check catalog/ || exit 1

echo ""
echo "Running mypy type checker..."
mypy catalog/py_package/ || exit 1
