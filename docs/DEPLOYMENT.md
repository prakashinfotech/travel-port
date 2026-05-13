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
| `.github/workflows/deploy.yml` | CI/CD pipeline — build → Docker push → SSH deploy |

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
| `build` | Every push + PR | `dotnet build` + `npm run build` — fails fast on compile errors |
| `docker` | Push only (not PRs) | Builds API + Web Docker images, pushes to `ghcr.io` |
| `deploy` | Push only, after `docker` | SSHs into server, pulls new images, `docker compose up -d` |

### Image tags
Each deploy produces two tags:
- `ghcr.io/<owner>/travelport-api:latest` — always points to the newest build
- `ghcr.io/<owner>/travelport-api:<git-sha>` — pinned to exact commit (for rollback)

---

## Server Setup (one-time)

Provision any Linux server (Ubuntu 22.04 recommended — DigitalOcean, AWS EC2, Hetzner, etc.) and run:

```bash
# Install Docker (includes Compose v2)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Create deployment directory
sudo mkdir -p /opt/travelport
sudo chown $USER:$USER /opt/travelport

# Verify Docker works
docker run --rm hello-world
```

Generate an SSH key pair for GitHub Actions:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Add public key to server's authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Copy private key — paste this into the SERVER_SSH_KEY GitHub secret
cat ~/.ssh/github_deploy
```

---

## GitHub Secrets Configuration

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

### Server access
| Secret | Example value |
|---|---|
| `SERVER_HOST` | `123.45.67.89` |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Contents of `~/.ssh/github_deploy` (the private key) |
| `SERVER_PORT` | `22` (optional, default is 22) |

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

## GitHub Environment Protection (optional but recommended)

To require manual approval before each production deploy:

1. Go to **Settings → Environments → New environment** → name it `production`
2. Add **Required reviewers** (yourself)
3. The `deploy` job in `deploy.yml` targets `environment: production` — it will pause and wait for approval

---

## Rollback

To roll back to a specific commit:

```bash
# SSH into server
cd /opt/travelport

# Replace IMAGE_TAG with the git SHA of a known-good build
IMAGE_TAG=abc1234 GITHUB_REPOSITORY_LOWER=yourname docker compose up -d
```

Or in docker-compose.yml, pin the image tag temporarily:
```yaml
api:
  image: ghcr.io/yourname/travelport-api:abc1234
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
| Images not found on pull | GHCR auth failed | Ensure `GITHUB_TOKEN` has `packages:read` permission and the repo is public or token has access |
| Migrations fail on startup | Connection string wrong | Check `ConnectionStrings__DefaultConnection` env var in docker-compose |
