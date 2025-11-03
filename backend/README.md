# BRC Analytics Backend

Backend infrastructure for BRC Analytics, organized as a collection of services.

## Structure

```
backend/
├── docker-compose.yml     # Service orchestration
├── nginx.conf            # Reverse proxy configuration
├── docker-build.sh       # Build script with version sync
│
└── api/                  # FastAPI REST API service
    ├── app/              # Application code
    ├── Dockerfile        # API service container
    ├── pyproject.toml    # Python dependencies
    └── README.md         # API-specific documentation
```

## Quick Start

```bash
cd backend

# Create environment file
cp api/.env.example api/.env

# Build with version from package.json
./docker-build.sh

# Start all services
docker compose up -d

# Check health
curl http://localhost:8080/api/v1/health

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Services

- **nginx** (port 8080): Reverse proxy, public-facing entry point
- **api**: FastAPI REST API (internal, accessed via nginx)
- **redis**: Cache layer (internal)

See `api/README.md` for API-specific documentation.

## Port Configuration

For security, only nginx is exposed externally. Backend services (API, Redis) are only accessible within the Docker network.

- External access: `http://localhost:8080` → nginx → routes to services
- Direct backend access (dev only): `docker compose exec backend curl http://localhost:8000`
