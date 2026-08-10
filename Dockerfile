# Multi-stage build for Next.js static export
# Stage 1: Build the application
FROM node:22.13.0-alpine AS builder

# Install bash and git for build scripts
RUN apk add --no-cache bash git

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Set up the build environment: copies the docker-specific env (nginx-proxy
# config) to sites/brc-analytics/.env.production and the site favicons. Uses the
# `docker` env rather than `build-local:brc` so the local env doesn't clobber it.
RUN ./scripts/build.sh brc-analytics docker

# Set version info (appended to the site env)
RUN ./scripts/set-version.sh "" sites/brc-analytics

# Sync API config into the site's public dir
RUN ./scripts/sync-api-brc-analytics.sh

# Build the catalog data
RUN npm run build-brc-db

# Build Next.js static export (outputs to /app/sites/brc-analytics/out)
# Next 16 removed the `--no-lint` flag and no longer runs ESLint during build.
RUN npx next build sites/brc-analytics --webpack

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Copy built static files
COPY --from=builder /app/sites/brc-analytics/out /usr/share/nginx/html

# Copy nginx config for API proxying
COPY backend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
