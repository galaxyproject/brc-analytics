# Multi-stage build for a per-site Next.js static export.
#
# Parameterized by site + env (defaults reproduce the original BRC container):
#   docker build --build-arg SITE=brc-analytics --build-arg ENV=docker .
#   docker build --build-arg SITE=ga2           --build-arg ENV=<env>   .
#
# ENV selects site-config/<SITE>/<ENV>/.env. The "docker" env routes API/ENA
# through the nginx sidecar via relative paths; a site deployed that way needs
# its own site-config/<SITE>/docker/.env (GA2 has none yet — pick the env its
# deploy actually uses).

# Stage 1: Build the application
FROM node:22.13.0-alpine AS builder

# Install bash and git for build scripts
RUN apk add --no-cache bash git

WORKDIR /app

ARG SITE=brc-analytics
ARG ENV=docker

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the site's catalog data (script name differs per site), then the
# static export. build-site.sh loads site-config/<SITE>/<ENV>/.env, syncs the
# catalog JSON into sites/<SITE>/public/api, and runs next build sites/<SITE>.
# Next 16 no longer runs ESLint during build.
RUN if [ "$SITE" = "ga2" ]; then npm run build-ga2-db; else npm run build-brc-db; fi
RUN ./scripts/build-site.sh "$SITE" "$ENV"

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

ARG SITE=brc-analytics

# Copy the built static files for the selected site
COPY --from=builder /app/sites/${SITE}/out /usr/share/nginx/html

# Copy nginx config for API proxying
COPY backend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
