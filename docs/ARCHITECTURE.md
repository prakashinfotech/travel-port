# 🏗️ System Architecture — TravelPort

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   React 18 + TypeScript + Vite + Tailwind + Redux Toolkit       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / REST (via Nginx in Docker)
┌─────────────────────────▼───────────────────────────────────────┐
│                     NGINX (Docker only)                         │
│        Serves React SPA  |  /api/* → api:5000 proxy            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                         API GATEWAY                             │
│           .NET 8 Web API  |  JWT Auth  |  Serilog               │
└──────┬──────────┬─────────┬────────────┬───────────┬────────────┘
       │          │         │            │           │
  ┌────▼──┐  ┌───▼───┐ ┌───▼───┐  ┌────▼────┐ ┌────▼────┐
  │ Auth  │  │Flight │ │ Hotel │  │Booking  │ │ Admin   │
  │Service│  │Service│ │Service│  │ Service │ │ Service │
  └────┬──┘  └───┬───┘ └───┬───┘  └────┬────┘ └────┬────┘
       │          │         │            │           │
┌──────▼──────────▼─────────▼────────────▼───────────▼────────────┐
│                    PERSISTENCE LAYER                             │
│              SQL Server (EF Core)  |  IMemoryCache              │
└─────────────────────────────────────────────────────────────────┘
```

**Docker deployment:** `docker compose up` starts SQL Server → .NET API → Nginx/React. Port 80 only is exposed externally; API and DB are internal.

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
│   ├── Services/               ← Business services (Auth, Flight, Hotel, Booking, Wallet, Admin)
│   ├── Common/
│   │   ├── Exceptions/
│   │   ├── Interfaces/         ← ICacheService, IWalletRepository, IWalletService, etc.
│   │   └── Mappings/
│   ├── DTOs/                   ← Request/Response data transfer objects
│   └── Validators/             ← FluentValidation validators
│
├── Domain/                     ← Core Domain Layer (no dependencies)
│   ├── Entities/               ← Booking, Flight, Hotel, User, Wallet, WalletTransaction, etc.
│   ├── Enums/
│   └── ValueObjects/
│
├── Infrastructure/             ← External Concerns
│   ├── Auth/                   ← JWT (JwtService, JwtSettings)
│   ├── Services/               ← CacheService (wraps IDistributedCache with JSON serialization)
│   └── BackgroundServices/     ← BookingExpiryWorker, RefreshTokenCleanupWorker
│
└── Persistence/                ← Database Layer
    ├── Context/                ← TravelPortDbContext
    ├── Migrations/             ← EF Core migrations
    ├── Repositories/           ← FlightRepository, HotelRepository, WalletRepository, etc.
    ├── Configurations/         ← EF entity configurations
    └── Seeds/                  ← DataSeeder (BCrypt-hashed users, flights, hotels, coupons, bookings)
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
Application Service
    ↓
ICacheService (check cache)
    ├── Cache HIT → return DTO immediately
    └── Cache MISS → Repository (EF Core) → SQL Server → cache result
```

### Booking Flow with Wallet Payment

```
POST /flights/book  (UseWallet: true)
    ↓
FlightService.BookAsync
    ├── Validate flight + seat availability
    ├── Apply coupon discount
    ├── IWalletService.DeductAsync (validates balance, creates Debit transaction — NO save yet)
    ├── Create Booking entity
    ├── IUnitOfWork.SaveChangesAsync  ← atomic: booking + wallet deduction in one DB round-trip
    └── Invalidate flight cache key
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

## 6. Caching Strategy

| Cache Key Pattern | TTL | Used By |
|---|---|---|
| `flights:{Origin}:{Destination}:{Date}:{Passengers}:{Class}` | 5 min | FlightService.SearchAsync |
| `flight:{id}` | 30 min | FlightService.GetByIdAsync |
| `hotels:{City}:{CheckIn}:{CheckOut}:{Guests}:{Rating}:{Sort}` | 5 min | HotelService.SearchAsync |
| `hotel:{id}` | 30 min | HotelService.GetByIdAsync |

**Implementation:** `ICacheService` wraps `IDistributedCache` with JSON serialization.  
**Default:** In-memory (`AddDistributedMemoryCache`).  
**Production swap:** Replace with `AddStackExchangeRedisCache` in `Program.cs` — no service code changes needed.

Cache entries for a flight/hotel are **invalidated on booking** (seat count changes).

---

## 7. Background Services

| Service | Schedule | Responsibility |
|---|---|---|
| `BookingExpiryWorker` | Every 5 minutes | Cancels `Pending` bookings older than 30 minutes |
| `RefreshTokenCleanupWorker` | Every 24 hours | Deletes revoked or expired refresh tokens from DB |

Both extend `BackgroundService` (IHostedService) and use `IServiceScopeFactory` to resolve scoped repositories from the singleton hosted service.

---

## 8. Wallet System

- Each user gets one `Wallet` (created on registration).
- `WalletTransaction` records every credit/debit with a description and optional reference ID.
- **Top-up:** `POST /users/wallet/topup` — max ₹1,00,000 per transaction.
- **Deduction during booking:** `IWalletService.DeductAsync` validates balance and creates the transaction record but does **not** call `SaveChangesAsync` — the booking service saves both atomically.
- **Refund on cancellation:** `IWalletService.RefundAsync` credits the wallet (also no separate save — caller saves).

---

## 9. Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Architecture | Clean Architecture | Separation of concerns, testability |
| ORM | EF Core | Type safety, migrations |
| Caching | IDistributedCache (in-memory / Redis) | Cache-aside pattern; Redis-ready with one line swap |
| Background Jobs | IHostedService | Native .NET, no extra dependency |
| Wallet atomicity | DeductAsync without save | Booking + wallet change committed in single UoW call |
| State | Redux Toolkit | Predictable, DevTools support |
| Validation | FluentValidation + Zod | Backend + frontend both validated |
| Auth | JWT + Refresh Tokens | Stateless, scalable |

---

## 10. Module Dependency Graph

```
Domain ← Application ← Infrastructure ← API
           ↑                 ↑
      Persistence       External APIs
```

Domain has ZERO outward dependencies — pure C# entities and interfaces.
