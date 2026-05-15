# 🏗️ System Architecture — TravelPort

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   React 18 + TypeScript + Vite + Tailwind + Redux Toolkit       │
│                                                                 │
│   Customer Portal (/*)     Hotel Portal (/hotel/*)              │
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
└──────┬──────────┬─────────┬────────────┬───────────┬────────────┬────────────┘
       │          │         │            │           │            │
  ┌────▼──┐  ┌───▼───┐ ┌───▼───┐  ┌────▼────┐ ┌────▼────┐ ┌────▼──────────┐
  │ Auth  │  │Flight │ │ Hotel │  │Booking  │ │ Admin   │ │ HotelManager  │
  │Service│  │Service│ │Service│  │ Service │ │ Service │ │ Service       │
  └────┬──┘  └───┬───┘ └───┬───┘  └────┬────┘ └────┬────┘ └────┬──────────┘
       │          │         │            │           │            │
┌──────▼──────────▼─────────▼────────────▼───────────▼───────────▼────────────┐
│                    PERSISTENCE LAYER                                         │
│              SQL Server (EF Core)  |  IMemoryCache                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Docker deployment:** `docker compose up` starts SQL Server → .NET API → Nginx/React. Port 80 only is exposed externally; API and DB are internal.

---

## 2. Backend — Clean Architecture Layers

```
backend/src/
│
├── API/                        ← Presentation Layer
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── FlightsController.cs
│   │   ├── HotelsController.cs
│   │   ├── BookingsController.cs
│   │   ├── UsersController.cs
│   │   ├── AdminController.cs
│   │   ├── HotelManagerController.cs   ← [Authorize(Roles="Hotel")] — scoped to JWT hotelId
│   │   ├── BusesController.cs
│   │   ├── TrainsController.cs
│   │   └── CabsController.cs
│   ├── Middleware/             ← Auth, logging, error handling
│   ├── Filters/                ← Action filters
│   └── Program.cs              ← DI composition root
│
├── Application/                ← Business Logic Layer
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── FlightService.cs
│   │   ├── HotelService.cs
│   │   ├── BookingService.cs
│   │   ├── WalletService.cs
│   │   ├── AdminService.cs
│   │   └── HotelManagerService.cs      ← Hotel manager dashboard, bookings, room CRUD
│   ├── Common/
│   │   ├── Constants/
│   │   │   └── SecurityConstants.cs    ← BcryptWorkFactor = 12
│   │   ├── Exceptions/
│   │   ├── Interfaces/         ← ICacheService, IWalletRepository, IHotelRoomRepository, etc.
│   │   └── Mappings/
│   ├── DTOs/
│   │   ├── Auth/
│   │   ├── Flights/
│   │   ├── Hotels/
│   │   ├── Bookings/
│   │   ├── Admin/
│   │   └── HotelManager/               ← RegisterHotelRequest, HotelProfileDto, CreateRoomRequest, etc.
│   └── Validators/
│       ├── Auth/
│       ├── Flights/
│       ├── Admin/                       ← RegisterHotelRequestValidator
│       └── HotelManager/               ← CreateRoomRequestValidator
│
├── Domain/                     ← Core Domain Layer (no dependencies)
│   ├── Entities/
│   │   ├── User.cs             ← Role: User | Admin | Hotel; HotelId FK (nullable)
│   │   ├── Hotel.cs            ← Images (JSON array, nullable)
│   │   ├── HotelRoom.cs        ← Images (JSON array, nullable)
│   │   ├── Booking.cs
│   │   ├── Flight.cs
│   │   ├── Wallet.cs
│   │   ├── WalletTransaction.cs
│   │   ├── SavedCard.cs        ← Last 4 digits only; no full PAN stored
│   │   └── Coupon.cs
│   ├── Enums/
│   │   ├── UserRole.cs         ← User = 0, Admin = 1, Hotel = 2
│   │   ├── BookingStatus.cs
│   │   ├── BookingType.cs
│   │   └── CouponType.cs
│   └── ValueObjects/
│
├── Infrastructure/             ← External Concerns
│   ├── Auth/                   ← JwtService — adds hotelId claim for Hotel-role users
│   ├── Services/               ← CacheService, SmtpEmailService
│   ├── ExternalProviders/
│   │   ├── Email/              ← SmtpEmailService (booking, hotel credentials, password reset)
│   │   ├── Payment/            ← RazorpayService
│   │   └── Flights/            ← DuffelProvider (disabled by default)
│   └── BackgroundServices/     ← BookingExpiryWorker, RefreshTokenCleanupWorker
│
└── Persistence/                ← Database Layer
    ├── Context/                ← TravelPortDbContext
    ├── Migrations/             ← EF Core migrations (including AddHotelPortal)
    ├── Repositories/
    │   ├── UserRepository.cs       ← Excludes Hotel role from admin user lists
    │   ├── HotelRepository.cs      ← GetWithAllRoomsAsync, GetAllWithManagerAsync
    │   ├── HotelRoomRepository.cs  ← GetByIdForHotelAsync (scoped by hotelId)
    │   ├── BookingRepository.cs    ← GetHotelBookingsPagedAsync
    │   └── ...
    ├── Configurations/         ← EF entity configurations
    └── Seeds/                  ← DataSeeder (users, 900+ flights, 60+ hotels, 11 coupons, bookings)
```

---

## 3. Frontend Architecture

```
frontend/src/
│
├── api/                        ← Axios instance + JWT interceptor + endpoint constants
├── components/
│   ├── common/                 ← Reusable UI primitives (Button, Input, Select, Skeleton)
│   ├── ui/                     ← ConfirmDialog, Toast
│   ├── layout/
│   │   ├── HotelLayout.tsx     ← Sidebar layout for /hotel/* routes (Dashboard, Bookings, Rooms, Profile)
│   │   └── MainLayout.tsx
│   └── forms/
├── features/
│   └── auth/                   ← Redux slice, LoginForm (hotel-role → /hotel/dashboard redirect)
├── pages/
│   ├── FlightsPage.tsx
│   ├── HotelsPage.tsx
│   ├── BookingsPage.tsx
│   ├── AdminPage.tsx           ← 5-tab: Dashboard, Users, Bookings, Coupons, Hotels
│   ├── ProfilePage.tsx
│   └── hotel/
│       ├── HotelDashboardPage.tsx   ← 8 stat cards + summary grid
│       ├── HotelBookingsPage.tsx    ← Paginated bookings table with status filter
│       ├── HotelRoomsPage.tsx       ← Room cards + add/edit modal + delete confirm
│       └── HotelProfilePage.tsx     ← Edit hotel details + image gallery preview
├── routes/
│   ├── AppRouter.tsx           ← Nested /hotel/* route block
│   ├── PrivateRoute.tsx
│   └── HotelRoute.tsx          ← Redirects non-Hotel roles away from /hotel/*
├── services/
│   ├── flightService.ts
│   ├── hotelService.ts
│   ├── bookingService.ts
│   ├── adminService.ts
│   ├── hotelManagerService.ts  ← getDashboard, getBookings, getProfile, updateProfile, room CRUD
│   └── userService.ts
├── store/                      ← Redux slices (auth)
├── types/                      ← index.ts — UserToken includes role: 'Hotel' and hotelId
└── utils/                      ← formatters, helpers
```

---

## 4. Role-Based Routing

| Role  | Default Route   | Access                                             |
|-------|-----------------|----------------------------------------------------|
| Guest | `/`             | Public search, flights, hotels                     |
| User  | `/`             | Booking, wallet, profile, booking history          |
| Admin | `/admin`        | Admin panel (users, bookings, coupons, hotels)     |
| Hotel | `/hotel/dashboard` | Hotel portal (dashboard, bookings, rooms, profile) |

Hotel managers are redirected to `/hotel/dashboard` immediately after login. The `HotelRoute` guard prevents any non-Hotel JWT from accessing `/hotel/*` routes.

---

## 5. Data Flow

```
User Action
    ↓
React Component
    ↓
Redux Action / Service call (Axios)
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

### Booking Flow with Razorpay Checkout (Card / UPI / Net Banking)

```
User clicks "Pay via Razorpay" on PaymentPage
    ↓
POST /payments/initiate  →  RazorpayService.CreateOrderAsync
    ├── Converts amount to paise, calls Razorpay Orders API
    └── Returns { orderId, amount (paise), currency, keyId }
    ↓
Frontend: new window.Razorpay(options).open()
    ├── Razorpay hosted modal opens (card / UPI / net banking pre-selected)
    └── User completes payment inside Razorpay's secure UI
    ↓
Razorpay calls handler({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
    ↓
POST /payments/verify
    ├── RazorpayService.VerifySignature — HMAC-SHA256(secret, "orderId|paymentId")
    ├── Creates Payment entity (status: Success)
    ├── Updates Booking status → Confirmed
    └── Sends confirmation email (flight or hotel template)
    ↓
Frontend: redirect to /bookings/{id}
```

### Hotel Manager Data Scoping

```
GET /hotel-manager/dashboard
    ↓
HotelManagerController.CurrentHotelId   ← reads hotelId claim from JWT
    ↓
HotelManagerService.GetDashboardAsync(hotelId)
    ↓
All queries scoped to that hotelId — no cross-hotel data access possible
```

---

## 6. Authentication Flow

```
Login Request
    ↓
JWT Access Token (15min) + Refresh Token (7d)
    ├── User/Admin → standard claims (sub, email, name, role, jti)
    └── Hotel      → standard claims + hotelId claim
    ↓
Tokens stored in localStorage
    ↓
Each request → Authorization: Bearer <access_token>
    ↓
Token Expiry → Auto-refresh via Axios interceptor (single in-flight refresh)
    ↓
Refresh Token → New pair issued
```

---

## 7. Caching Strategy

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

## 8. Background Services

| Service | Schedule | Responsibility |
|---|---|---|
| `BookingExpiryWorker` | Every 5 minutes | Cancels `Pending` bookings older than 30 minutes |
| `RefreshTokenCleanupWorker` | Every 24 hours | Deletes revoked or expired refresh tokens from DB |

Both extend `BackgroundService` (IHostedService) and use `IServiceScopeFactory` to resolve scoped repositories from the singleton hosted service.

---

## 9. Wallet System

- Each user gets one `Wallet` (created on registration).
- `WalletTransaction` records every credit/debit with a description and optional reference ID.
- **Top-up:** `POST /users/wallet/topup` — max ₹1,00,000 per transaction.
- **Deduction during booking:** `IWalletService.DeductAsync` validates balance and creates the transaction record but does **not** call `SaveChangesAsync` — the booking service saves both atomically.
- **Refund on cancellation:** `IWalletService.RefundAsync` credits the wallet (also no separate save — caller saves).

---

## 10. Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Architecture | Clean Architecture | Separation of concerns, testability |
| ORM | EF Core | Type safety, migrations |
| Caching | IDistributedCache (in-memory / Redis) | Cache-aside pattern; Redis-ready with one line swap |
| Background Jobs | IHostedService | Native .NET, no extra dependency |
| Wallet atomicity | DeductAsync without save | Booking + wallet change committed in single UoW call |
| Hotel scoping | hotelId JWT claim | Controller reads claim → all queries scoped; no cross-hotel access |
| Saved cards | Last 4 digits only | PCI-safe; full PANs never stored |
| BCrypt cost | `SecurityConstants.BcryptWorkFactor = 12` | Named constant — no magic numbers |
| State | Redux Toolkit | Predictable, DevTools support |
| Validation | FluentValidation + Zod | Backend + frontend both validated |
| Auth | JWT + Refresh Tokens | Stateless, scalable |
| Email | SMTP (Office365) via `SmtpEmailService` | Table-based HTML for Gmail/Outlook compatibility |

---

## 11. Module Dependency Graph

```
Domain ← Application ← Infrastructure ← API
           ↑                 ↑
      Persistence       External APIs
                        (Duffel, Razorpay, SMTP)
```

Domain has ZERO outward dependencies — pure C# entities and interfaces.
