# Deployment Generation Prompt

Use this prompt to generate Docker, docker-compose, and GitHub Actions CI/CD configs for TravelPort.

---

## Prompt Template

```
You are a DevOps engineer setting up deployment infrastructure for TravelPort,
a React 18 + .NET 8 travel booking application.

### Application components
- Backend: ASP.NET Core 8 Web API (src: backend/src/API/)
- Frontend: React 18 + Vite SPA (src: frontend/)
- Database: SQL Server 2022
- Cache: Redis (Phase 5)

### Deployment targets
- Local development: Docker Compose
- CI/CD: GitHub Actions
- Production: Docker containers (single-host or Kubernetes-ready)

### Requirements
- Multi-stage Docker builds (build stage + runtime stage)
- Backend image: mcr.microsoft.com/dotnet/aspnet:8.0 runtime
- Frontend: build with Node 20, serve with nginx:alpine
- Non-root users in containers
- Health checks on API (/health endpoint)
- Secrets via environment variables (never baked into images)
- GitHub Actions: build → test → Docker build → push to registry

### Task
Generate: [DESCRIBE DEPLOYMENT ARTIFACT]

Options:
- "Dockerfile for backend" — multi-stage .NET 8 Dockerfile
- "Dockerfile for frontend" — multi-stage Vite + nginx Dockerfile
- "docker-compose.yml" — full local stack (API + frontend + SQL Server + Redis)
- "GitHub Actions CI/CD workflow" — build, test, Docker push pipeline
- "nginx.conf for frontend" — SPA routing + API proxy config
```

---

## Standard Patterns

### Backend Dockerfile
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/API/TravelPort.API.csproj", "src/API/"]
# ... copy other projects
RUN dotnet restore "src/API/TravelPort.API.csproj"
COPY . .
RUN dotnet publish "src/API/TravelPort.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "TravelPort.API.dll"]
```

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### GitHub Actions structure
```yaml
on: [push to main, pull_request]
jobs:
  backend-test:   dotnet restore → build → test
  frontend-test:  npm ci → tsc → build
  docker-build:   build + push images (on main only)
  deploy:         update container (on main only, after docker-build)
```

---

## Environment Variables Reference

| Variable | Used by | Example |
|----------|---------|---------|
| `ConnectionStrings__DefaultConnection` | Backend | `Server=db;Database=TravelPort;...` |
| `JwtSettings__Secret` | Backend | 32+ char random string |
| `JwtSettings__Issuer` | Backend | `TravelPort` |
| `VITE_API_BASE_URL` | Frontend build | `https://api.yourdomain.com` |
| `REDIS_CONNECTION` | Backend (Phase 5) | `redis:6379` |
