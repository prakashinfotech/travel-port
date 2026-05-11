# TASK-TRACKER.md — TravelPort Feature Delivery Log

> Day-by-day progress tracker for the Goibibo AI Assignment.
> Status: ✅ Done · 🚧 In Progress · ❌ Not Started · ⚠️ Partial / Needs Work

---

## Phase 1 — Initial Full-Stack Implementation
**Branch:** `main` → initial commit `d2468bc`
**Scope:** Complete foundation — domain, backend, frontend, auth, DB

| # | Feature | Status | Notes |
|---|---|---|---|
| 1.1 | Clean Architecture backend setup (.NET 8) | ✅ | Domain / Application / Infrastructure / Persistence / API layers |
| 1.2 | SQL Server EF Core with migrations | ✅ | `localhost\SQLEXPRESS`, auto-seeded on startup |
| 1.3 | JWT authentication (15 min access + 7 day refresh) | ✅ | BCrypt cost 12, refresh token stored in DB |
| 1.4 | User registration & login endpoints | ✅ | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| 1.5 | Flight search & booking API | ✅ | `GET /flights/search`, `POST /flights/book` |
| 1.6 | Hotel search & booking API | ✅ | `GET /hotels/search`, `GET /hotels/:id/rooms`, `POST /hotels/book` |
| 1.7 | Booking management (list, detail, cancel) | ✅ | `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel` |
| 1.8 | Global exception middleware + `ApiResponse<T>` wrapper | ✅ | Consistent `{ success, data, errors, meta }` shape |
| 1.9 | Serilog structured logging (console + rolling file) | ✅ | Configured in `Program.cs` |
| 1.10 | Swagger / OpenAPI docs | ✅ | Available at `https://localhost:7001/swagger` |
| 1.11 | React 18 + TypeScript + Vite + Tailwind CSS frontend | ✅ | Feature-based folder structure |
| 1.12 | Redux Toolkit auth slice + Axios JWT interceptor | ✅ | Auto-refresh on 401, token stored in localStorage |
| 1.13 | FlightsPage — search form + results | ✅ | Airport search, traveller selector, flight cards |
| 1.14 | HotelsPage — search form + results | ✅ | City, checkin/checkout, guest count |
| 1.15 | BookFlightPage + BookHotelPage | ✅ | Passenger details form, coupon input |
| 1.16 | BookingsPage — user booking history | ✅ | List + cancel action |
| 1.17 | ProfilePage — view user info | ✅ | Basic profile display |
| 1.18 | LoginForm + RegisterForm | ✅ | Zod validation, error display |
| 1.19 | PrivateRoute + AppRouter | ✅ | Lazy-loaded pages, protected routes |
| 1.20 | DB seed data — users, flights, hotels, coupons | ✅ | 4 users, ~130 flights, 15 hotels, 5 coupons, 3 bookings |

---

## Phase 2 — Caching, Wallet, Background Workers
**Branch:** `Development` → commit `e5437c4`
**Scope:** Performance, payments, wallet system

| # | Feature | Status | Notes |
|---|---|---|---|
| 2.1 | ICacheService with in-memory provider + TTL helpers | ✅ | 5-min default TTL, key-based invalidation |
| 2.2 | Flight search results caching | ✅ | Cache key includes origin/dest/date/class/filters |
| 2.3 | Wallet entity — balance, top-up, deduct | ✅ | `GET /users/wallet`, `POST /users/wallet/topup` |
| 2.4 | Wallet transaction history | ✅ | `GET /users/wallet/transactions` (paginated) |
| 2.5 | `useWallet: true` in flight/hotel booking | ✅ | Atomic balance deduction with booking creation |
| 2.6 | Background workers (IHostedService) | ✅ | Scheduled cleanup / maintenance tasks |
| 2.7 | Razorpay payment gateway (backend) | ✅ | `POST /payments/initiate`, `POST /payments/verify`, HMAC signature check |
| 2.8 | Mock payment fallback (dev mode) | ✅ | `order_mock_` prefix — skips signature verification |
| 2.9 | SendGrid email notifications | ✅ | Booking confirmation email; toggle via config |
| 2.10 | Coupon system (Fixed + Percentage types) | ✅ | 5 coupons seeded; applied at booking time |
| 2.11 | Admin endpoints (dashboard, users, bookings, coupons) | ✅ | Role-guarded with `[Authorize(Roles = "Admin")]` |
| 2.12 | Saved travellers CRUD | ✅ | `GET/POST/DELETE /users/travellers` |

---

## Phase 3 — External APIs, Transport Modules, UI Expansion
**Branch:** `feature/ui-overhaul-and-bug-fixes` → commit `2e38d2b`
**Scope:** External API integration, new transport pages, payment UI

