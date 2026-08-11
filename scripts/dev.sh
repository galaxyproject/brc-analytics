#!/bin/bash

SITE="$1"

# Each site runs from its own sites/<site> app directory.
case "$SITE" in
	brc-analytics) PROJECT_DIR="sites/brc-analytics" ;;
	ga2) PROJECT_DIR="sites/ga2" ;;
	*) echo "Unknown site: '$SITE' (expected brc-analytics or ga2)" >&2; exit 1 ;;
esac

DIR="./site-config/$SITE/images/favicons/"
PUBLIC_DIR="$PROJECT_DIR/public/favicons/"
# init

cp ./site-config/$SITE/local/.env "$PROJECT_DIR/.env.development"

# check if PUBLIC_DIR does not exists
if [ ! -d "$PUBLIC_DIR" ]; then
	mkdir -p "$PUBLIC_DIR"
fi

# look for empty directory
if [ -d "$DIR" ]
then
	if [ "$(ls $DIR)" ]; then
     cp ./site-config/$SITE/images/favicons/* "$PUBLIC_DIR"
	 cp ./scripts/browserconfig.xml "$PUBLIC_DIR"
	 cp ./scripts/site.webmanifest "$PUBLIC_DIR"
	fi
else
	echo "Directory $DIR not found."
fi
