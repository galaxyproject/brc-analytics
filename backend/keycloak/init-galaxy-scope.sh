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

# Find brc-analytics client UUID
CLIENT_UUID=$($KCADM get clients -r "$REALM" --fields id,clientId --format csv --noquotes 2>/dev/null \
  | grep ',brc-analytics$' | sed 's/,.*//')

echo "Assigning galaxy-api-access as default scope to brc-analytics (uuid=$CLIENT_UUID)..."
$KCADM update "clients/$CLIENT_UUID/default-client-scopes/$SCOPE_ID" -r "$REALM"

echo "Done."
