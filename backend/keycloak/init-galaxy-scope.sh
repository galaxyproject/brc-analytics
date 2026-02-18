#!/bin/bash
# Creates the galaxy-api-access client scope in Keycloak and assigns it to
# the brc-analytics client. Uses kcadm.sh from the Keycloak image to avoid
# HTTPS requirements on the master realm admin API.

set -euo pipefail

KC_URL="http://keycloak:8180"
REALM="galaxy"
KCADM="/opt/keycloak/bin/kcadm.sh"

echo "Waiting for Keycloak to be ready..."
until $KCADM config credentials --server "$KC_URL" --realm master \
      --user admin --password admin 2>/dev/null; do
  sleep 2
done
echo "Keycloak is ready, authenticated as admin."

# Check if galaxy-api-access scope already exists
SCOPE_ID=$($KCADM get client-scopes -r "$REALM" --fields id,name --format csv --noquotes 2>/dev/null \
  | grep ',galaxy-api-access$' | sed 's/,.*//' || true)

if [ -n "$SCOPE_ID" ]; then
  echo "galaxy-api-access scope already exists (id=$SCOPE_ID)."
else
  echo "Creating galaxy-api-access client scope..."
  SCOPE_ID=$($KCADM create client-scopes -r "$REALM" \
    -s name=galaxy-api-access \
    -s protocol=openid-connect \
    -s 'attributes."include.in.token.scope"=true' \
    -s 'attributes."display.on.consent.screen"=false' \
    -i)
  echo "Created scope id=$SCOPE_ID"
fi

# Check if audience mapper already exists
HAS_MAPPER=$($KCADM get "client-scopes/$SCOPE_ID/protocol-mappers/models" -r "$REALM" \
  --fields name --format csv --noquotes 2>/dev/null \
  | grep '^galaxy-api-audience$' || true)

if [ -n "$HAS_MAPPER" ]; then
  echo "Audience mapper already exists, skipping."
else
  echo "Adding audience mapper..."
  $KCADM create "client-scopes/$SCOPE_ID/protocol-mappers/models" -r "$REALM" \
    -s name=galaxy-api-audience \
    -s protocol=openid-connect \
    -s protocolMapper=oidc-audience-mapper \
    -s consentRequired=false \
    -s 'config."included.client.audience"=galaxy-api' \
    -s 'config."id.token.claim"=false' \
    -s 'config."access.token.claim"=true'
fi

# Create the Galaxy API scope that Galaxy checks for in bearer tokens.
# Galaxy's default oidc_scope_prefix is "https://galaxyproject.org/api",
# and it requires "<prefix>:*" in the token's scope claim.
API_SCOPE_NAME="https://galaxyproject.org/api:*"
API_SCOPE_ID=$($KCADM get client-scopes -r "$REALM" --fields id,name --format csv --noquotes 2>/dev/null \
  | grep -F ",${API_SCOPE_NAME}" | sed 's/,.*//' || true)

if [ -n "$API_SCOPE_ID" ]; then
  echo "$API_SCOPE_NAME scope already exists (id=$API_SCOPE_ID)."
else
  echo "Creating $API_SCOPE_NAME client scope..."
  API_SCOPE_ID=$($KCADM create client-scopes -r "$REALM" \
    -s "name=$API_SCOPE_NAME" \
    -s protocol=openid-connect \
    -s 'attributes."include.in.token.scope"=true' \
    -s 'attributes."display.on.consent.screen"=false' \
    -i)
  echo "Created scope id=$API_SCOPE_ID"
fi

# Find brc-analytics client UUID and assign both scopes as defaults
CLIENT_UUID=$($KCADM get clients -r "$REALM" --fields id,clientId --format csv --noquotes 2>/dev/null \
  | grep ',brc-analytics$' | sed 's/,.*//')

echo "Assigning scopes as defaults to brc-analytics (uuid=$CLIENT_UUID)..."
$KCADM update "clients/$CLIENT_UUID/default-client-scopes/$SCOPE_ID" -r "$REALM"
$KCADM update "clients/$CLIENT_UUID/default-client-scopes/$API_SCOPE_ID" -r "$REALM"

# --- Galaxy User Federation Provider ---
# Configure the Galaxy User Storage SPI so Keycloak authenticates users
# against Galaxy's galaxy_user table (PBKDF2-SHA256 password hashes).

# Keycloak 26 enables VERIFY_PROFILE by default, which forces users to
# complete their profile (first/last name) on first login. Federated
# Galaxy users don't have these fields, so disable it.
echo "Disabling VERIFY_PROFILE required action..."
$KCADM update "authentication/required-actions/VERIFY_PROFILE" -r "$REALM" -s enabled=false

GALAXY_DB_URL="${GALAXY_DB_URL:-jdbc:postgresql://galaxy-postgres:5432/galaxy}"
GALAXY_DB_USER="${GALAXY_DB_USER:-galaxy}"
GALAXY_DB_PASSWORD="${GALAXY_DB_PASSWORD:-}"

# Check if federation provider already exists
FED_ID=$($KCADM get components -r "$REALM" --fields id,name --format csv --noquotes 2>/dev/null \
  | grep ',galaxy-users$' | sed 's/,.*//' || true)

if [ -n "$FED_ID" ]; then
  echo "Galaxy user federation provider already exists (id=$FED_ID)."
else
  echo "Creating Galaxy user federation provider..."
  FED_ID=$($KCADM create components -r "$REALM" \
    -s name=galaxy-users \
    -s providerId=galaxy-user-provider \
    -s providerType=org.keycloak.storage.UserStorageProvider \
    -s 'config.jdbcUrl=["'"$GALAXY_DB_URL"'"]' \
    -s 'config.dbUser=["'"$GALAXY_DB_USER"'"]' \
    -s 'config.dbPassword=["'"$GALAXY_DB_PASSWORD"'"]' \
    -s 'config.priority=["0"]' \
    -s 'config.cachePolicy=["NO_CACHE"]' \
    -i)
  echo "Created Galaxy user federation provider (id=$FED_ID)."
fi

echo "Done."
