# TravelPort — Goibibo-Inspired Travel Booking Portal

Full-stack travel booking platform built with .NET 8 Clean Architecture + React 18 + TypeScript.

[![Branch: Development](https://img.shields.io/badge/active%20branch-Development-blue)](https://github.com/NayanParmar/Goibibo-AI-Assignment/tree/Development)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only. **No direct commits.** Merges via PR from `Development`. |
| `Development` | All active development happens here. Create feature branches off this if needed. |

> Direct pushes to `main` are blocked by branch protection rules. Always work on `Development` and raise a PR to merge into `main`.

---

## Overview

TravelPort covers:
- Flight Search & Booking (900+ DB seed flights — IndiGo, SpiceJet, Vistara, Akasa Air, Air India, Air India Express, Go First across 42 routes)
- Goibibo-style Flight Fare Popup + Fare-family Booking Flow
- Home page recent searches persist and reopen saved result pages
- Hotel Search & Booking with Guest Details (name/email/phone stored per booking)
- Bus Search (deterministic mock — realistic Indian operators & routes)
- Train Search (deterministic mock — real train names, 5 classes, availability statuses)
- Cab Search (deterministic mock — Ola/Uber/Meru/Zoom, distance-based pricing)
- User Authentication (JWT + Refresh Tokens)
- Booking Management, Cancellation & PDF Invoice Download (Flight e-ticket + Hotel invoice, A4)
- Wallet System — top-up, balance deduction at booking, automatic 90% refund on cancellation
- Saved Credit Cards — securely store cards (last 4 digits only), set default, delete
- Payment Method Selection at Booking — pay via Wallet, Saved Card, or proceed to payment page
- Payment Page — Credit/Debit Card (live preview), UPI (QR + countdown timer), Net Banking (bank picker + timer)
- 11 Coupons (flight and hotel specific)
- Razorpay Payment Gateway (toggle via config; falls back to mock in dev)
- SMTP Email Notifications — booking confirmed (sent to contact email), cancelled, password reset
- Admin Panel — 4-tab dashboard (stats + analytics, user management, all bookings, coupon CRUD)
- Dynamic Traveller Details UI; traveller name/email/phone stored per booking and shown in PDF + email
- Bookings Page with numbered pagination, status/type filters (Confirmed/Cancelled · Flight/Hotel)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS v3, Redux Toolkit |
| Backend | .NET 8, Clean Architecture, EF Core 8, FluentValidation |
| Database | SQL Server Express, EF Core Migrations |
| Auth | JWT (15 min) + Refresh Tokens (7 days), BCrypt (cost 12) |
| Logging | Serilog (console + rolling file) |
| API Docs | Swagger / OpenAPI |

---

## Quick Start

### Option A — Docker (recommended, no local installs needed)

```bash
cp .env.example .env          # fill in DB_SA_PASSWORD, JWT_SECRET at minimum
docker compose build
docker compose up -d
```

App at `http://localhost` | API Swagger at `http://localhost/api/swagger`

> SQL Server starts first (~45 s), then the API applies migrations + seeds data automatically.

### Option B — Local development

**Prerequisites:** Node.js 20+, .NET 8 SDK, SQL Server Express (`localhost\SQLEXPRESS`)

```bash
# Backend
cd backend
dotnet restore
dotnet ef database update --project src/Persistence --startup-project src/API
dotnet run --project src/API --launch-profile https
```
API at `http://localhost:5000` | Swagger at `http://localhost:5000/swagger`

```bash
# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
Frontend at `http://localhost:5173` (Vite proxies `/api` → `http://localhost:5000`)

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@travelport.com | Admin@123 |
| User | john@example.com | User@123 |
| User | priya@example.com | User@123 |
| User | rahul@example.com | User@123 |

---

## Seed Data Summary

| Module | Count |
|---|---|
| Users | 4 (1 admin, 3 users) |
| Flights | 900+ programmatically generated across 42 bidirectional routes, 7 airlines (IndiGo, SpiceJet, Air India, Vistara, Akasa Air, Air India Express, Go First), 14 date slots (+7 to +35 days) |
| Hotels | 60+ across 12 cities (Mumbai, Delhi, Goa, Bangalore, Jaipur, Hyderabad, Chennai, Kolkata, Ahmedabad, Pune, Kochi, Lucknow) |
| Hotel Rooms | 120+ room types across all hotels |
| Buses | Deterministic mock — 10–22 results per route, route-specific durations, 14 operators |
| Trains | Deterministic mock — 6–15 results per route, 39 named trains, route-specific durations & pricing |
| Cabs | Deterministic mock — Ola, Uber, Meru, Zoom, distance-based pricing |
| Coupons | 11 — SAVE100, FIRST10, SUMMER20, HOTEL500, FLAT15, FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL |
| Bookings | 3 sample bookings for john@example.com (only seeded on fresh DB; real bookings preserved on restart) |

---

## API Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | /api/v1/auth/register | No |
| POST | /api/v1/auth/login | No |
| POST | /api/v1/auth/forgot-password | No |
| POST | /api/v1/auth/reset-password | No |
| GET | /api/v1/flights/search | No |
| POST | /api/v1/flights/book | Yes |
| GET | /api/v1/hotels/search | No |
| POST | /api/v1/hotels/book | Yes |
| GET | /api/v1/buses/search | No |
| GET | /api/v1/trains/search | No |
| GET | /api/v1/cabs/search | No |
| POST | /api/v1/payments/initiate | Yes |
| POST | /api/v1/payments/verify | Yes |
| GET | /api/v1/bookings | Yes |
| POST | /api/v1/bookings/{id}/cancel | Yes |
| GET | /api/v1/bookings/{id}/invoice | Yes |
| POST | /api/v1/coupons/validate | No |
| GET | /api/v1/users/profile | Yes |
| GET | /api/v1/admin/dashboard | Yes (Admin) |
| GET | /api/v1/admin/analytics | Yes (Admin) |
| GET | /api/v1/admin/users | Yes (Admin) |
| POST | /api/v1/admin/users/{id}/block | Yes (Admin) |
| GET | /api/v1/admin/bookings | Yes (Admin) |
| GET | /api/v1/admin/coupons | Yes (Admin) |
| POST | /api/v1/admin/coupons | Yes (Admin) |
| PUT | /api/v1/admin/coupons/{id} | Yes (Admin) |
| DELETE | /api/v1/admin/coupons/{id} | Yes (Admin) |

Full reference: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## CI/CD & Deployment

| Item | Detail |
|---|---|
| Pipeline | GitHub Actions — triggers on push/merge to `Development` |
| Registry | GitHub Container Registry (`ghcr.io`) |
| Images | `travelport-api` (.NET 8), `travelport-web` (Nginx+React) |
| Deploy | SSH into server → `docker compose pull && up -d` |
| DB migrations | Auto-applied on API startup (`db.Database.Migrate()`) |
| Secrets | Written to server `.env` from GitHub Secrets at deploy time |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full setup guide including server provisioning, GitHub Secrets configuration, rollback, and troubleshooting.

---

## External API Configuration

Credentials go in `backend/src/API/appsettings.Development.json` (gitignored — never commit secrets to `appsettings.json`).

### Duffel (Real Flights) — **Disabled by default; DB seed data used instead**
> Set `Enabled: true` in `appsettings.Development.json` only — never in `appsettings.json`.
1. Sign up at [app.duffel.com/join](https://app.duffel.com/join)
2. **Developers → Access tokens** → create a **Test** token
3. Set in `appsettings.Development.json`:
```json
"Duffel": { "ApiToken": "duffel_test_YOUR_TOKEN", "Enabled": true }
```

### Amadeus (Hotels only — existing accounts)
1. Sign up at [developers.amadeus.com](https://developers.amadeus.com) → Create App → copy API Key & Secret (new signups paused as of 2025)
2. Set in config:
```json
"Amadeus": { "ApiKey": "YOUR_KEY", "ApiSecret": "YOUR_SECRET", "Enabled": true }
```

### Razorpay (Real Payments)
1. Create account at [razorpay.com](https://razorpay.com) → Settings → API Keys
2. Set in config:
```json
"Razorpay": { "KeyId": "rzp_test_xxx", "KeySecret": "YOUR_SECRET", "Enabled": true }
```

### SMTP (Email Notifications)
1. Use your SMTP provider credentials (Gmail, Mailgun, AWS SES, etc.)
2. Set in config:
```json
"Email": {
  "Enabled": true,
  "FromEmail": "noreply@yourdomain.com",
  "FromName": "TravelPort",
  "SmtpHost": "smtp.yourprovider.com",
  "SmtpPort": 587,
  "Username": "smtp-user",
  "Password": "smtp-password",
  "EnableSsl": true
}
```

---

## Project Structure

```
Goibibo-AI-Assignment/
├── backend/
│   └── src/
│       ├── Domain/          # Entities, Enums
│       ├── Application/     # DTOs, Services, Validators, Interfaces
│       ├── Infrastructure/  # JWT, BCrypt
│       ├── Persistence/     # EF Core, Repositories, Migrations, Seeds
│       └── API/             # Controllers, Middleware, Program.cs
├── frontend/
│   └── src/
│       ├── pages/           # FlightsPage, HotelsPage, BookingsPage, AdminPage, ProfilePage ...
│       ├── components/      # FlightCard, HotelCard, BookingCard, ConfirmDialog, UI primitives
│       ├── services/        # flightService, hotelService, bookingService, adminService, userService
│       ├── features/auth/   # Redux slice, LoginForm, RegisterForm
│       └── routes/          # AppRouter, PrivateRoute
├── docs/                    # Architecture, API docs, DB design, Security guide
└── .claude/                 # AI workflow commands and prompts
```

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & layer responsibilities |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | REST API reference |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Schema & ER diagram |
| [SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md) | Auth & security implementation |
| [AI_USAGE_REPORT.md](docs/AI_USAGE_REPORT.md) | AI-assisted development log |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch workflow & contribution rules |
| [CLAUDE.md](CLAUDE.md) | AI collaboration guide — project context & standing rules |
| [GIT.md](GIT.md) | Git workflow, branch naming & commit conventions |
| [TODO.md](TODO.md) | Backlog — bugs, pending features, technical debt |
| [TASK-TRACKER.md](TASK-TRACKER.md) | Day-by-day feature delivery log with status |
