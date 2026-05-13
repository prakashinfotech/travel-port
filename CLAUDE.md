# CLAUDE.md — TravelPort AI Collaboration Guide

> This file is read automatically by Claude Code at session start.
> It defines project context, conventions, and standing rules for all AI-assisted work.

---

## Project Overview

**TravelPort** is a full-stack Goibibo-inspired travel booking portal.

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, Redux Toolkit |
| Backend | .NET 8, Clean Architecture, EF Core 8, FluentValidation |
| Database | SQL Server Express (localhost\SQLEXPRESS) |
| Auth | JWT (15 min) + Refresh Tokens (7 days), BCrypt cost 12 |
| Caching | In-memory (IMemoryCache via ICacheService) |
| Deployment | Docker (multi-stage Dockerfiles, Nginx, docker-compose), GitHub Actions CI/CD |
| External | Duffel (flights, off by default), Razorpay (payments), SMTP/Office365 (email) |

---

## Repository Layout

```
Goibibo-AI-Assignment/
├── backend/src/
│   ├── Domain/          # Entities, Enums — no dependencies
│   ├── Application/     # DTOs, Services, Interfaces, Validators
│   ├── Infrastructure/  # JWT, BCrypt, ExternalProviders (Duffel, Razorpay, SendGrid)
│   ├── Persistence/     # EF Core DbContext, Repositories, Migrations, Seeds
│   └── API/             # Controllers, Middleware, Program.cs
├── frontend/src/
│   ├── pages/           # FlightsPage, HotelsPage, BusesPage, TrainsPage, CabsPage, AdminPage …
│   ├── components/      # FlightCard, HotelCard, ConfirmDialog, shared UI (Button, Select, Skeleton)
│   ├── services/        # flightService, hotelService, bookingService, adminService, userService
│   ├── features/auth/   # Redux slice, LoginForm, RegisterForm
│   └── routes/          # AppRouter, PrivateRoute
├── docs/                # ARCHITECTURE.md, API_DOCUMENTATION.md, DATABASE_DESIGN.md …
├── CLAUDE.md            # ← You are here
├── GIT.md               # Git workflow rules & commit conventions
├── TODO.md              # Pending work backlog
└── TASK-TRACKER.md      # Day-by-day feature delivery log
```

---

## Standing Rules (Always Enforce)

### 1. Update MD files after every change
After any code or config change, update the relevant documentation:
- `README.md` — seed data counts, stack changes, new endpoints
- `docs/API_DOCUMENTATION.md` — any new or modified API endpoints
- `docs/TESTING_GUIDE.md` — whenever test coverage, hook behavior, or CI verification changes
- `TASK-TRACKER.md` — mark features as done, add new entries
- `TODO.md` — move completed items, add new ones found during work

### 2. Never commit secrets
- API tokens and credentials go in `appsettings.Development.json` (gitignored)
- Never put real tokens in `appsettings.json` (committed to git)
- Raise a warning immediately if a secret is detected in a committed file

### 3. Commit and PR workflow
- **Never auto-commit or auto-push.** Only commit when the user explicitly says "commit" or "create PR"
- Follow the commit convention in `GIT.md` exactly
- Always stage specific files — never `git add -A` blindly
- All commits go to a feature branch, never directly to `main` or `Development`
- Before a commit, run the shared test gate: `./scripts/test-all.sh` or `.\scripts\test-all.cmd`
- Keep `git config core.hooksPath .githooks` enabled in the working clone so the pre-commit hook enforces tests

### 4. Duffel / external providers
- Duffel is disabled by default (`Enabled: false` in `appsettings.json`)
- To enable: set `Enabled: true` and `ApiToken` in `appsettings.Development.json` only
- Real tokens must never appear in `appsettings.json`

### 5. Database refresh
When DataSeeder changes, the DB must be dropped and recreated:
```bash
cd backend
dotnet ef database drop --project src/Persistence --startup-project src/API --force
dotnet ef database update --project src/Persistence --startup-project src/API
dotnet run --project src/API --launch-profile https
```

---

## Development Conventions

### Backend (.NET)
- Clean Architecture: Domain → Application → Infrastructure/Persistence → API
- Repositories return domain entities; services return DTOs
- Use `ICacheService` for caching (5 min default, 30 min for reference data)
- FluentValidation for all request DTOs
- Serilog for structured logging
- All API responses use the `ApiResponse<T>` wrapper

### Frontend (React/TypeScript)
- Named exports for components, default export for pages
- Import alias: `@/` maps to `frontend/src/`
- Always use `import { api } from '@/api/axios'` (named export, not default)
- Services return the typed inner data (`res.data`)
- No `any` types — use proper TypeScript interfaces from `@/types`
- Tailwind for all styling — no inline style except for dynamic values (e.g. brand colors)

### Naming
| Context | Convention |
|---|---|
| C# classes | PascalCase |
| C# private fields | `_camelCase` |
| TypeScript interfaces | PascalCase |
| React components | PascalCase |
| Hooks / utils | camelCase |
| CSS classes | Tailwind utilities only |

---

## Key Files to Know

| File | Purpose |
|---|---|
| `backend/src/API/Program.cs` | DI registration, middleware pipeline, auto-migrate on startup |
| `backend/src/Application/DependencyInjection.cs` | Service registrations |
| `backend/src/Persistence/Seeds/DataSeeder.cs` | All seed data (900+ flights, 60+ hotels, 11 coupons) |
| `backend/src/Application/Services/FlightService.cs` | Flight search + booking logic |
| `backend/src/Application/Services/AdminService.cs` | Admin dashboard, analytics, user/coupon management |
| `backend/src/Infrastructure/ExternalProviders/Email/SmtpEmailService.cs` | Email templates (table-based HTML for Gmail/Outlook compat) |
| `docker-compose.yml` | SQL Server + API + Nginx/React orchestration |
| `.github/workflows/deploy.yml` | 3-job CI/CD pipeline |
| `frontend/src/api/axios.ts` | Axios instance + JWT interceptor |
| `frontend/src/api/endpoints.ts` | All API endpoint constants |
| `frontend/src/types/index.ts` | All shared TypeScript types |
| `frontend/src/pages/FlightsPage.tsx` | Main flight search + filter UI |
| `frontend/src/pages/AdminPage.tsx` | 4-tab admin dashboard (Dashboard, Users, Bookings, Coupons) |
| `frontend/src/components/ui/ConfirmDialog.tsx` | Branded confirm modal (danger/warning variants) |

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@travelport.com | Admin@123 |
| User | john@example.com | User@123 |
| User | priya@example.com | User@123 |
| User | rahul@example.com | User@123 |

---

## Quick Start

### Docker (recommended)
```bash
cp .env.example .env   # fill DB_SA_PASSWORD and JWT_SECRET
docker compose up -d
```
App → `http://localhost` | Swagger → `http://localhost/api/swagger`

### Local development
```bash
# Backend
cd backend
dotnet restore
dotnet ef database update --project src/Persistence --startup-project src/API
dotnet run --project src/API --launch-profile https

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
API → `http://localhost:5000` | Frontend → `http://localhost:5173`
