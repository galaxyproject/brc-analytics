#!/bin/bash

# Format Python files using Ruff (Rust-based formatter)
echo "Formatting Python files with Ruff..."
ruff format catalog/ backend/

# Sort imports with Ruff
echo "Sorting imports with Ruff..."
ruff check --select I --fix catalog/ backend/

# Exit with Ruff's status code
exit $?