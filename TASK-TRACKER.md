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
| 5.20 | HotelsPage — Goibibo-style search UI (matching screenshot) | ✅ | Orange header, mode tabs, box-style date fields with "18 May '26 / Monday" format, Guests & Rooms dropdown, SEARCH button |
| 5.21 | HotelsPage — city prefill from URL params | ✅ | `useState(searchParams.get('city'))` reads URL on mount; auto-search fires when city present |
| 5.22 | HotelsPage — Goibibo-style filter sidebar | ✅ | Popular Filters (Pool/Parking/Spa/Gym), Star Category toggles, User Rating with colour badges, Price range slider, Amenities chips |
| 5.23 | HotelsPage — sort tabs replacing Select dropdown | ✅ | ⭐ Top Rated · ₹ Price ↑ · ₹ Price ↓ · ★ Stars pill tabs |
| 5.24 | HotelDetailPage — new full hotel detail page | ✅ | Hero image + gallery strip, rating card, amenities grid, room cards with Book Now, sticky stay-summary sidebar, Important Info section |
| 5.25 | HotelCard — pass checkIn/checkOut/guests to detail page URL | ✅ | Search params forwarded so Book Now button on detail page has correct dates |
| 5.26 | Hotel data expansion — 30 additional hotels | ✅ | +5 Mumbai, +5 Delhi, +5 Goa, +5 Bangalore, +6 Jaipur, +5 Hyderabad; seeder now checks count ≥ 60 |
| 5.27 | Flights/Hotels search heroes - remove duplicate in-page mode tabs and align CTA placement | DONE | Shared navbar is now the only top transport menu; HotelsPage search button moved inline to match FlightsPage |

---

## Phase 6 — Hotel Booking Flow, Email, PDF, Bookings UX & Bug Fixes
**Branch:** `Development` → current session
**Date:** 2026-05-12
**Scope:** Guest details on hotel bookings, SMTP email for all events, PDF generator switched to PdfSharpCore (A4), bookings pagination, FL/HT booking ref prefixes, stable seeder, airport search UX fix, TravellerSelector popup fix

