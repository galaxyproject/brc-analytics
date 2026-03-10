#!/bin/sh
# Creates a test user in Galaxy via the API. This user can then be used to
# test Keycloak federation — logging into Keycloak with Galaxy credentials.
#
# Requires: Galaxy running at GALAXY_URL with an admin API key.

set -eu

GALAXY_URL="${GALAXY_URL:-http://galaxy:80}"
MAX_WAIT=300
TEST_EMAIL="galaxyuser@example.com"
TEST_USERNAME="galaxyuser"
TEST_PASSWORD="galaxypass123"

echo "Waiting for Galaxy API to be available..."
elapsed=0
until curl -sf "$GALAXY_URL/api/version" > /dev/null 2>&1; do
  sleep 5
  elapsed=$((elapsed + 5))
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "Galaxy did not become available within ${MAX_WAIT}s"
    exit 1
  fi
done
echo "Galaxy API is available."

# Galaxy's bgruening image creates a default admin with key from
# GALAXY_DEFAULT_ADMIN_KEY or we can use the bootstrap admin.
# Try getting the admin key — the bgruening image sets a default.
ADMIN_KEY="${GALAXY_DEFAULT_ADMIN_KEY:-admin}"

# Check if user already exists
EXISTING=$(curl -sf -H "x-api-key: $ADMIN_KEY" \
  "$GALAXY_URL/api/users?f_email=$TEST_EMAIL" 2>/dev/null || echo "[]")

if echo "$EXISTING" | grep -q "$TEST_EMAIL"; then
  echo "Test user $TEST_EMAIL already exists, skipping."
  exit 0
fi

echo "Creating test user $TEST_EMAIL..."
RESULT=$(curl -sf -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ADMIN_KEY" \
  -d "{\"username\": \"$TEST_USERNAME\", \"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
  "$GALAXY_URL/api/users" 2>&1) || true

if echo "$RESULT" | grep -q '"id"'; then
  echo "Test user created successfully."
  echo "  Email:    $TEST_EMAIL"
  echo "  Username: $TEST_USERNAME"
  echo "  Password: $TEST_PASSWORD"
else
  echo "Failed to create test user (may already exist or admin key invalid):"
  echo "$RESULT"
  echo ""
  echo "You can create the user manually via Galaxy's UI at $GALAXY_URL"
  echo "or insert directly into the database."
fi
