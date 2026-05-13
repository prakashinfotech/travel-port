# DEPLOYMENT.md — TravelPort Docker & CI/CD Guide

> This document covers the full deployment pipeline: Docker setup, GitHub Actions CI/CD, server provisioning, and secrets configuration.

---

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────┐
│  Docker host (your server)  │
│                             │
│  ┌──────────────────────┐   │
│  │  web  (Nginx :80)    │   │◄── port 80 exposed
│  │  React SPA           │   │
│  │  /api/* → api:5000   │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │  api  (.NET 8 :5000) │   │
│  │  Auto-migrates DB    │   │
│  │  Seeds data          │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │  db  (SQL Server)    │   │
│  │  Volume: sqldata     │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

**Network flow:** Browser → Nginx (port 80) → `/api/*` proxied to `.NET API` (port 5000, internal) → SQL Server (port 1433, internal). Only port 80 is exposed externally.

---

## Files Added

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Multi-stage build — SDK for compile, ASP.NET runtime for serve |
| `backend/.dockerignore` | Excludes bin, obj, logs from Docker context |
| `frontend/Dockerfile` | Multi-stage build — Node for npm build, Nginx for serve |
| `frontend/nginx.conf` | React Router SPA routing + `/api` reverse proxy to backend |
| `frontend/.dockerignore` | Excludes node_modules, dist from Docker context |
| `docker-compose.yml` | Orchestrates db + api + web containers |
| `.env.example` | Template for all required environment variables |
| `.github/workflows/deploy.yml` | CI/CD pipeline — tests + builds → Docker Hub push → image verification |
| `.githooks/pre-commit` | Local commit gate — runs the shared test command before commit |
| `scripts/test-all.sh` | Cross-platform CI/local test entrypoint for backend + frontend |

---

## Local Docker Run (without CI/CD)

```bash
# 1. Copy and fill the env file
cp .env.example .env
# Edit .env — set DB_SA_PASSWORD, JWT_SECRET, etc.

# 2. Build images locally
docker compose build

# 3. Start all containers
docker compose up -d

# 4. Tail logs
docker compose logs -f

# App is at http://localhost
# Swagger is at http://localhost/api/swagger
```

To stop:
```bash
docker compose down          # stops containers, keeps DB volume
docker compose down -v       # stops + deletes DB volume (full reset)
```

---

## CI/CD Pipeline (GitHub Actions)

### Trigger
Pushes and merged PRs to the `Development` branch automatically run the pipeline.

### Jobs

| Job | Trigger | What it does |
|---|---|---|
| `build` | Every push + PR | `dotnet test` + frontend `vitest` + `dotnet build` + `npm run build` — fails fast on regressions and compile errors |
| `docker` | Push only (not PRs) | **Pauses for owner approval**, then builds & pushes images to Docker Hub |
| `verify` | Push only, after `docker` | Pulls both images from Docker Hub to confirm availability, prints local pull instructions |

### Local Commit Gate

Enable the versioned git hook once per clone:

```bash
git config core.hooksPath .githooks
```

The hook runs:

```bash
./scripts/test-all.sh
```

### Deployment Approval Gate

Job 2 (`docker`) targets the `production` environment which has a **Required Reviewer** set to the repo owner. This means:

1. A PR is merged to `Development`
2. `build` runs automatically — compiles and validates code
3. **Pipeline pauses** — GitHub sends you an email + notification asking for approval
4. You review and click **Approve** (or **Reject**) in the GitHub Actions UI
5. On approval → images are built and pushed to Docker Hub
6. `verify` confirms the images are accessible

To set this up (one-time):
1. Go to **GitHub repo → Settings → Environments → New environment** → name it `production`
2. Under **Deployment protection rules** → enable **Required reviewers**
3. Add yourself as a reviewer → **Save protection rules**

### Image tags
Each push produces two tags on Docker Hub:
- `<dockerhub-username>/travelport-api:latest` — always points to the newest build
- `<dockerhub-username>/travelport-api:<git-sha>` — pinned to exact commit (for rollback)
- `docker-compose.yml` uses `pull_policy: always` for `api` and `web`, so `docker compose up -d` fetches the newest `latest` image automatically before start

---

## Local Docker Desktop Run (pull from Docker Hub)

After CI pushes images to Docker Hub, Docker Desktop / Compose can pick up the newest image automatically:

```bash
# 1. Copy and fill the env file
cp .env.example .env
# Edit .env — set DOCKERHUB_USERNAME, DB_SA_PASSWORD, JWT_SECRET

# 2. Start or restart all containers
# pull_policy: always makes Compose fetch the newest :latest image for api/web
docker compose up -d

# 3. Tail logs
docker compose logs -f

# App is at http://localhost
# Swagger is at http://localhost/api/swagger
```

If containers are already running in Docker Desktop, restart them with `docker compose up -d` after the CI push completes. Compose will pull the newer image first and then recreate the containers with the latest code.

To stop:
```bash
docker compose down          # stops containers, keeps DB volume
docker compose down -v       # stops + deletes DB volume (full reset)
```

---

## GitHub Secrets Configuration

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

### Docker Hub
| Secret | Notes |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username (e.g. `nayanparmar`) |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token — create at hub.docker.com → Account Settings → Security |

### Database
| Secret | Notes |
|---|---|
| `DB_SA_PASSWORD` | Min 8 chars with uppercase, lowercase, digit, special char e.g. `Travel@Port2026!` |

### JWT
| Secret | Notes |
|---|---|
| `JWT_SECRET` | Generate: `openssl rand -base64 48` |
| `JWT_ISSUER` | `https://yourdomain.com` |
| `JWT_AUDIENCE` | `https://yourdomain.com` |

### Email (SMTP)
| Secret | Notes |
|---|---|
| `EMAIL_ENABLED` | `true` or `false` |
| `EMAIL_SMTP_HOST` | e.g. `smtp.office365.com` |
| `EMAIL_SMTP_PORT` | `587` |
| `EMAIL_USERNAME` | Your email address |
| `EMAIL_PASSWORD` | App password / account password |
| `EMAIL_FROM` | Must match `EMAIL_USERNAME` for Office365 |

### Razorpay (payments)
| Secret | Notes |
|---|---|
| `RAZORPAY_ENABLED` | `true` or `false` |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |

### CORS
| Secret | Notes |
|---|---|
| `ALLOWED_ORIGIN_0` | `http://yourdomain.com` |
| `ALLOWED_ORIGIN_1` | `https://yourdomain.com` |

> **Note:** `GITHUB_TOKEN` is injected automatically by GitHub Actions — do NOT add it manually.

---

---

## Rollback

To roll back to a specific commit, set `IMAGE_TAG` in your `.env` to the target git SHA:

```bash
# Edit .env
IMAGE_TAG=abc1234

# Pull and restart with that specific tag
docker compose pull
docker compose up -d
```

Or pin the image tag temporarily in `docker-compose.yml`:
```yaml
api:
  image: nayanparmar/travelport-api:abc1234
```

---

## Database Backups

SQL Server data is stored in the `sqldata` Docker volume. To back up:

```bash
# Create a dump inside the container
docker exec travelport-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$DB_SA_PASSWORD" -C \
  -Q "BACKUP DATABASE TravelPortDb TO DISK='/var/opt/mssql/TravelPortDb.bak'"

# Copy backup file out of the container
docker cp travelport-db-1:/var/opt/mssql/TravelPortDb.bak ./backups/
```

---

## Useful Commands

```bash
# View running containers
docker compose ps

# Stream all logs
docker compose logs -f

# Stream only API logs
docker compose logs -f api

# Open a SQL shell inside the DB container
docker exec -it travelport-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_SA_PASSWORD" -C

# Rebuild a single service without downtime
docker compose up -d --no-deps --build api

# Check image sizes
docker images | grep travelport
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| API container exits immediately | DB not healthy yet | Check `docker compose logs db` — wait for SQL Server to start (~45s) |
| `Login failed for user 'sa'` | Wrong `DB_SA_PASSWORD` | Verify secret matches the one used when DB volume was first created |
| Nginx returns 502 Bad Gateway | API container not running | `docker compose logs api` to see the error |
| Frontend calls fail with CORS error | `AllowedOrigins` mismatch | Set `ALLOWED_ORIGIN_0/1` secrets to your exact domain (no trailing slash) |
| Images not found on pull | Docker Hub auth failed | Ensure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are set correctly in the repo |
| Migrations fail on startup | Connection string wrong | Check `ConnectionStrings__DefaultConnection` env var in docker-compose |