| # | Feature | Status | Notes |
|---|---|---|---|
| 6.1 | `Booking` entity — `GuestName`, `GuestEmail`, `GuestPhone` fields | ✅ | EF migration `AddGuestDetailsToBooking` applied |
| 6.2 | `BookHotelRequest` DTO — guest detail fields | ✅ | `GuestName`, `GuestEmail`, `GuestPhone` passed from UI |
| 6.3 | `BookingDto` — guest fields surfaced in response | ✅ | `UserName/Email/Phone` resolved from guest fields first, then account |
| 6.4 | FL / HT booking reference prefixes | ✅ | `GenerateBookingRefAsync(prefix)` — FlightService uses "FL", HotelService uses "HT"; format `FL2026XXXXXX` |
| 6.5 | `HotelService.BookAsync` — booking confirmation email | ✅ | Uses `GuestEmail ?? user.Email`; sends HTML confirmation with hotel/room/dates/amounts |
| 6.6 | `BookingService.CancelAsync` — cancellation email | ✅ | Uses guest email for hotel bookings, account email for flights; 90% refund shown |
| 6.7 | `IEmailService` — `SendBookingCancellationAsync` method | ✅ | Red-header HTML email with booking ref, status, refund amount |
| 6.8 | `SmtpEmailService` — Outlook/Office365 SMTP support | ✅ | `smtp.office365.com:587`; `FromEmail` must match `Username` (fixed); SMTP error now logs host/port/status code |
| 6.9 | `SmtpEmailService` — success logging | ✅ | Logs `Email sent to {ToEmail}` on success for visibility |
| 6.10 | Background workers — graceful shutdown fix | ✅ | `OperationCanceledException` caught at outer try; API no longer crashes on stop |
| 6.11 | PDF generator switched from QuestPDF → PdfSharpCore | ✅ | QuestPDF removed; `PdfSharpCore 1.3.67` added to `TravelPort.Infrastructure.csproj`; `InvoiceDocumentService` fully rewritten using `XGraphics` imperative drawing API |
| 6.12 | Flight PDF — A4, rewritten with PdfSharpCore | ✅ | Header, booking ref bar, flight route card, passenger table, baggage table, cancellation/date-change charges, fare summary, support footer — all on A4 |
| 6.13 | Hotel PDF — `GenerateHotelInvoicePdf` with PdfSharpCore | ✅ | Property card, stay card (check-in/out/nights/guests), guest details table, price summary with GST, hotel policies, support footer |
| 6.14 | `IInvoiceDocumentService` — hotel invoice method | ✅ | `GenerateHotelInvoicePdf(BookingDto)` added to interface |
| 6.15 | `BookingService.GetInvoiceAsync` — routes by booking type | ✅ | Hotel bookings use `GenerateHotelInvoicePdf`; flight bookings use `GenerateBookingTicketPdf` |
| 6.16 | DataSeeder — stable flight seeding | ✅ | `SeedFlightsAsync` returns early if flights exist; preserves flight IDs so user flight bookings survive restarts |
| 6.17 | DataSeeder — stable John's bookings | ✅ | `SeedBookingsAsync` skips if John already has bookings; real user bookings no longer wiped on restart |
| 6.18 | DataSeeder — 6 new coupons | ✅ | FLYSAVER (Rs.300 off), FLYOFF200 (Rs.200 off), FLYDEAL15 (15%), HOTELOFF15 (15%), STAYMORE (Rs.500 off), HOTELDEAL (10%) |
| 6.19 | `BookingsPage` — numbered pagination | ✅ | Replaced "Load More" with Prev / page numbers / Next; ellipsis for large page counts; scrolls to top on page change |
| 6.20 | `BookingsPage` — sorted by latest first | ✅ | Backend `OrderByDescending(b => b.CreatedAt)` already in place; confirmed working |
| 6.21 | `BookingCard` — cancel & invoice download actions | ✅ | Cancel button triggers API + local state update; Download Invoice fetches PDF blob |
| 6.22 | `BookHotelPage` — guest details form | ✅ | Guest name / email / phone fields sent to booking API |
| 6.23 | `BookHotelPage` — real coupon API validation | ✅ | Replaced hardcoded coupon logic with `POST /api/v1/coupons/validate`; shows discount amount |
| 6.24 | `BookHotelPage` — 3 hotel coupon offer cards | ✅ | HOTELOFF15, STAYMORE, HOTELDEAL — click-to-apply |
| 6.25 | `BookFlightPage` — 3 flight coupon offer cards | ✅ | FLYSAVER, FLYOFF200, FLYDEAL15 replace static "DEALPANTI" card; click-to-apply |
| 6.26 | `BookingDetailPage` — coupon code in discount label | ✅ | Shows `Coupon (FLYSAVER)` instead of plain "Discount" |
| 6.27 | `HotelBookingConfirmPage` — new page | ✅ | Hotel booking confirmation with nights count, price summary, guest info, status |
| 6.28 | `AppRouter` — `/hotel-booking-confirm` route | ✅ | Lazy-loaded, private route |
| 6.29 | `AirportSearch` — popular cities on empty focus | ✅ | Shows top 8 airports with "Popular Cities" header when input is focused and empty |
| 6.30 | `AirportSearch` — "No airports found" fallback | ✅ | Shown when search query has no matches |
| 6.31 | `FlightsPage` — fix `overflow-hidden` clipping dropdowns | ✅ | Removed `overflow-hidden` from form container; `TravellerSelector` popup and `AirportSearch` dropdown now display correctly |
| 6.32 | `FlightsPage` — city name lookup from URL params | ✅ | `originCity`/`destinationCity` initialized from `AIRPORTS` data; display shows `Mumbai (BOM)` instead of `BOM (BOM)` |

---

---

## Phase 7 — Admin Dashboard, Bug Fixes & Email Overhaul
**Branch:** `feature/admin-dashboard-bugfixes`
**Date:** 2026-05-12
**Scope:** Full admin panel, enum serialization fix, wallet refund fix, email HTML compatibility, reset password UX polish, themed ConfirmDialog

