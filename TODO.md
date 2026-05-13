# TODO.md — TravelPort Backlog

> Status legend: 🔴 High priority · 🟡 Medium · 🟢 Low · ✅ Done · ❌ Won't do

---

## Active / In-Progress

| # | Item | Priority | Notes |
|---|---|---|---|
| 1 | Test all flight filter combinations end-to-end | 🔴 | Especially combined stop + airline + time filters |
| 2 | Verify TravellerSelector popup closes correctly on mobile | 🟡 | `overflow-hidden` fix applied; test touch events |
| 3 | Verify SMTP email delivery end-to-end | 🟡 | Office365 configured; `FromEmail` must match `Username` |
| 4 | Wire Razorpay live key for Card payment in production | 🟡 | Card/UPI/NetBanking pages currently use mock API; real Razorpay needs live key in appsettings |

---

## Backend

### Bugs
- [x] ✅ **Coupon discount not applied to `FinalAmount`** — Fixed: `ICouponRepository` + `CouponRepository` added; discount wired in both `FlightService.BookAsync` and `HotelService.BookAsync`.
- [x] ✅ **DataSeeder always drops flight-linked bookings on restart** — Fixed: `SeedFlightsAsync` now returns early if flights exist; `SeedBookingsAsync` skips if John has bookings. User flight/hotel bookings survive restarts.
- [x] ✅ **Background workers crash API on shutdown** — Fixed: `OperationCanceledException` from `Task.Delay` now caught at outer loop level in both `BookingExpiryWorker` and `RefreshTokenCleanupWorker`.
- [x] ✅ **SMTP `FromEmail` mismatch** — Fixed: `FromEmail` now matches SMTP `Username` (Office365 rejects mismatched sender).
- [x] ✅ **`TravellerSelector` popup not opening** — Fixed: removed `overflow-hidden` from the search form container that was clipping absolute-positioned dropdowns.
- [x] ✅ **`AirportSearch` shows nothing on focus** — Fixed: shows top 8 popular cities when the input is focused and empty.
- [x] ✅ **Flight bookings disappear on restart** — Fixed: stable seeder preserves flight IDs and existing user bookings.
- [ ] 🟡 **Wallet deduction happens before booking confirmation** — if `_bookings.AddAsync` fails after `_wallet.DeductAsync`, the balance is permanently deducted. Wrap in a transaction or use compensating action.
- [ ] 🟡 **Flight seat decrement race condition** — two concurrent `BookAsync` calls for the same flight can both pass the seat check before either decrements. Add optimistic concurrency or row-level lock.


### Features Pending
- [ ] 🔴 **Multi-city flight search** — `FlightSearchRequest` supports origin/destination only. Add `MultiCity` trip type.
- [ ] 🔴 **Bus & Train booking persistence** — buses and trains are mocked in-memory; they have no DB entity or booking endpoint. Add `Bus` and `Train` domain entities + booking flow.
- [ ] 🔴 **Cab booking persistence** — same as buses/trains.
- [ ] 🟡 **Email verification on registration** — OTP flow documented but `IsVerified` is set to `true` in seed; registration sets it `false` with no verification path yet.
- [x] ✅ **Admin analytics endpoint** — `GET /admin/analytics` now returns real monthly revenue, bookings-by-type and bookings-by-status aggregations.
- [ ] 🟡 **Server-side paginated flight search response** — frontend now paginates filtered results locally; move pagination and filter metadata fully into the API response for larger datasets.
- [x] ✅ **Persist individual flight traveller details** — `BookFlightRequest` now includes `GuestName/Email/Phone`; stored in `Booking` entity; PDF and email use correct traveller name.
- [ ] 🟢 **Real Razorpay webhook handler** — for production, handle `payment.failed` and `order.paid` webhooks to update booking status asynchronously.
- [x] ✅ **Rate limiting** — fixed: API rate-limiting middleware is active in `Program.cs`.
- [ ] 🟢 **Refresh token rotation** — currently refresh tokens are single-use but rotation isn't enforced; expired tokens should be revoked from DB.

### Technical Debt
- [ ] 🟡 **`RazorpayService._logger` warning** — `_logger` field is declared but never used. Either inject and use `ILogger`, or remove the field.
- [ ] 🟡 **`FlightService.ExtractAmadeusPrice`** — Amadeus support was replaced by Duffel but the extraction helper and fallback code path still exist. Clean up once Amadeus is fully retired.
- [ ] 🟡 **Expand unit coverage beyond validators/helpers** — add tests for core services (`FlightService`, `HotelService`, `WalletService`) and richer booking scenarios.
- [ ] 🟢 **Add integration tests** — the repository now has a test project and commit/CI gate, but auth and booking flows still need end-to-end API coverage.

---

## Frontend

