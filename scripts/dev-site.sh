#!/usr/bin/env bash
set -eo pipefail

# Runs one site's dev server. Run from the repo ROOT so cwd-relative
# `staticLoadFile` catalog paths in the site config resolve.
#
# Usage: ./scripts/dev-site.sh <site> [env]
#   site: brc-analytics | ga2
#   env:  local (default) | dev | prod

SITE="$1"
ENV="${2:-local}"

ENV_FILE="site-config/${SITE}/${ENV}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

# Load the site's env (NEXT_PUBLIC_SITE_CONFIG + galaxy/ena/plausible) so
# `next dev` and the site's config resolver pick it up.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

NEXT_PUBLIC_GIT_HASH="$(git rev-parse HEAD)"
NEXT_PUBLIC_BUILD_DATE="$(TZ='America/Los_Angeles' date +'%Y-%m-%d %H:%M:%S %Z')"
NEXT_PUBLIC_VERSION="v$(node -p "require('./package.json').version")"
export NEXT_PUBLIC_GIT_HASH NEXT_PUBLIC_BUILD_DATE NEXT_PUBLIC_VERSION

# Package the site's catalog JSONs into its own public/api (served at runtime).
"./scripts/sync-api-${SITE}.sh"

npx next dev "sites/${SITE}" --webpack