| # | Feature | Status | Notes |
|---|---|---|---|
| 7.1 | `JsonStringEnumConverter` added to `Program.cs` | ✅ | All enums now serialize as strings (e.g. `"Confirmed"` not `1`); fixes cancel button not showing |
| 7.2 | `BookingStatus.Refunded` renamed to `Completed` | ✅ | Matches frontend `'Completed'` type; no migration needed (integer values unchanged) |
| 7.3 | `BookingService.CancelAsync` — wallet refund wired | ✅ | Was calculating refund amount but never calling `_wallet.RefundAsync`; fixed; email no longer lies |
| 7.4 | `SmtpEmailService` — full HTML email rewrite | ✅ | All `linear-gradient`, `rgba()`, `opacity`, `display:flex/inline-block` replaced with email-client-safe `background-color`, table layouts, table-based CTA buttons |
| 7.5 | `SmtpEmailService` — password reset email | ✅ | Shows clickable button + copy-paste fallback link; visible in Gmail/Outlook |
| 7.6 | `ConfirmDialog` component (`frontend/src/components/ui/ConfirmDialog.tsx`) | ✅ | Branded modal replaces native `confirm()`; supports `danger`/`warning` variants, loading state, Escape + backdrop dismiss |
| 7.7 | `tailwind.config.js` — `animate-fade-in` keyframe | ✅ | Scale + translateY entrance for ConfirmDialog |
| 7.8 | `BookingCard` — cancel flow uses ConfirmDialog | ✅ | `handleCancelClick` shows dialog; `handleConfirmCancel` calls API; `statusVariant` updated for `Completed` |
| 7.9 | `BookingDetailPage` — cancel uses ConfirmDialog | ✅ | Replaces native `confirm()` on the detail page cancel button |
| 7.10 | `ResetPasswordPage` — password hint & error fix | ✅ | Hint now mentions special chars; error shows actual server validation message; "1 hour" TTL text |
| 7.11 | `ForgotPasswordPage` — TTL text fix | ✅ | "30 minutes" → "1 hour" to match backend `IMemoryCache` TTL |
| 7.12 | Admin DTOs — 4 new files | ✅ | `AdminDashboardDto`, `AdminUserDto`, `CouponDto`/`CreateCouponRequest`/`UpdateCouponRequest`, `AdminAnalyticsDto` |
| 7.13 | `IUserRepository.GetPagedAsync` | ✅ | Paged + search by name/email, ordered by `CreatedAt` desc |
| 7.14 | `IBookingRepository.GetAllPagedAsync` + `GetAllForAnalyticsAsync` | ✅ | Status/type filter, date-range analytics query |
| 7.15 | `ICouponRepository.GetAllCouponsAsync` + `CodeExistsAsync` | ✅ | Ordered by `CreatedAt` desc; uniqueness check for create |
| 7.16 | `IAdminService` + `AdminService` | ✅ | 9-method service: dashboard, analytics, users (paged+search), block/unblock, bookings (paged+filter), coupons CRUD |
| 7.17 | `AdminController` — replaced placeholder with real endpoints | ✅ | 9 endpoints under `/api/v1/admin`, all `[Authorize(Roles = "Admin")]` |
| 7.18 | `AdminService` registered in DI | ✅ | `services.AddScoped<IAdminService, AdminService>()` in `DependencyInjection.cs` |
| 7.19 | `frontend/src/types/index.ts` — admin types added | ✅ | `AdminDashboardDto`, `AdminUserDto`, `CouponDto`, `CreateCouponRequest`, `UpdateCouponRequest`, `AdminAnalyticsDto` + related sub-types |
| 7.20 | `endpoints.ts` — admin section updated | ✅ | Added `analytics` endpoint and `coupon(id)` factory for PUT/DELETE |
| 7.21 | `adminService.ts` (new) | ✅ | 9 typed methods wrapping all admin API calls |
| 7.22 | `AdminPage.tsx` — full 4-tab dashboard | ✅ | Dashboard (stat cards + bar chart + type/status breakdown), Users (search + block/unblock), Bookings (status+type filter, paginated), Coupons (create/edit/deactivate with `CouponModal`) |
| 7.23 | `CouponModal` — inline create/edit modal | ✅ | All coupon fields with validation; code forced uppercase; disabled on edit |
| 7.24 | `AdminPage` — `ConfirmDialog` for block/deactivate | ✅ | Confirm before blocking user or deactivating coupon; danger/warning variants |
| 7.25 | `AdminPage` — skeleton loading rows | ✅ | Animated pulse placeholders during API calls |