| # | Feature | Status | Notes |
|---|---|---|---|
| 3.1 | `IExternalFlightProvider` interface | ✅ | Allows swapping Amadeus / Duffel / mock |
| 3.2 | Duffel API flight provider | ✅ | POST `/air/offer_requests?return_offers=true`, `Duffel-Version: v2` |
| 3.3 | Duffel offer caching (`duffel_offer:{guid}` → raw JSON) | ✅ | 30-min TTL; used by `BookAsync` to retrieve price |
| 3.4 | Amadeus hotel provider (existing accounts only) | ✅ | Toggleable via `Amadeus.Enabled` config |
| 3.5 | Fix: merge Duffel + DB flights (not OR but AND) | ✅ | `all = [.. external, .. dbFlights]` |
| 3.6 | Bus search provider (deterministic mock) | ✅ | `GET /buses/search` — HashCode seed for repeatability |
| 3.7 | Train search provider (deterministic mock) | ✅ | `GET /trains/search` — 14 named trains, 5 classes |
| 3.8 | Cab search provider (deterministic mock) | ✅ | `GET /cabs/search` — Ola/Uber/Meru/Zoom, distance pricing |
| 3.9 | BusesController, TrainsController, CabsController | ✅ | REST controllers wired in DI |
| 3.10 | PaymentsController | ✅ | Initiate + verify endpoints |
| 3.11 | FlightDto — stops, isRefundable, baggageIncluded, checkedBags, aircraft, externalOfferId | ✅ | Richer DTO for UI display |
| 3.12 | FlightSearchRequest — maxPrice, maxStops, airlines, sortBy filters | ✅ | All backend-filterable |
| 3.13 | BusesPage (frontend) | ✅ | Search form, result cards with AC/Non-AC badges |
| 3.14 | TrainsPage (frontend) | ✅ | Class selector, availability badges (AVAILABLE/WL/RAC/REGRET) |
| 3.15 | CabsPage (frontend) | ✅ | Trip type (OneWay/RoundTrip/Outstation/Local), price-per-km |
| 3.16 | PaymentPage — Razorpay checkout | ✅ | Loads `checkout.js`, opens modal, verifies HMAC |
| 3.17 | FlightCard — stops, baggage, refundable, city names | ✅ | Green/orange stops badge, icon badges |
| 3.18 | Navbar — /buses, /trains, /cabs links | ✅ | Replaced `#hash` hrefs with real routes |
| 3.19 | AppRouter — lazy-loaded Buses/Trains/Cabs routes | ✅ | Wrapped in `<Suspense>` |
| 3.20 | BookHotelPage bug fix — `hotelId + roomId` fields | ✅ | Was `hotelRoomId` (wrong field name) |

---

## Phase 4 — Seed Data Expansion & Flight Filter UI
**Branch:** `feature/ui-overhaul-and-bug-fixes` → current session
**Date:** 2026-05-11
**Scope:** Massive data expansion, Goibibo-style flight page

