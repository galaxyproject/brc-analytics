#!/bin/bash
# Demo: BRC Analytics + Galaxy SSO via shared Keycloak
#
# Shows: log into BRC Analytics, then use the same Keycloak identity
# to call Galaxy's API. In production the BFF would proxy these calls;
# here we simulate it by obtaining a token directly.
#
# Prerequisites:
#   - 127.0.0.1 keycloak in /etc/hosts
#   - docker compose -f docker-compose.auth.yml up
#   - Galaxy must be fully started (takes a few minutes on first boot)
#   - The test user must have logged into Galaxy via the browser at least once

set -euo pipefail

KC=http://keycloak:8180
BRC=http://localhost:8000
GALAXY=http://localhost:8080
REALM=galaxy
CLIENT_ID=brc-analytics
CLIENT_SECRET=brc-analytics-dev-secret
USER=testuser
PASS=testpass
COOKIES=$(mktemp)
trap "rm -f $COOKIES" EXIT

echo "=== Step 1: Log into BRC Analytics through Keycloak ==="
echo ""

# Start the OIDC auth code flow — get the Keycloak login page URL
LOGIN_REDIRECT=$(curl -s -o /dev/null -w '%{redirect_url}' "$BRC/api/v1/auth/login")
echo "BRC redirects to Keycloak: ${LOGIN_REDIRECT:0:80}..."

# Load the Keycloak login form, capture cookies and extract the POST action
LOGIN_PAGE=$(curl -s -c "$COOKIES" -L "$LOGIN_REDIRECT")
FORM_ACTION=$(echo "$LOGIN_PAGE" | grep -o 'action="[^"]*"' | head -1 | sed 's/action="//;s/"//' | sed 's/&amp;/\&/g')

# Submit credentials — Keycloak redirects back to BRC callback
CALLBACK_URL=$(curl -s -o /dev/null -w '%{redirect_url}' \
  -b "$COOKIES" -c "$COOKIES" \
  -d "username=$USER" -d "password=$PASS" -d "credentialId=" \
  "$FORM_ACTION")

# Hit the callback (don't follow the redirect to localhost:3000 frontend)
curl -s -o /dev/null -c "$COOKIES" "$CALLBACK_URL"
echo "Logged in, session cookie set."

echo ""
echo "=== Step 2: Verify BRC Analytics session ==="
echo ""

SESSION_COOKIE=$(grep brc_session "$COOKIES" | awk '{print $NF}')
ME=$(curl -s -b "brc_session=$SESSION_COOKIE" "$BRC/api/v1/auth/me")
echo "GET /api/v1/auth/me →"
echo "$ME" | jq .

echo ""
echo "=== Step 3: Get a Keycloak access token (simulating what the BFF holds) ==="
echo ""

# Enable password grant temporarily for the demo
docker exec brc-analytics-keycloak-1 \
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8180 --realm master --user admin --password admin 2>/dev/null
docker exec brc-analytics-keycloak-1 \
  /opt/keycloak/bin/kcadm.sh update "clients/$(
    docker exec brc-analytics-keycloak-1 \
      /opt/keycloak/bin/kcadm.sh get clients -r $REALM --fields id,clientId --format csv --noquotes 2>/dev/null \
      | grep ",$CLIENT_ID\$" | cut -d, -f1
  )" -r $REALM -s directAccessGrantsEnabled=true 2>/dev/null

TOKEN_RESPONSE=$(curl -s -X POST "$KC/realms/$REALM/protocol/openid-connect/token" \
  -d "grant_type=password" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "username=$USER" \
  -d "password=$PASS" \
  -d "scope=openid email profile")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r .access_token)

# Disable password grant again
docker exec brc-analytics-keycloak-1 \
  /opt/keycloak/bin/kcadm.sh update "clients/$(
    docker exec brc-analytics-keycloak-1 \
      /opt/keycloak/bin/kcadm.sh get clients -r $REALM --fields id,clientId --format csv --noquotes 2>/dev/null \
      | grep ",$CLIENT_ID\$" | cut -d, -f1
  )" -r $REALM -s directAccessGrantsEnabled=false 2>/dev/null

echo "Token claims:"
# Decode JWT payload (base64url → base64, add padding)
PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d. -f2 | tr '_-' '/+')
PADDING=$((4 - ${#PAYLOAD} % 4))
[ $PADDING -lt 4 ] && PAYLOAD="${PAYLOAD}$(printf '=%.0s' $(seq 1 $PADDING))"
echo "$PAYLOAD" | base64 -d 2>/dev/null | jq '{sub, email, preferred_username, aud, azp}'

echo ""
echo "=== Step 4: Call Galaxy API with the Keycloak bearer token ==="
echo ""

echo "GET /api/invocations →"
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$GALAXY/api/invocations" | jq .

echo ""
echo "GET /api/users/current →"
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$GALAXY/api/users/current" | jq '{id, username, email}'
