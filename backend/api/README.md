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

**Logan search tools** (`logan_job_status`, `logan_cohort`, `logan_hits`) --
read-only access to Logan/kmindex sequence searches run through
`/logan-search`: whether a job finished, its whole-match-set counts and facets,
and pages of score-ranked hits with SRA metadata. Opt-in: registered only when
`GALAXY_API_KEY` is set. Cache-only -- they read the merged result the results
page assembled (cached for a day) and never rebuild it, so a tool that reports
`expired` means opening that page first.

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

Failed turns are recorded too, with `outcome='error'` and the exception class
in `error_kind` -- otherwise the corpus would only contain the requests that
happened to work, which is the opposite of what a beta needs. Each turn carries
a `turn_id` that is also set as a Sentry tag (`assistant.turn_id`), so an
exception over there joins to the prompt that caused it.

```bash
ASSISTANT_TURN_LOGGING_ENABLED=true            # false stops recording turns
ASSISTANT_TURN_LOG_RETENTION_DAYS=90           # deletion window
ASSISTANT_TURN_LOG_PURGE_ENABLED=true          # false disables the sweep
ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS=6      # how often the sweep runs
ASSISTANT_TURN_LOG_TIMEOUT_SECONDS=2           # bound on a single write
ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES=65536  # per-row transcript cap
```

The write is awaited in the request and is fail-open, so a missing, slow, or
broken database costs the user nothing -- failures go to the log and to Sentry,
and the reply is returned regardless. An insert is a few milliseconds against a
turn that spends seconds in inference, and `ASSISTANT_TURN_LOG_TIMEOUT_SECONDS`
bounds the worst case. With no `DATABASE_URL` nothing is recorded and the app
warns once at startup.

`transcript` holds this turn's pydantic-ai messages including tool calls and
returns, capped at `ASSISTANT_TURN_LOG_MAX_TRANSCRIPT_BYTES`. Tool returns are
unbounded, and one broad catalog query would otherwise bloat the row, the WAL,
and every backup. Messages are kept in order until the budget runs out, so the
prompt and first tool calls always survive; `transcript_truncated` marks rows
where trailing messages were dropped.

Note `turn_index` is a best-effort ordering hint read from Redis session
metadata, not a unique sequence -- concurrent requests on one session can share
a value. Order by `created_at`; use `turn_id` as the unique handle.

**Retention.** The app runs the sweep itself every
`ASSISTANT_TURN_LOG_PURGE_INTERVAL_HOURS` (see `app/services/turn_log.py`), so
the 90-day deletion the UI promises doesn't depend on anyone installing a cron
job. The purge is an idempotent
`DELETE ... WHERE created_at < cutoff`, so running it in several workers is
harmless. The script is for manual use:

```bash
python -m scripts.purge_assistant_turn_logs --dry-run   # count what would go
python -m scripts.purge_assistant_turn_logs --days 30   # one-off shorter window
```

Database backups can retain deleted content past the window; align backup
retention with what `/learn/assistant` tells users.

**Privacy.** Messages are free text and may contain whatever a user typed, so
the table is treated as user data: it lives in the app database under the same
access controls as `saved_analyses`, is not exposed through any API endpoint,
and is readable only by maintainers with direct database access. Authenticated
turns carry a `user_id`; anonymous turns are grouped by `session_id` only, with
no IP or other network identifier stored. Deleting a user nulls the `user_id`
rather than deleting the rows, matching `workflow_runs`. Users are told
conversations are logged during the beta on the assistant page and in
`/learn/assistant`.

### Reviewing the beta corpus

```sql
-- Recent prompts and replies
SELECT created_at, session_id, user_message, assistant_reply
FROM assistant_turn_log
WHERE outcome = 'success'
ORDER BY created_at DESC
LIMIT 50;

-- One conversation end to end
SELECT created_at, outcome, user_message, assistant_reply
FROM assistant_turn_log
WHERE session_id = :session_id
ORDER BY created_at;

-- What's breaking, and on which prompts
SELECT error_kind, count(*), min(created_at), max(created_at)
FROM assistant_turn_log
WHERE outcome = 'error'
GROUP BY error_kind
ORDER BY count(*) DESC;

-- Turns per session, to see where people drop off
SELECT turns, count(*) AS sessions FROM (
  SELECT session_id, count(*) AS turns
  FROM assistant_turn_log
  WHERE session_id IS NOT NULL
  GROUP BY session_id
) t
GROUP BY turns
ORDER BY turns;

-- Cost and latency by model
SELECT model, count(*) AS turns, sum(total_tokens) AS tokens,
       round(avg(latency_ms)) AS avg_ms
FROM assistant_turn_log
GROUP BY model;
```

## Testing

```bash
# Run e2e tests
npm run test:e2e:api

# Or with Playwright directly
npx playwright test tests/e2e/api/03-api-health.spec.ts
```

## Architecture

```
nginx (port 80)
  ├── /api/* → FastAPI backend (port 8000)
  └── /* → Next.js static files

FastAPI backend
  └── Redis cache (port 6379)
```
