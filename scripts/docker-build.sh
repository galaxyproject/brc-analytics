#!/bin/bash

# Build Docker images with version from package.json
VERSION=$(node -p "require('./package.json').version")
export APP_VERSION=$VERSION

echo "Building with version: $VERSION"
docker compose build "$@"
