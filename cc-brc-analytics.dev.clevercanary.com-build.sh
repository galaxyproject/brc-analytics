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
npm run build:dev

export BUCKET=s3://tik-brc-analytics.dev/
export SRCDIR=out/

aws s3 sync  $SRCDIR $BUCKET --delete --profile excira
aws cloudfront create-invalidation --distribution-id E1OF5ESEGD5VAG --paths "/*" --profile excira