### Bugs
- [x] ✅ **Login redirect** — Fixed: post-login now restores `location.state.from` so users return to their intended page.
- [x] ✅ **endpoints.ts duplicate property keys** — Fixed: removed duplicate keys from `users` object.
- [x] ✅ **FlightsPage TypeScript errors** — Fixed: zero TS errors; removed dead components, fixed duplicate state, wired FilterSidebar + SortTabs.
- [x] ✅ **PaymentPage broken imports** — Fixed: all imports corrected, Razorpay typed.
- [x] ✅ **Search hero `overflow-hidden` clips dropdowns** — Fixed: `TravellerSelector` popup and `AirportSearch` dropdown now open correctly.
- [x] ✅ **`AirportSearch` empty focus shows nothing** — Fixed: popular cities shown on focus; city name pre-populated from URL params (`Mumbai (BOM)` instead of `BOM (BOM)`).
- [x] Search hero UI consistency across Flights/Hotels — Fixed.
- [ ] 🔴 **Mobile filter sidebar hidden** — `hidden lg:block`; no access on mobile. Add slide-over drawer.
- [ ] 🟡 **Calendar popup z-index on mobile** — may render behind search bar on small screens.
- [ ] 🟡 **Date bar adjacent-date fetches fire on every render** — incomplete `useEffect` deps; debounce or ref-guard needed.

### Features Pending
- [x] ✅ **HomePage buses/trains/cabs search** — Added full search forms for each mode; replaced "Coming soon" block; each form navigates with URL params and auto-triggers search.
- [x] ✅ **Recent searches** — clickable chips navigate to saved results; ✕ button removes entry.
- [ ] 🔴 **Mobile-responsive filter drawer** — slide-over panel for filters on screens < 1024px.
- [x] ✅ **Hotel search filter sidebar** — HotelsPage FilterSidebar implemented: star rating (exact match), price range, amenities (OR logic), popular filters (OR logic).
- [ ] 🟡 **Trains page booking flow** — TrainsPage shows results but the BOOK button is not wired to a booking endpoint (no train booking API yet).
- [ ] 🟡 **Buses page booking flow** — same as trains.
- [ ] 🟡 **Cabs page booking flow** — same as trains.
- [x] ✅ **Profile page improvements** — upgraded with account overview, wallet feedback, safer delete confirmation, and better status handling.
- [x] ✅ **Saved travellers management** — profile UI now supports add/delete flows with inline form validation and confirmation.
- [x] ✅ **Admin panel UI** — full 4-tab dashboard (Dashboard, Users, Bookings, Coupons) with real API integration; `CouponModal`, block/unblock users, `ConfirmDialog` for destructive actions.
- [x] ✅ **Error boundary** — route-level React error boundary added with recovery UI.
- [x] ✅ **Toast notifications** — shared success/error/info toasts added for profile and payment-card flows.
- [x] ✅ **Skeleton loaders for Hotels, Buses, Trains, Cabs** — shared non-flight skeleton components now cover transport search pages, while hotels already used dedicated skeleton cards.
- [ ] 🟢 **Dark mode** — Tailwind config supports it; no dark-mode classes applied.
- [ ] 🟢 **PWA / offline support** — Vite PWA plugin not configured.

---

## Infrastructure / DevOps

- [x] ✅ **Dockerfile for API + Frontend** — multi-stage Dockerfiles for both; Nginx serves React SPA + proxies `/api` to backend.
- [x] ✅ **CI/CD pipeline** — GitHub Actions 3-job workflow: build → owner approval gate → Docker push to Docker Hub → image verify; `environment: production` requires manual approval before any image is pushed.
- [x] ✅ **docker-compose.yml** — orchestrates SQL Server 2022 + .NET API + Nginx/React; healthcheck gates API start; images pulled from Docker Hub via `DOCKERHUB_USERNAME` env var.
- [x] ✅ **Auto EF migrations on startup** — `db.Database.Migrate()` in `Program.cs`; no manual `dotnet ef` needed in containers.
- [ ] 🟡 **HTTPS with Let's Encrypt** — add Certbot sidecar to docker-compose for automatic SSL certificate management.
- [ ] 🟢 **Redis for caching** — replace in-memory `IMemoryCache` with Redis for multi-instance support.
- [ ] 🟢 **Database backup automation** — scheduled `sqlcmd BACKUP DATABASE` inside the container.

---

## Recently Completed ✅

