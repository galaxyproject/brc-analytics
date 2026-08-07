#!/bin/bash

SITE="$1"
ENV="$2"

# Per-site apps build from sites/<site>; brc-analytics still builds at repo root.
case "$SITE" in
	ga2) PROJECT_DIR="sites/ga2" ;;
	*) PROJECT_DIR="." ;;
esac

DIR="./site-config/$SITE/images/favicons/"
PUBLIC_DIR="$PROJECT_DIR/public/favicons/"
# init

cp "./site-config/$SITE/${ENV:-dev}/.env" "$PROJECT_DIR/.env.production"

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
