#!/bin/bash

# Parse arguments
FORMAT_COMMAND_EXTRA=""
CHECK_COMMAND_EXTRA="--fix"
OPERATION_VERB="Fixing"
for arg in "$@"; do
  case "$arg" in
    --check)
      FORMAT_COMMAND_EXTRA="--check"
      CHECK_COMMAND_EXTRA=""
      OPERATION_VERB="Checking"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--check]"
      exit 1
      ;;
  esac
done

STATUS=0

# Fix or check formatting of Python files using Ruff (Rust-based formatter)
echo "$OPERATION_VERB Python file formatting with Ruff..."
ruff format $FORMAT_COMMAND_EXTRA catalog/ backend/ || STATUS=1

# Fix or check sorting of imports with Ruff
echo "$OPERATION_VERB import sort order with Ruff..."
ruff check --select I $CHECK_COMMAND_EXTRA catalog/ backend/ || STATUS=1

# Report and exit with an error if either Ruff command failed
if [[ $STATUS != 0 ]]; then
  echo "Found one or more errors"
fi
exit $STATUS