| # | Feature | Status | Notes |
|---|---|---|---|
| 4.1 | Disable Duffel (use DB-only data) | ✅ | `appsettings.Development.json` → `Enabled: false` |
| 4.2 | DataSeeder — programmatic `BuildFlights()` engine | ✅ | 42 bidirectional routes × 7 airlines × 14 date slots |
| 4.3 | DataSeeder — 900+ flights generated | ✅ | Deterministic, realistic prices, per-airline frequency patterns |
| 4.4 | DataSeeder — 40+ hotels across 12 cities | ✅ | Added Chennai, Kolkata, Ahmedabad, Pune, Kochi, Lucknow |
| 4.5 | DataSeeder — force-reseed hotels (was: AnyAsync guard) | ✅ | New cities now get seeded |
| 4.6 | BusSearchProvider — route-specific duration lookup table | ✅ | BOM→PNQ 200min, BOM→GOI 720min, DEL→JAI 270min etc. |
| 4.7 | BusSearchProvider — 14 operators, AC/Non-AC split | ✅ | VRL, IntrCity, MSRTC, KSRTC, GSRTC etc. |
| 4.8 | BusSearchProvider — `decimal` rating fix | ✅ | Was `double × decimal` type error |
| 4.9 | TrainSearchProvider — 39 named real trains | ✅ | Rajdhani, Shatabdi, Express, Mail trains |
| 4.10 | TrainSearchProvider — route-specific duration dictionary | ✅ | BOM→DEL 960min, DEL→BLR 1680min etc. |
| 4.11 | TrainSearchProvider — distance-proportional pricing | ✅ | `priceFactor = baseDur / 600` applied to all classes |
| 4.12 | FlightCard — Goibibo-style redesign | ✅ | Airline color badge, large times, orange VIEW FARES button |
| 4.13 | FlightsPage — orange header + fare type tabs | ✅ | Regular, Student, Armed Forces, GST, Senior Citizen, Doctor & Nurses |
| 4.14 | FlightsPage — date bar strip (±3/+4 days) | ✅ | Lowest price fetched per date in background, clickable |
| 4.15 | FlightsPage — calendar picker popup | ✅ | 2-month view, per-day prices from cache |
| 4.16 | FlightsPage — Popular Filters sidebar section | ✅ | Non Stop, airlines, time periods, Refundable, 1 Stop — each with min price |
| 4.17 | FlightsPage — Arrival Airports section | ✅ | Full airport name from IATA code map |
| 4.18 | FlightsPage — One Way Price range slider | ✅ | Min/max derived from live search results |
| 4.19 | FlightsPage — Departure time-slot buttons | ✅ | 4 slots with 🌙🌅☀️🌆 icons, price hints |
| 4.20 | FlightsPage — Arrival time-slot buttons | ✅ | Same 4 slots for arrival time |
| 4.21 | FlightsPage — Airlines section with colored dots | ✅ | Sorted by min price, checkboxes |
| 4.22 | FlightsPage — 4 sort tabs (Cheapest / Non Stop / Prefer / Departure) | ✅ | Each shows min price for that sort |
| 4.23 | FlightsPage — Clear all filters button | ✅ | Resets entire filter state |
| 4.24 | tailwind.config.js — `scrollbar-hide` utility plugin | ✅ | Used in date bar horizontal scroll |
| 4.25 | README.md — updated seed data counts | ✅ | 900+ flights, 40+ hotels, 12 cities |
| 4.26 | API_DOCUMENTATION.md — updated data source note | ✅ | Reflects DB-only mode with optional Duffel |
| 4.27 | CLAUDE.md created | ✅ | Project context, standing rules, conventions |
| 4.28 | GIT.md created | ✅ | Branch naming, commit format, PR template |
| 4.29 | TODO.md created | ✅ | Bugs, features pending, technical debt |
| 4.30 | TASK-TRACKER.md created | ✅ | This file |
| 4.31 | FlightCard — fare options modal on VIEW FARES | ✅ | Goibibo-style popup with 3 fare cards and BOOK NOW CTA |
| 4.32 | BookFlightPage — redesign to fare-summary layout | ✅ | Flight summary, policy card, coupon section, sticky pricing sidebar |
| 4.33 | BookFlightPage — dynamic traveller details UI | ✅ | Forms rendered from selected passenger count with contact and GST fields |
| 4.34 | BookingDetailPage — Goibibo-style confirmation redesign | ✅ | Rich flight card, traveller/contact blocks, actions sidebar, fare summary |
| 4.35 | Bookings API — downloadable PDF e-ticket endpoint | ✅ | `GET /bookings/{id}/invoice` returns generated PDF ticket |
| 4.36 | Email notifications — SMTP-ready confirmation flow | ✅ | Booking confirmation email wired with config-based SMTP fallback logging |
| 4.37 | HomePage — remove top transport tabs from search hero | ✅ | Search form now opens directly without Flights/Hotels/Cabs/Trains/Buses pills above it |
| 4.38 | HomePage — recent searches persist with deep-link navigation | ✅ | Stored in localStorage and clicking reopens the saved results page |

---

## Phase 5 — Bug Fixes, Design Polish & TypeScript Clean-up
**Branch:** `feature/ui-overhaul-and-bug-fixes` → current session
**Date:** 2026-05-11
**Scope:** Bug fixes from audit, UI polish, zero-error TypeScript build

