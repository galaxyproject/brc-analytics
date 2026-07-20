#!/usr/bin/env bash
set -eo pipefail

# Builds one site's static export. Run from the repo ROOT so cwd-relative
# `staticLoadFile` catalog paths in the site config resolve.
#
# Usage: ./scripts/build-site.sh <site> <env>
#   site: brc-analytics | ga2
#   env:  local | dev | prod

SITE="$1"
ENV="$2"

ENV_FILE="site-config/${SITE}/${ENV}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

# Load the site's env (NEXT_PUBLIC_SITE_CONFIG + galaxy/ena/plausible) into the
# shell so `next build` inlines it — the site's config resolver reads
# NEXT_PUBLIC_SITE_CONFIG to pick its env variant.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

# Version info (formerly set-version.sh) exposed as NEXT_PUBLIC vars.
NEXT_PUBLIC_GIT_HASH="$(git rev-parse HEAD)"
NEXT_PUBLIC_BUILD_DATE="$(TZ='America/Los_Angeles' date +'%Y-%m-%d %H:%M:%S %Z')"
NEXT_PUBLIC_VERSION="v$(node -p "require('./package.json').version")"
export NEXT_PUBLIC_GIT_HASH NEXT_PUBLIC_BUILD_DATE NEXT_PUBLIC_VERSION

# Package the site's catalog JSONs into its own public/api.
"./scripts/sync-api-${SITE}.sh"

# Build the site (cwd = repo root).
npx next build "sites/${SITE}" --webpack
