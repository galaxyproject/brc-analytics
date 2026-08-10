#!/usr/bin/env bash
# Remove build artifacts across the repo and both sites: Next build output and
# static exports, generated per-site env / API / favicons, TS build info, and
# Playwright results. Also tidies any stray root-level artifacts.
#
# Deliberately does NOT remove: node_modules (run `npm ci` to reset deps),
# local env secrets (.env*.local), or fetched organism images (slow to re-pull).

set -euo pipefail

# Next build output, static exports and generated type shims (per-site; also
# cleaned at the repo root if present).
rm -rf .next out sites/*/.next sites/*/out
rm -f next-env.d.ts sites/*/next-env.d.ts

# Playwright artifacts (root + per-site).
rm -rf test-results playwright-report sites/*/test-results sites/*/playwright-report

# Generated env files (recreated by the build scripts); root ones cleaned if
# present. Local secrets (.env*.local) are intentionally kept.
rm -f .env.production .env.development sites/*/.env.production sites/*/.env.development

# Generated per-site public data (recreated by sync-api / build scripts).
rm -rf sites/*/public/api sites/*/public/favicons

# Root public/ — site assets live under sites/*/public, so a root public/ is a
# stray leftover.
rm -rf public

# TypeScript incremental build info.
find . -name "*.tsbuildinfo" -not -path "./node_modules/*" -delete

echo "Cleaned build artifacts."