| # | Feature | Status | Notes |
|---|---|---|---|
| 5.1 | **B1** Login redirect — preserve original destination after auth | ✅ | `location.state?.from` path used post-login; LoginForm updated |
| 5.2 | **B2** Bookings disappear on restart — DataSeeder always re-seeds john's bookings | ✅ | `SeedBookingsAsync` deletes stale bookings for `john@example.com` before inserting fresh ones |
| 5.3 | **B3** Coupon discount not applied — FlightService + HotelService BookAsync | ✅ | `ICouponRepository` + `CouponRepository` added; discount calculation wired in both services |
| 5.4 | **D1** HomePage buses/trains/cabs search forms — replaced "Coming soon" block | ✅ | Full search forms with fields pre-wired to URL params for each mode |
| 5.5 | **D3** BusesPage / TrainsPage / CabsPage — read URL params and auto-search on load | ✅ | `useSearchParams` + `useEffect` added to all three pages |
| 5.6 | **D4** Recent searches — clickable chips navigate to results; ✕ button removes entry | ✅ | `href` field added to recent-search objects; `removeRecentSearch` helper added |
| 5.7 | FlightsPage — syntax fix (TIME_SLOTS missing `]`) | ✅ | Fixed `Unexpected token` error at line 45 |
| 5.8 | FlightsPage — removed duplicate state / type declarations from merged codebases | ✅ | Single `origin`, `destination`, `tripType`, `SortKey`, `TODAY` declarations |
| 5.9 | FlightsPage — removed broken first `filtered` useMemo; kept Goibibo-style one | ✅ | `filtered` now uses `filters` object + `sortKey` correctly |
| 5.10 | FlightsPage — wired `FilterSidebar` + `SortTabs` in render (replaced simple sidebar) | ✅ | All previously-defined components now used; no dead code |
| 5.11 | FlightsPage — removed unused `DateBar`, `CalendarPicker`, `FARE_TYPES`, `fmtDateLabel` | ✅ | Zero TS6133 "declared but not read" errors from FlightsPage |
| 5.12 | `endpoints.ts` — removed duplicate property keys in `users` object | ✅ | Six duplicate keys removed; TS1117 gone |
| 5.13 | PaymentPage — added missing imports (`ApiResponse`, `CreateOrderResponse`, `endpoints`, `AlertCircle`) | ✅ | Removed unused card/UPI state; typed `window.Razorpay`; typed `response` handler |
| 5.14 | HomePage — added `X` to lucide-react import for remove-recent-search button | ✅ | TS2304 resolved |
| 5.15 | TypeScript build — zero errors across all frontend files | ✅ | `npx tsc --noEmit` exits clean |
| 5.16 | BookFlightPage — login banner hidden when already authenticated | ✅ | Uses `useAppSelector`; pre-fills email from auth state |
| 5.17 | FlightsPage → FlightCard — passenger count now passed correctly | ✅ | `passengerCount` prop wired so BookFlightPage shows correct traveller forms |
| 5.18 | Coupon discount reflected in fare summary | ✅ | Backend: `GET /api/v1/coupons/validate`; Frontend: Apply button, discount line in summary, deducted from total |
| 5.19 | PDF e-ticket redesign — Goibibo-style layout | ✅ | QuestPDF 2025.1.0 added; branded header (orange), booking ref bar (navy), IATA codes, passenger table, baggage table, cancellation charges, fare summary, customer support section |

---

## Upcoming / Planned

| # | Feature | Priority | Phase |
|---|---|---|---|
| 5.1 | Mobile filter drawer (slide-over) for FlightsPage | 🔴 High | Phase 5 |
| 5.2 | Hotel search filter sidebar (Goibibo style) | 🔴 High | Phase 5 |
| 5.3 | Bus / Train / Cab booking — persistence + API | 🔴 High | Phase 5 |
| 5.4 | Fix coupon discount not applied to `FinalAmount` | 🔴 High | Phase 5 |
| 5.5 | Wallet transaction race condition fix | 🟡 Medium | Phase 5 |
| 5.6 | Admin dashboard UI (React pages) | 🟡 Medium | Phase 5 |
| 5.7 | Saved travellers UI | 🟡 Medium | Phase 5 |
| 5.8 | Forgot password / Reset password flow | ✅ Done | Backend endpoints wired; SendGrid email or dev log fallback; reset token expires in 1 hour |
| 5.9 | Email verification flow (OTP) | 🟡 Medium | Phase 5 |
| 5.10 | Invoice download (PDF) | ✅ Done | `GET /bookings/{id}/invoice` — Goibibo-style PDF with QuestPDF: branded header, IATA codes, passenger/baggage/cancellation tables |
| 5.11 | Unit tests for FlightService, HotelService | 🟢 Low | Phase 6 |
| 5.12 | GitHub Actions CI (build + lint) | 🟢 Low | Phase 6 |
| 5.13 | Docker containerisation | 🟢 Low | Phase 6 |

---

## DB Migration Commands Reference

```bash
# After any DataSeeder change — drop and recreate
cd backend
dotnet ef database drop --project src/Persistence --startup-project src/API --force
dotnet ef database update --project src/Persistence --startup-project src/API
dotnet run --project src/API --launch-profile https
```

---

## Key Metrics

| Metric | Value |
|---|---|
| Total phases completed | 4 |
| Total features delivered | 100+ |
| Flights in seed DB | 900+ (dynamic demand-based pricing) |
| Hotels in seed DB | 40+ (12 cities) |
| API endpoints | 37+ |
| Frontend pages | 11 |
| Airlines covered | 7 |
| Routes covered | 42 bidirectional |
| External API integrations | 3 (Duffel, Razorpay, SMTP) |
