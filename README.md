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
- Flight Search & Booking
- Hotel Search & Booking
- User Authentication (JWT + Refresh Tokens)
- Booking Management & Cancellation
- Wallet & Coupons
- Admin Panel

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

### Prerequisites
- Node.js 20+
- .NET 8 SDK
- SQL Server Express (`localhost\SQLEXPRESS`)

### Backend
```bash
cd backend
dotnet restore
dotnet ef database update --project src/Persistence --startup-project src/API
dotnet run --project src/API --launch-profile https
```
API runs at `https://localhost:7001` | Swagger at `https://localhost:7001/swagger`

The database is **auto-seeded** on first startup — no manual SQL needed.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

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
| Flights | 24 (10 routes, multiple airlines & dates) |
| Hotels | 15 (Mumbai, Delhi, Goa, Bangalore, Jaipur, Hyderabad) |
| Hotel Rooms | 35+ across all hotels |
| Coupons | 5 (SAVE100, FIRST10, SUMMER20, HOTEL500, FLAT15) |
| Bookings | 3 sample bookings for john@example.com |

---

## API Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | /api/v1/auth/register | No |
| POST | /api/v1/auth/login | No |
| POST | /api/v1/auth/refresh | No |
| POST | /api/v1/auth/logout | Yes |
| GET | /api/v1/flights/search | No |
| POST | /api/v1/flights/book | Yes |
| GET | /api/v1/hotels/search | No |
| POST | /api/v1/hotels/book | Yes |
| GET | /api/v1/bookings | Yes |
| DELETE | /api/v1/bookings/{id}/cancel | Yes |
| GET | /api/v1/users/profile | Yes |

Full reference: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

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
│       ├── pages/           # FlightsPage, HotelsPage, BookingsPage, ProfilePage ...
│       ├── components/      # FlightCard, HotelCard, BookingCard, UI primitives
│       ├── services/        # flightService, hotelService, bookingService, userService
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