---

## Phase 8 — Docker & CI/CD Pipeline
**Branch:** `feature/phase8-docker-cicd`
**Date:** 2026-05-12
**Scope:** Full containerisation (SQL Server + .NET API + React/Nginx) and GitHub Actions CI/CD deploy pipeline

| # | Feature | Status | Notes |
|---|---|---|---|
| 8.1 | `backend/Dockerfile` — multi-stage SDK→runtime build | ✅ | Non-root `appuser`, `ASPNETCORE_URLS=http://+:5000`, Release publish |
| 8.2 | `backend/.dockerignore` | ✅ | Excludes bin/obj/logs/appsettings.Development.json |
| 8.3 | `frontend/Dockerfile` — multi-stage Node→Nginx build | ✅ | `VITE_API_BASE_URL=""` build arg → relative `/api/v1` base URL in production |
| 8.4 | `frontend/nginx.conf` — SPA routing + API proxy | ✅ | `try_files → index.html`, `/api/` → `http://api:5000`, gzip, security headers, asset cache |
| 8.5 | `frontend/.dockerignore` | ✅ | Excludes node_modules/dist/.env files |
| 8.6 | `docker-compose.yml` | ✅ | SQL Server (healthcheck) → API (waits healthy) → Web; all config via env vars; `sqldata` volume |
| 8.7 | `.env.example` | ✅ | Documents all 16 required env vars with example values |
| 8.8 | `.github/workflows/deploy.yml` — 3-job pipeline | ✅ | build (every push+PR) → docker push to ghcr.io → SSH deploy with `environment: production` |
| 8.9 | GHA — Docker layer cache via `cache-from/to: type=gha` | ✅ | Separate scopes for api and web; significantly speeds up rebuilds |
| 8.10 | GHA — `concurrency` group cancels in-flight runs | ✅ | Prevents duplicate deploys on rapid pushes |
| 8.11 | GHA — `.env` written from secrets at deploy time | ✅ | No secrets stored on server between deploys |
| 8.12 | `Program.cs` — `db.Database.Migrate()` on startup | ✅ | Idempotent; replaces manual `dotnet ef database update` in containers |
| 8.13 | `Program.cs` — Swagger enabled in all environments | ✅ | Accessible at `/swagger` in Docker for API testing |
| 8.14 | `appsettings.json` — localhost origins for Docker | ✅ | `http/https://localhost` added; production domain via `AllowedOrigins__0/1` env var |
| 8.15 | `vite.config.ts` — fix dev proxy to HTTP :5000 | ✅ | Was pointing to HTTPS :7001; local dev now correctly proxies to HTTP API port |
| 8.16 | `docs/DEPLOYMENT.md` | ✅ | Architecture diagram, local Docker run, server setup, GitHub Secrets table, rollback, backup, troubleshooting |
| 8.17 | `HotelsPage` — filter logic fix (star=exact, amenities OR) | ✅ | Filter sidebar hidden during loading; useMemo removed |
| 8.18 | `FlightsPage` — city name resolved from AIRPORTS on mount | ✅ | Shows "Mumbai" not "BOM" when landing from URL params |
| 8.19 | `HomePage` — multi-city trip type removed | ✅ | Unimplemented option removed from search form |

---

