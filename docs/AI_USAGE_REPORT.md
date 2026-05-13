# AI Usage Report — TravelPort

## AI Tool Used

**Claude Code (Anthropic)** — Claude Sonnet 4.6, running as an interactive CLI agent throughout all phases of development.

---

## AI-Assisted Workflow

### Phase 1 — Initial Full-Stack Implementation
- **AI Generated:** Clean Architecture scaffold (.NET 8), domain entities, EF Core context, JWT auth with refresh tokens
- **AI Generated:** React 18 + TypeScript + Vite + Tailwind project structure, Redux auth slice, Axios interceptor
- **AI Generated:** Flight/hotel search + booking APIs, seed data (users, flights, hotels, coupons, bookings)
- **AI Generated:** All frontend pages (FlightsPage, HotelsPage, BookFlightPage, BookHotelPage, BookingsPage, ProfilePage)

### Phase 2 — Caching, Wallet & Background Workers
- **AI Generated:** `ICacheService` + in-memory implementation with TTL helpers
- **AI Generated:** Wallet entity, `IWalletService`, atomic deduct-with-booking pattern (single `SaveChangesAsync`)
- **AI Generated:** Razorpay payment gateway (initiate + HMAC verify), mock fallback for dev
- **AI Generated:** `BookingExpiryWorker`, `RefreshTokenCleanupWorker` (IHostedService)
- **AI Generated:** Coupon system (Fixed + Percentage types, 5 seed coupons)

### Phase 3 — External APIs & Transport Modules
- **AI Generated:** `IExternalFlightProvider` interface, Duffel API integration
- **AI Generated:** `BusSearchProvider`, `TrainSearchProvider`, `CabSearchProvider` (deterministic mock)
- **AI Generated:** BusesPage, TrainsPage, CabsPage frontend components
- **AI Generated:** PaymentPage with Razorpay Checkout.js integration

### Phase 4 — Seed Data Expansion & Flight Filter UI
- **AI Generated:** Programmatic `BuildFlights()` engine — 900+ flights, 42 routes, 7 airlines, 14 date slots
- **AI Generated:** 60+ hotels across 12 cities with 120+ room types
- **AI Generated:** Goibibo-style FlightsPage — Popular Filters, date bar, fare type tabs, sort, filter sidebar
- **AI Generated:** FlightCard redesign, VIEW FARES popup, fare-family booking flow

### Phase 5 — Bug Fixes, Design Polish & TypeScript Clean-up
- **AI Assisted:** Resolved 10+ TypeScript errors across FlightsPage, BookFlightPage, PaymentPage
- **AI Assisted:** Stable DataSeeder (flight IDs + user bookings survive restarts)
- **AI Generated:** 6 new coupons (FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL)
- **AI Assisted:** `TravellerSelector` and `AirportSearch` popup clipping fix

### Phase 6 — Hotel Booking Flow, Email, PDF & Bookings UX
- **AI Generated:** Hotel booking flow with guest details (name/email/phone stored per booking)
- **AI Generated:** SMTP email notifications for booking confirmed, cancelled, and password reset
- **AI Generated:** PDF e-ticket (PdfSharpCore, A4 layout) for flights + hotel invoices
- **AI Generated:** FL/HT booking reference prefixes, BookingsPage numbered pagination
- **AI Generated:** Forgot password / reset password with expiring token and email link

### Phase 7 — Admin Dashboard, Bug Fixes & Email Overhaul
- **AI Diagnosed & Fixed:** `JsonStringEnumConverter` missing — booking status showed as `1` instead of `"Confirmed"`; cancel button not visible
- **AI Diagnosed & Fixed:** Wallet never credited on cancellation — `_wallet.RefundAsync` was never called in `BookingService.CancelAsync`
- **AI Generated:** Complete `SmtpEmailService` rewrite — email-client-safe HTML (solid hex colors, `<table>` layouts, no CSS gradients/flex)
- **AI Generated:** `ConfirmDialog` component replacing native `confirm()` on BookingCard + BookingDetailPage
- **AI Generated:** Full Admin Dashboard — `IAdminService`, `AdminService`, `AdminController` (9 endpoints), `AdminPage.tsx` (4-tab React page: Dashboard, Users, Bookings, Coupons)

### Phase 8 — Docker & CI/CD Pipeline
- **AI Generated:** Multi-stage Dockerfiles for backend (SDK→ASP.NET runtime) and frontend (Node→Nginx)
- **AI Generated:** `docker-compose.yml` — SQL Server (healthcheck) → API → Nginx/React; `sqldata` volume
- **AI Generated:** GitHub Actions 3-job pipeline: build+verify → Docker push to `ghcr.io` → SSH deploy
- **AI Fixed:** `vite.config.ts` proxy target (`https://localhost:7001` → `http://localhost:5000`)
- **AI Fixed:** Hotel filter logic (star=exact match, amenities/popular filters OR logic)
- **AI Fixed:** FlightsPage city name pre-population from URL params on mount

---

## AI Decisions Log

| Decision | AI Recommendation | Adopted |
|----------|-------------------|---------|
| Clean Architecture | Domain → Application → Infrastructure/Persistence → API | ✅ |
| In-memory cache (IMemoryCache) over Redis | Simpler for dev; Redis-swappable via one DI line | ✅ |
| BCrypt cost factor 12 | Balance of security vs performance | ✅ |
| Wallet atomicity — deduct without save | Booking + wallet committed in single UoW call | ✅ |
| Deterministic mock for buses/trains/cabs | HashCode seed ensures repeatable results | ✅ |
| `JsonStringEnumConverter` | Enums as strings in all API responses | ✅ |
| Email with `<table>` layouts | Gmail/Outlook strip CSS flexbox, gradients, rgba | ✅ |
| Docker with Nginx reverse proxy | Single exposed port (80), clean `/api` proxy | ✅ |
| GHA `environment: production` | Manual approval gate before each deploy | ✅ |

---

## Productivity Impact

| Metric | Estimate |
|--------|----------|
| Architecture & scaffolding | 90% faster |
| Boilerplate code generation | 85% faster |
| Bug diagnosis (root cause) | 70% faster |
| Documentation writing | 80% faster |
| Overall development velocity | ~4-5x improvement |

---

## Reusable Prompts & Skills

See `.claude/` for all reusable skill files and prompts:
- `.claude/commands/` — `/generate-api`, `/generate-migration`, `/generate-tests`, `/generate-ui`, `/review-code`
- `.claude/prompts/` — api-generation, ui-generation, testing-generation, deployment-generation, database-schema, code-review
