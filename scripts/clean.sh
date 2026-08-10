#!/usr/bin/env bash
# Remove build artifacts across the repo and both sites: Next build output and
# static exports, generated per-site env / API / favicons, TS build info, and
# Playwright results. Also tidies legacy root artifacts left on machines that
# predate the per-site split.
#
# Deliberately does NOT remove: node_modules (run `npm ci` to reset deps),
# local env secrets (.env*.local), or fetched organism images (slow to re-pull).

set -euo pipefail

# Next build output, static exports and generated type shims (root has none
# post-split, but clean it if present).
rm -rf .next out sites/*/.next sites/*/out
rm -f next-env.d.ts sites/*/next-env.d.ts

# Playwright artifacts (root + per-site).
rm -rf test-results playwright-report sites/*/test-results sites/*/playwright-report

# Generated env files (recreated by the build scripts). Root ones are legacy
# from before the split; local secrets (.env*.local) are intentionally kept.
rm -f .env.production .env.development sites/*/.env.production sites/*/.env.development

# Generated per-site public data (recreated by sync-api / build scripts).
rm -rf sites/*/public/api sites/*/public/favicons

# Legacy root public/ — assets moved into sites/* at the per-site split; the
# root app is decommissioned, so this is a stale leftover on older machines.
rm -rf public

# TypeScript incremental build info.
find . -name "*.tsbuildinfo" -not -path "./node_modules/*" -delete

echo "Cleaned build artifacts."
