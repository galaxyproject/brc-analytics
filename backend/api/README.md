# BRC Analytics API Service

FastAPI REST API service for BRC Analytics.

## Features

- FastAPI REST API
- Redis caching with TTL support
- Health check endpoints
- Docker deployment with nginx reverse proxy
- uv for dependency management

## Quick Start

### Development (Local)

```bash
cd backend/api
uv sync
uv run uvicorn app.main:create_app --factory --reload
```

API documentation: http://localhost:8000/api/docs

### Production (Docker)

Docker Compose orchestration is managed from the parent `/backend` directory.

```bash
cd backend

# Create environment file
cp api/.env.example api/.env
# Edit api/.env if needed (defaults work for local development)

# Build with version from package.json
./docker-build.sh

# Start all services (nginx + api + redis)
docker compose up -d

# Check service health
curl http://localhost:8080/api/v1/health

# View logs
docker compose logs -f backend

# Rebuild after code changes
docker compose up -d --build

# Stop all services
docker compose down
```

Services:

- nginx: http://localhost:8080 (reverse proxy, public-facing)
- API service: internal only, accessible via nginx
- API docs: http://localhost:8080/api/docs
- redis: internal only

## API Endpoints

### Health & Monitoring

- `GET /api/v1/health` - Overall service health status
- `GET /api/v1/cache/health` - Redis cache connectivity check
- `GET /api/v1/version` - API version and environment information

### Documentation

- `GET /api/docs` - Interactive Swagger UI
- `GET /api/redoc` - ReDoc API documentation

## MCP Server

The API embeds a Model Context Protocol server at `/api/v1/mcp`, giving AI
clients (Claude Desktop, the Galaxy MCP integration) direct access to the BRC
catalog and sequencing-data search.

**Catalog tools** -- organisms, assemblies, workflows, and compatibility checks
(in-memory, always available).

**ENA tools** (`search_ena`, `search_ena_keywords`) -- live sequencing-run
search against the European Nucleotide Archive.

**SRA mirror tools** (`search_sra`, `sra_data_summary`, `get_sra_study_runs`) --
fast structured search over a local SRA metadata mirror scoped to BRC-relevant
organisms. Opt-in: registered only when `SRA_MIRROR_PATH` points at a built
mirror file; a default deploy exposes only the catalog and ENA tools.

## Configuration

Environment variables (see `.env.example`):

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Application
CORS_ORIGINS=http://localhost:3000,http://localhost
LOG_LEVEL=INFO
```

## Assistant conversation logging

Assistant sessions live in Redis with a 2 hour TTL, so without a durable sink
there is no record of what users asked or how the assistant answered. When
`DATABASE_URL` is set, each turn is also written to the `assistant_turn_log`
table: the user's message, the reply, this turn's tool calls and their returns,
the analysis-tracker snapshot, token counts, latency, and the model that
produced it.

```bash
ASSISTANT_TURN_LOGGING_ENABLED=true   # set false to stop recording turns
ASSISTANT_TURN_LOG_RETENTION_DAYS=90  # window the purge script enforces
ASSISTANT_TURN_LOG_TIMEOUT_SECONDS=5  # cap on how long a write may delay a reply
```

The write is fail-open by design -- a missing, slow, or broken database is
logged and the user still gets their reply. With no `DATABASE_URL` nothing is
recorded and the app warns once at startup.

**Retention.** Rows are not expired automatically. Run the purge on a schedule:

```bash
python -m scripts.purge_assistant_turn_logs --dry-run   # count what would go
python -m scripts.purge_assistant_turn_logs             # delete past the window
```

**Privacy.** Messages are free text and may contain whatever a user typed, so
the table is treated as user data: it lives in the app database under the same
access controls as `saved_analyses`, is not exposed through any API endpoint,
and is readable only by maintainers with direct database access. Authenticated
turns carry a `user_id`; anonymous turns are grouped by `session_id` only, with
no IP or other network identifier stored. Deleting a user nulls the `user_id`
rather than deleting the rows, matching `workflow_runs`. Users are told
conversations may be logged during the beta on the assistant page and in
`/learn/assistant`.

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
