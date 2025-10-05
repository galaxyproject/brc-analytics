# BRC Analytics Backend

FastAPI backend infrastructure for BRC Analytics.

## Features

- FastAPI REST API
- Redis caching with TTL support
- Health check endpoints
- Docker deployment with nginx reverse proxy
- uv for dependency management

## Quick Start

### Development (Local)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API documentation: http://localhost:8000/api/docs

### Production (Docker)

```bash
# Create environment file
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work for local development)

# Start all services (nginx + backend + redis)
docker compose up -d

# Check service health
curl http://localhost/api/v1/health

# View logs
docker compose logs -f backend

# Rebuild after code changes
docker compose up -d --build

# Stop all services
docker compose down
```

Services:

- nginx: http://localhost (reverse proxy)
- backend API: http://localhost:8000 (direct access)
- API docs: http://localhost/api/docs
- redis: localhost:6379

## API Endpoints

### Health & Monitoring

- `GET /api/v1/health` - Overall service health status
- `GET /api/v1/cache/health` - Redis cache connectivity check
- `GET /api/v1/version` - API version and environment information

### Documentation

- `GET /api/docs` - Interactive Swagger UI
- `GET /api/redoc` - ReDoc API documentation

## Configuration

Environment variables (see `.env.example`):

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Application
CORS_ORIGINS=http://localhost:3000,http://localhost
LOG_LEVEL=INFO
```

## Testing

```bash
# Run e2e tests
npm run test:e2e

# Or with Playwright directly
npx playwright test tests/e2e/03-api-health.spec.ts
```

## Architecture

```
nginx (port 80)
  ├── /api/* → FastAPI backend (port 8000)
  └── /* → Next.js static files

FastAPI backend
  └── Redis cache (port 6379)
```
