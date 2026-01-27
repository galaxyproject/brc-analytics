#!/bin/bash

# Build and run Docker stack with version from package.json
cd "$(dirname "$0")"

VERSION=$(node -p "require('../package.json').version")
export APP_VERSION=$VERSION

echo "Building with APP_VERSION=${VERSION}"

# Default to 'up --build -d' if no args provided
if [ $# -eq 0 ]; then
    docker compose up --build -d
else
    docker compose "$@"
fi