## Phase 9 — Wallet Feature, Payment UX Overhaul & Bug Fixes
**Branch:** `feature/wallet-payment-bugfixes`
**Date:** 2026-05-13
**Scope:** Wallet top-up persistence, saved credit cards, payment method selection at booking, payment page with UPI/Card/Net Banking, traveller details bug fixes, booking confirmation email fixes, E-ticket visibility control, My Bookings filters

| # | Feature | Status | Notes |
|---|---|---|---|
| 9.1 | `SavedCard` domain entity + EF migration `AddSavedCards` | ✅ | Stores last 4 digits only (never full card number); cascade delete from User |
| 9.2 | `SavedCard` CRUD API — `GET/POST/DELETE /users/cards` + `PUT /users/cards/{id}/default` | ✅ | `UsersController` 4 new endpoints; full DI wiring |
| 9.3 | `UserService` — `GetSavedCardsAsync`, `AddSavedCardAsync`, `DeleteSavedCardAsync`, `SetDefaultCardAsync` | ✅ | Only last 4 digits stored; default flag management |
| 9.4 | `AddCardModal` component — card visual preview, type auto-detection | ✅ | Detects Visa/Mastercard/Amex/RuPay from number; gradient card preview; CVV/expiry validation |
| 9.5 | `PaymentMethodSelector` component — wallet tile + saved cards + new card | ✅ | Wallet disabled if insufficient balance; shows saved card gradient tiles |
| 9.6 | `SavedCards` component on ProfilePage | ✅ | Gradient card visuals with Set Default / Remove actions; empty state |
| 9.7 | `BookFlightPage` — payment method selection (wallet / saved card / new card) | ✅ | `useWallet` and `savedCardId` passed to booking API |
| 9.8 | `BookHotelPage` — payment method selection (wallet / saved card / new card) | ✅ | Same pattern; routes to PaymentPage for new card |
| 9.9 | ProfilePage — recent wallet transactions display | ✅ | Last 5 transactions with Credit (green) / Debit (red) colours |
| 9.10 | Wallet top-up persists to DB | ✅ | `WalletDto` returns `walletId` + `recentTransactions`; frontend type updated |
| 9.11 | **Bug fix** — Wallet refund not saved after cancellation | ✅ | Root cause: `RefundAsync` does not call `SaveChangesAsync`; `BookingService.CancelAsync` now calls `_uow.SaveChangesAsync` after `RefundAsync` |
| 9.12 | **Bug fix** — Traveller name not shown on confirm page | ✅ | `BookingDetailPage.mergedBooking` now prioritises sessionStorage snapshot (`bookingUi.userName`) over API `booking.userName` (logged-in user) |
| 9.13 | **Bug fix** — Traveller name wrong in PDF e-ticket | ✅ | `BookFlightRequest` extended with `GuestName/Email/Phone`; `FlightService.BookAsync` stores them in `Booking.GuestName/Email/Phone`; `BookingDto.UserName` resolves `GuestName ?? user.Name` |
| 9.14 | **Bug fix** — Confirmation email sent to account email, not contact email | ✅ | `FlightService.BookAsync` uses `req.GuestEmail ?? user.Email`; cancellation email also updated for both flight and hotel |
| 9.15 | **Bug fix** — PNR not in flight confirmation email | ✅ | Added `PNR / Booking Reference` row to Traveller Details table in `SmtpEmailService.SendFlightBookingConfirmationAsync` |
| 9.16 | **Bug fix** — Download E-Ticket shown for cancelled bookings | ✅ | All three download entry-points (header button, green bar CTA, sidebar button) gated with `status !== 'Cancelled'` in `BookingDetailPage` |
| 9.17 | My Bookings page — status filter (All / Confirmed / Cancelled) | ✅ | Pill-style filter group; client-side filter on loaded results |
| 9.18 | My Bookings page — type filter (All / Flight / Hotel) | ✅ | Second pill-style filter group; combined with status filter |
| 9.19 | My Bookings page — "Clear filters" link | ✅ | Resets both filters; shown only when a filter is active |
| 9.20 | PaymentPage — Card tab with live card preview | ✅ | Number / name / expiry mirrored on gradient card visual; format-as-you-type helpers |
| 9.21 | PaymentPage — UPI tab with QR code + UPI ID input | ✅ | SVG QR graphic + `name@upi` input; 20-second circular countdown on submit, completes at 5 s |
| 9.22 | PaymentPage — Net Banking tab with bank dropdown | ✅ | 10 major Indian banks; Customer ID field; 20-second countdown on submit |
| 9.23 | PaymentPage — processing overlay with circular progress ring | ✅ | Animated SVG `stroke-dashoffset` countdown ring; different messages for UPI vs Net Banking |

