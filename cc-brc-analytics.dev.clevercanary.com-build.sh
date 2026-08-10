#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo \"Deleting ./out/\"
rm -rf ./sites/brc-analytics/out

# install node version 22.12.0
n 22.12.0
npm ci
export NEXT_PUBLIC_BASE_PATH=""

# Build catalog
npm run build-dev:brc

export BUCKET=s3://tik-brc-analytics.dev/
export SRCDIR=sites/brc-analytics/out/

aws s3 sync  $SRCDIR $BUCKET --delete --profile excira
aws cloudfront create-invalidation --distribution-id E1OF5ESEGD5VAG --paths "/*" --profile excira
