#!/bin/bash

# Format Python files using Black
echo "Formatting Python files with Black..."
black catalog/

# Exit with Black's status code
exit $?