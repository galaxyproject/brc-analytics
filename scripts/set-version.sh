#!/bin/bash
set -e

TARGET_ENV_FILE=".env.production"
if [ "$1" == "dev" ]; then
  TARGET_ENV_FILE=".env.development"
fi

# Get the current git hash
GIT_HASH=$(git rev-parse HEAD)

# Get the current date and time in PST
BUILD_DATE=$(TZ="America/Los_Angeles" date +"%Y-%m-%d %H:%M:%S %Z")

# Get the current code version from git
# Using git describe to handle commits after tags gracefully
# This will show:
# - "v0.13.0" when HEAD is exactly on a tag
# - "v0.13.0-2-g1234567" when HEAD is 2 commits after v0.13.0
# - Just the commit hash if no tags exist
VERSION=$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)

# Append newline to ensure following lines are separated from existing content
echo "" >> "$TARGET_ENV_FILE"

# Append these values as NEXT_PUBLIC variables
echo "NEXT_PUBLIC_GIT_HASH='$GIT_HASH'" >> "$TARGET_ENV_FILE"
echo "NEXT_PUBLIC_BUILD_DATE='$BUILD_DATE'" >> "$TARGET_ENV_FILE"
echo "NEXT_PUBLIC_VERSION='$VERSION'" >> "$TARGET_ENV_FILE"

echo "Environment variables added to $TARGET_ENV_FILE"
