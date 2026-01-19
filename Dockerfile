# Multi-stage build for Next.js static export
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install bash and git for build scripts
RUN apk add --no-cache bash git

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Set up build environment
# Uses docker-specific config that works with nginx proxy
RUN cp ./site-config/brc-analytics/docker/.env .env.production

# Set version info
RUN ./scripts/set-version.sh

# Sync API config
RUN ./scripts/sync-api-brc-analytics.sh

# Build the catalog data
RUN npm run build-brc-db

# Build Next.js static export (outputs to /app/out)
RUN npm run build:local -- --no-lint

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Copy built static files
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx config for API proxying
COPY backend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
