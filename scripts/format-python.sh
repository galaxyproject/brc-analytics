#!/bin/bash

# Format Python files using Ruff (Rust-based formatter)
echo "Formatting Python files with Ruff..."
ruff format catalog/

# Sort imports with Ruff
echo "Sorting imports with Ruff..."
ruff check --select I --fix catalog/

# Exit with Ruff's status code
exit $?