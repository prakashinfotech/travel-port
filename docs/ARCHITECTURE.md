# 🏗️ System Architecture — TravelPort

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   React 18 + TypeScript + Vite + Tailwind + Redux Toolkit       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS / REST
┌─────────────────────────▼───────────────────────────────────────┐
│                         API GATEWAY                             │
│           .NET 8 Web API  |  JWT Auth  |  Rate Limiting         │
└──────┬──────────┬─────────┬────────────┬────────────────────────┘
       │          │         │            │
  ┌────▼──┐  ┌───▼───┐ ┌───▼───┐  ┌────▼────┐
  │ Auth  │  │Flight │ │ Hotel │  │Booking  │
  │Service│  │Service│ │Service│  │ Service │
  └────┬──┘  └───┬───┘ └───┬───┘  └────┬────┘
       │          │         │            │
┌──────▼──────────▼─────────▼────────────▼────────────────────────┐
│                    PERSISTENCE LAYER                             │
│              SQL Server (EF Core)  |  Redis Cache               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend — Clean Architecture Layers

```
backend/src/
│
├── API/                        ← Presentation Layer
│   ├── Controllers/            ← HTTP endpoints
│   ├── Middleware/             ← Auth, logging, error handling
│   ├── Filters/                ← Action filters
│   └── Program.cs              ← DI composition root
│
├── Application/                ← Business Logic Layer
│   ├── Features/               ← CQRS commands & queries
│   │   ├── Auth/
│   │   ├── Flights/
│   │   ├── Hotels/
│   │   ├── Bookings/
│   │   └── Users/
│   ├── Common/
│   │   ├── Behaviours/         ← MediatR pipeline behaviours
│   │   ├── Exceptions/
│   │   ├── Interfaces/
│   │   └── Mappings/
│   └── DTOs/
│
├── Domain/                     ← Core Domain Layer (no dependencies)
│   ├── Entities/
│   ├── Enums/
│   ├── Events/
│   └── ValueObjects/
│
├── Infrastructure/             ← External Concerns
│   ├── Auth/                   ← JWT implementation
│   ├── Caching/                ← Redis
│   ├── Email/                  ← SendGrid
│   └── ExternalAPIs/           ← Amadeus, Razorpay
│
└── Persistence/                ← Database Layer
    ├── Context/                ← DbContext
    ├── Migrations/
    ├── Repositories/
    ├── Configurations/         ← EF entity configs
    └── Seeds/
```

---

## 3. Frontend Architecture

```
frontend/src/
│
├── api/                        ← Axios instances + interceptors
├── components/
│   ├── common/                 ← Reusable UI primitives
│   ├── ui/                     ← Design system components
│   ├── layouts/                ← Page shells
│   └── forms/                  ← Form engine components
├── features/                   ← Feature-based modules
│   ├── auth/
│   ├── flights/
│   ├── hotels/
│   ├── bookings/
│   └── admin/
├── hooks/                      ← Custom React hooks
├── pages/                      ← Route-level components
├── routes/                     ← Route definitions + guards
├── services/                   ← API service layer
├── store/                      ← Redux slices
├── types/                      ← TypeScript interfaces
└── utils/                      ← Pure helper functions
```

---

## 4. Data Flow

```
User Action
    ↓
React Component
    ↓
Redux Action / React Query Mutation
    ↓
API Service Layer (Axios)
    ↓
.NET 8 API Controller
    ↓
MediatR Handler (CQRS)
    ↓
Application Service
    ↓
Repository (EF Core)
    ↓
SQL Server
```

---

## 5. Authentication Flow

```
Login Request
    ↓
JWT Access Token (15min) + Refresh Token (7d)
    ↓
Tokens stored in httpOnly cookie / localStorage
    ↓
Each request → Authorization: Bearer <access_token>
    ↓
Token Expiry → Auto-refresh via interceptor
    ↓
Refresh Token Rotation → New pair issued
```

---

## 6. CQRS Pattern (Backend)

```
Command (Write):
  BookFlightCommand → BookFlightCommandHandler → Repository → DB

Query (Read):
  SearchFlightsQuery → SearchFlightsQueryHandler → Cached/DB → DTO
```

---

## 7. Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Architecture | Clean Architecture | Separation of concerns, testability |
| Pattern | CQRS + MediatR | Scalable read/write separation |
| ORM | EF Core | Type safety, migrations |
| Caching | Redis | Performance for search results |
| State | Redux Toolkit | Predictable, DevTools support |
| Validation | FluentValidation + Zod | Both layers covered |
| Auth | JWT + Refresh Tokens | Stateless, scalable |

---

## 8. Module Dependency Graph

```
Domain ← Application ← Infrastructure ← API
           ↑                 ↑
      Persistence       External APIs
```

Domain has ZERO outward dependencies — pure C# entities and interfaces.