- [x] **Wallet refund persistence fix** — `BookingService.CancelAsync` was missing `_uow.SaveChangesAsync` after `RefundAsync`; wallet balance now correctly persists after cancellation
- [x] **Saved credit cards** — `SavedCard` entity + EF migration; `GET/POST/DELETE /users/cards` + set-default endpoint; last 4 digits only stored; gradient card UI in profile
- [x] **Payment method at booking** — `PaymentMethodSelector` component; wallet / saved card / new card choice on `BookFlightPage` + `BookHotelPage`
- [x] **Payment page overhaul** — Card (live preview), UPI (QR + 20s countdown), Net Banking (bank picker + countdown); circular SVG progress ring during processing
- [x] **Traveller name in PDF/email** — `BookFlightRequest.GuestName/Email/Phone` stored on `Booking`; PDF now shows booked-for name, not account name; email goes to contact email
- [x] **PNR in flight confirmation email** — `PNR / Booking Reference` row added to Traveller Details section of SMTP email template
- [x] **Hide E-ticket button when cancelled** — all three download entry-points in `BookingDetailPage` gated with `status !== 'Cancelled'`
- [x] **My Bookings filters** — Status (All/Confirmed/Cancelled) + Type (All/Flight/Hotel) pill filters with Clear link
- [x] **Enum serialization fix** — `JsonStringEnumConverter` added; `BookingStatus` now serializes as `"Confirmed"` not `1`; cancel button now visible
- [x] **Wallet refund on cancellation** — `BookingService.CancelAsync` now calls `_wallet.RefundAsync`; amount actually credited
- [x] **Email HTML compatibility** — complete rewrite of `SmtpEmailService`; all emails now render correctly in Gmail and Outlook (solid colors, table layouts, table-based buttons)
- [x] **Password reset UX fixes** — correct TTL text (1 hour), special-char requirement in hint, actual server error shown on validation failure
- [x] **`ConfirmDialog` component** — themed modal replacing native `confirm()`; danger/warning variants, loading state, keyboard-accessible
- [x] **Full admin dashboard** — 4-tab React page (Dashboard stats + charts, Users with block/unblock, Bookings with filters, Coupons CRUD); `IAdminService` / `AdminService` Clean Architecture implementation; `AdminController` with 9 real endpoints
- [x] Duffel API integration (external flight provider, sandboxed)
- [x] Disable Duffel, switch to rich DB seed data (900+ flights, 60+ hotels, 12 cities)
- [x] BusSearchProvider — route-specific durations, 14 operators, realistic pricing
- [x] TrainSearchProvider — 39 named trains, route-specific durations, distance-based pricing
- [x] Goibibo-style FlightsPage — Popular Filters, date bar with prices, calendar picker, sort tabs, fare type
- [x] FlightCard redesign — airline color badge, VIEW FARES button, Goibibo layout
- [x] Buses, Trains, Cabs frontend pages
- [x] PaymentPage with Razorpay checkout and mock fallback
- [x] Forgot password / Reset password flow with expiring email link
- [x] Goibibo-style flight fare popup with fare-family booking flow and traveller details UI
- [x] Goibibo-style booking detail page with downloadable PDF e-ticket
- [x] Home page recent searches saved with click-through navigation
- [x] CLAUDE.md, GIT.md, TODO.md, TASK-TRACKER.md created
- [x] Hotel booking with guest details (GuestName/Email/Phone on Booking entity + migration)
- [x] FL/HT prefixed booking references (FL2026XXXXXX, HT2026XXXXXX)
- [x] SMTP email for all booking events (confirmed, cancelled, password reset) — Office365 support
- [x] Flight PDF redesigned for A4 — compact layout, no overflow
- [x] Hotel PDF invoice — property details, stay dates, price summary with GST, policies
- [x] BookingsPage numbered pagination (Prev / page numbers / Next)
- [x] Stable DataSeeder — flight bookings and user bookings survive restarts
- [x] 6 new coupons — FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL
- [x] AirportSearch — popular cities on focus; city name pre-populated from URL params
- [x] TravellerSelector — fixed popup clipping caused by `overflow-hidden` on form container
- [x] Background workers — graceful shutdown (no more crash on API stop)
- [x] **Enum serialization fix** — `JsonStringEnumConverter`; status shows as `"Confirmed"` not `1`; cancel button now visible
- [x] **Wallet refund on cancellation** — `BookingService.CancelAsync` now credits wallet on cancellation
- [x] **Email HTML rewrite** — all emails render correctly in Gmail/Outlook (table layouts, solid colors, table-based buttons)
- [x] **ConfirmDialog** — themed modal replaces native `confirm()` on BookingCard and BookingDetailPage
- [x] **Full admin dashboard** — 4-tab React page with real API; `IAdminService`/`AdminService` Clean Architecture; `AdminController` with 9 real endpoints
- [x] **Hotel filter sidebar** — star rating (exact match), price, amenities + popular filters (OR logic)
- [x] **FlightsPage city names** — city resolved from AIRPORTS on mount so URL params show "Mumbai" not "BOM"
- [x] **Docker containerisation** — multi-stage Dockerfiles, Nginx reverse proxy, docker-compose with SQL Server
- [x] **GitHub Actions CI/CD** — build+verify → Docker push to ghcr.io → SSH deploy on merge to Development