---

## Phase 10 — CI/CD Registry Migration & Docker Desktop Local Run
**Branch:** `fix/ci-remove-ssh-deploy`
**Date:** 2026-05-13
**Scope:** Migrate image registry from GHCR to Docker Hub; replace SSH server deploy with local Docker Desktop workflow

| # | Feature | Status | Notes |
|---|---|---|---|
| 10.1 | Migrate CI registry from `ghcr.io` → Docker Hub (`docker.io`) | ✅ | `deploy.yml` Job 2 now logs in with `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` secrets |
| 10.2 | Remove SSH server deploy job (Job 3) | ✅ | `appleboy/scp-action` and `appleboy/ssh-action` steps removed; no `SERVER_SSH_KEY` required |
| 10.3 | Add Docker Hub image verify job (new Job 3) | ✅ | Pulls both images after push to confirm accessibility; prints local pull instructions |
| 10.4 | `docker-compose.yml` — update image refs from `ghcr.io` to Docker Hub | ✅ | Both `api` and `web` services now use `${DOCKERHUB_USERNAME}/travelport-api/web:${IMAGE_TAG:-latest}` |
| 10.5 | `.env.example` — replace `GITHUB_REPOSITORY_LOWER` with `DOCKERHUB_USERNAME` | ✅ | Aligns with new docker-compose image references |
| 10.6 | `docs/DEPLOYMENT.md` — reflect Docker Hub pipeline & local Docker Desktop run | ✅ | CI/CD jobs table updated; server setup section replaced with local pull instructions; rollback & troubleshooting updated |
| 10.7 | `README.md` — update CI/CD table to Docker Hub | ✅ | Registry, deploy method, and local run instructions updated |

---

## Upcoming / Planned

| # | Feature | Priority | Phase |
|---|---|---|---|
| 11.1 | Mobile filter drawer (slide-over) for FlightsPage | 🔴 High | Phase 11 |
| 11.2 | Bus / Train / Cab booking — persistence + API | 🔴 High | Phase 11 |
| 11.3 | Email verification flow (OTP) | 🟡 Medium | Phase 11 |
| 11.4 | HTTPS with Let's Encrypt (Nginx + Certbot sidecar) | 🟡 Medium | Phase 11 |
| 11.5 | Unit tests for FlightService, HotelService, WalletService | 🟢 Low | Phase 11 |
| 11.6 | Redis cache (replace in-memory IMemoryCache) | 🟢 Low | Phase 11 |
| 11.7 | Real Razorpay webhook handler for production | 🟢 Low | Phase 11 |

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
| Total phases completed | 10 |
| Total features delivered | 200+ |
| Flights in seed DB | 900+ (dynamic demand-based pricing) |
| Hotels in seed DB | 60+ (12 cities) |
| Coupons | 11 (5 original + 6 new: FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL) |
| API endpoints | 53+ |
| Frontend pages | 15 |
| Airlines covered | 7 |
| Routes covered | 42 bidirectional |
| External API integrations | 3 (Duffel, Razorpay, SMTP/Office365) |
| PDF invoices | 2 types (Flight e-ticket A4, Hotel invoice A4) |
| Email events covered | 3 (booking confirmed, booking cancelled, password reset) |
| Payment methods | 3 (Credit/Debit Card, UPI with QR, Net Banking) |
| Wallet features | Top-up, deduction at booking, 90% refund on cancellation (auto-credited) |
