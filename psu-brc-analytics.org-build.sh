#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo \"Deleting ./out/\"
rm -rf ./out

# install node version 20.10.0
n 20.10.0
npm ci
export NEXT_PUBLIC_BASE_PATH=""

# Build catalog
npm run build:prod

export BUCKET=s3://izk-brc-analytics.org/
export SRCDIR=out/

aws s3 sync  $SRCDIR $BUCKET --delete --profile brc-analytics
aws cloudfront create-invalidation --distribution-id E3KF2GIJB5RIFD --paths "/*" --profile brc-analytics
