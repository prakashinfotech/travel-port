# TASK-TRACKER.md — TravelPort Feature Delivery Log

> Day-by-day progress tracker for the Goibibo AI Assignment.
> Status: ✅ Done · 🚧 In Progress · ❌ Not Started · ⚠️ Partial / Needs Work

---

## Phase 1 — AI-Powered Features (Claude Integration)
**Branch:** `feat/phase1-ai-features`
**Scope:** 5 AI-powered features using Claude API (claude-haiku-4-5-20251001) via a secure backend proxy.

| # | Feature | Status | Notes |
|---|---|---|---|
| 1.1 | AI Travel Assistant Chatbot — floating chat widget on every page | ✅ | `AiChatWidget.tsx` in Layout; streaming SSE via `/api/v1/ai/chat`; welcome message + 4 suggested prompts |
| 1.2 | Natural Language Search — AI search bar on Homepage | ✅ | `NaturalLanguageSearch.tsx` above mode tabs; Claude parses intent → redirects to correct search page with params |
| 1.3 | Smart Destination Recommendations — AI section on HomePage | ✅ | `AiRecommendations.tsx`; 4 personalised destinations from Claude; refresh button |
| 1.4 | AI Trip Planner — `/ai-planner` page | ✅ | `AiPlannerPage.tsx`; streaming itinerary with `[BOOK_FLIGHT:...]` and `[BOOK_HOTEL:...]` deep-link buttons |
| 1.5 | Price Trend Insights — one-line AI tip on FlightsPage | ✅ | `PriceTrendInsight.tsx`; shown above results after search; cached 30 min server-side |
| 1.6 | Backend proxy — `AiController.cs` | ✅ | `/ai/chat`, `/ai/nl-search`, `/ai/recommendations`, `/ai/trip-plan`, `/ai/price-insight`; API key stays server-side |
| 1.7 | AI Planner nav link | ✅ | "AI Trip Planner" with ✨ icon + "New" badge in user dropdown |
| 1.8 | Configuration | ✅ | `Claude:ApiKey` + `Claude:Model` in appsettings.json; real key goes in appsettings.Development.json |

---

## Bug Fix — HotelDetailPage React Hooks Violation
**Branch:** `fix/hotel-detail-hooks`
**Scope:** React Rules of Hooks violation in `HotelDetailPage.tsx` caused crash when hotel data loaded successfully.

| # | Fix | Status | Notes |
|---|---|---|---|
| B1 | Move `galleryImgs`, `prevImg` (useCallback), `nextImg` (useCallback) before early returns | ✅ | Prevented "Rendered more hooks than during previous render" crash |
| B2 | Add `setLoading(true)` + `setError(null)` reset at start of `useEffect` | ✅ | Ensures clean state on re-navigation |
| B3 | Use `hotel?.images` / `hotel?.imageUrl` optional chaining before hotel is confirmed non-null | ✅ | TypeScript-safe unconditional hook args |
| B4 | Confirmed backend GET /hotels/{id} returns data correctly (API tested live) | ✅ | Not a backend bug |

---

## Phase 3 — UX Enhancements (Comparison, Deals, Notifications, Price Alerts, Dark Mode)
**Branch:** `feat/phase3-ux-enhancements`
**Scope:** 6 cross-cutting UX features layered on top of the existing booking flow without changing it.

| # | Feature | Status | Notes |
|---|---|---|---|
| 3.1 | Booking Status Timeline — visual 4-step timeline in BookingDetailPage | ✅ | Booked → Payment Confirmed → Confirmed → Completed; Cancelled greyed out |
| 3.2 | BookingTimeline component — dot states (done/active/greyed), connector lines, +1 cancelled pill | ✅ | BookingDetailPage.tsx |
| 3.3 | Flight Comparison — up to 3 flight cards with compare checkbox | ✅ | FlightsPage.tsx — CompareBar (sticky bottom) + CompareModal (side-by-side 9-row table) |
| 3.4 | Offer/Deal Banner System — `IsFeatured` bool on Coupon entity | ✅ | 4 coupons seeded as featured; GET /coupons/featured endpoint |
| 3.5 | DealsSection on HomePage — gradient cards, copy-code button, days-left badge | ✅ | HomePage.tsx |
| 3.6 | Admin IsFeatured toggle — "⭐ Featured on homepage" checkbox in CouponModal | ✅ | AdminPage.tsx |
| 3.7 | Notifications Center — `Notification` entity + 4 DB endpoints | ✅ | Domain/Entities/Notification.cs; NotificationsController; INotificationService |
| 3.8 | Notification bell in Navbar — polling, unread badge, mark-read | ✅ | Navbar.tsx — 30s poll, max-h-80 dropdown, emoji icons per type |
| 3.9 | Auto-notifications on booking confirmed/cancelled | ✅ | FlightService + BookingService — optional INotificationService injection |
| 3.10 | Price Alert / Fare Watch — `PriceAlert` entity + 3 endpoints | ✅ | PriceAlertsController; GET/POST/DELETE /users/price-alerts |
| 3.11 | "Watch price" button on FlightCard | ✅ | PriceWatchButton component (auth-gated); Bell/Check icon; 3s feedback |
| 3.12 | Dark Mode — `darkMode: 'class'` Tailwind config | ✅ | tailwind.config.js |
| 3.13 | `useDarkMode` hook — localStorage persist, system-preference detection | ✅ | frontend/src/hooks/useDarkMode.ts |
| 3.14 | Dark mode toggle (Moon/Sun) in Navbar desktop + mobile | ✅ | Navbar.tsx |
| 3.15 | Dark classes on Layout, Footer, FlightCard, fare modal, notification dropdown | ✅ | dark: variants on all major surfaces |

---

## Phase 12 — Hotel Reviews, Bus Ticket Details, Flight Layover Support
**Branch:** `feature/bus-booking-confirmation-ticket-details`
**Scope:** Hotel guest reviews system, bus booking confirmation page with full ticket details, flight layover fields for 1-stop flights in operator portal.

| # | Feature | Status | Notes |
|---|---|---|---|
| 12.1 | `HotelReview` domain entity (HotelId, UserId, Rating, Comment) | ✅ | Domain/Entities/HotelReview.cs |
| 12.2 | `Hotel` entity — `ICollection<HotelReview> Reviews` navigation added | ✅ | |
| 12.3 | `HotelReviewConfiguration` — EF mapping + FK constraints + index | ✅ | Persistence/Configurations/HotelReviewConfiguration.cs |
| 12.4 | `TravelPortDbContext` — `HotelReviews` DbSet added | ✅ | |
| 12.5 | EF Core migration `AddHotelReviewsTable` | ✅ | |
| 12.6 | `HotelReviewDto` + `CreateHotelReviewRequest` DTOs | ✅ | Application/DTOs/Hotels/HotelReviewDtos.cs |
| 12.7 | `HotelDto` — `Reviews?: HotelReviewDto[]` field added | ✅ | Full reviews array returned on GET /hotels/:id |
| 12.8 | `CreateHotelReviewRequestValidator` — rating 1–5, comment non-empty | ✅ | Application/Validators/Hotels/ |
| 12.9 | `IHotelService.CreateReviewAsync` interface method | ✅ | |
| 12.10 | `HotelService.CreateReviewAsync` — validates completed stay, enforces one-review-per-user, updates ReviewScore/ReviewCount atomically | ✅ | |
| 12.11 | `HotelService.ToDtoAsync` — fetches and embeds reviews with user names on GET by ID | ✅ | Replaces simple `ToDto` for single-hotel fetch |
| 12.12 | `HotelsController` — `POST /hotels/{id}/reviews` endpoint (201) | ✅ | Authenticated users only |
| 12.13 | `IAdminService.DeleteHotelReviewAsync` + `AdminService` implementation | ✅ | Hard-delete review; recalculates hotel score |
| 12.14 | `AdminController` — `DELETE /admin/hotels/reviews/{reviewId}` endpoint | ✅ | Admin only |
| 12.15 | `Flight` entity — `LayoverAirport: string?` + `LayoverDurationMinutes: int?` | ✅ | Domain/Entities/Flight.cs |
| 12.16 | `FlightConfiguration` — EF mapping for layover fields | ✅ | Persistence/Configurations/FlightConfiguration.cs |
| 12.17 | EF Core migration `AddFlightLayoverFields` | ✅ | |
| 12.18 | `FlightOperatorService` — `ValidateFlightRequest` helper (source≠dest, arrival>departure, stops 0/1, layover rules) | ✅ | Applied on Create and Update |
| 12.19 | `FlightOperatorService` — layover fields wired into Create/Update/ToFlightDto | ✅ | `LayoverAirport` stored uppercase |
| 12.20 | `BookingDto` — 5 new transport fields: `TransportSeatNumbers`, `TransportBusNumber`, `TransportDriverPhone`, `TransportBoardingPoint`, `TransportDroppingPoint` | ✅ | |
| 12.21 | `BookingService` — bus-specific snapshot fields mapped to BookingDto | ✅ | |
| 12.22 | `BusBookingConfirmPage.tsx` — dedicated bus booking confirmation page | ✅ | Route: `/bookings/bus/:id`; shows operator, route, seat, bus number, boarding/dropping points, driver phone, fare summary, PDF download |
| 12.23 | `AppRouter.tsx` — `/bookings/bus/:id` route added | ✅ | |
| 12.24 | `HotelDetailPage.tsx` — hotel reviews section with star selector, submit form, review list, admin delete button | ✅ | Shows per-user review state; prevents duplicate review submission |
| 12.25 | `FlightOperatorFlightsPage.tsx` — layover airport + duration fields in Add/Edit flight form (shown when stops = 1) | ✅ | |
| 12.26 | Frontend types — `HotelReviewDto`, `CreateHotelReviewRequest`, `HotelDto.reviews`, `BookingDto` transport fields, `OperatorFlightDto/CreateFlightRequest/UpdateFlightRequest` layover fields | ✅ | frontend/src/types/index.ts |
| 12.27 | `endpoints.ts` — `hotels.reviews(id)` + `admin.deleteHotelReview(id)` | ✅ | |
| 12.28 | `hotelService.ts` — `createReview(hotelId, req)` method | ✅ | |
| 12.29 | `adminService.ts` — `deleteHotelReview(reviewId)` method | ✅ | |
| 12.30 | `HotelReviews.sql` — raw SQL reference file for HotelReviews table | ✅ | backend/src/Database/Tables/ |

---

## Phase 11 — Operator Portal (Flight / Bus / Cab)
**Branch:** `feat/operator-portal`
**Scope:** Full multi-role operator system — admin registers airline/bus/cab operators, operators log in to dedicated dashboards. Flight operators manage flights + view bookings; Bus/Cab operators view their booking stats.

| # | Feature | Status | Notes |
|---|---|---|---|
| 11.1 | `UserRole` enum extended — `FlightOperator=3`, `BusOperator=4`, `CabOperator=5` | ✅ | Domain/Enums/UserRole.cs |
| 11.2 | `FlightCompany`, `BusCompany`, `CabCompany` entities (BaseEntity soft-delete) | ✅ | New Domain/Entities files |
| 11.3 | `User.OperatorCompanyId: Guid?` FK added | ✅ | Links operator user to company |
| 11.4 | `Flight.FlightCompanyId` FK + navigation to `FlightCompany` | ✅ | Flight operator can own flights |
| 11.5 | Operator DTOs — registration, list, dashboard, flight CRUD, booking | ✅ | Application/DTOs/Operator/OperatorDtos.cs |
| 11.6 | `IAdminService` extended with 9 new operator methods | ✅ | Get/Register/Toggle for Flight/Bus/Cab |
| 11.7 | `AdminService` implements operator registration — creates company + user + emails credentials | ✅ | Follows hotel registration pattern |
| 11.8 | `IFlightOperatorService` + `FlightOperatorService` — full CRUD on flights + bookings | ✅ | Validates flight belongs to operator |
| 11.9 | `IBusOperatorService` + `BusOperatorService` — dashboard + bookings via TransportSnapshot | ✅ | Matches by OperatorName in JSON |
| 11.10 | `ICabOperatorService` + `CabOperatorService` — dashboard + bookings via TransportSnapshot | ✅ | Same pattern as Bus |
| 11.11 | `IFlightCompanyRepository`, `IBusCompanyRepository`, `ICabCompanyRepository` | ✅ | Application/Common/Interfaces |
| 11.12 | `FlightCompanyRepository`, `BusCompanyRepository`, `CabCompanyRepository` | ✅ | Persistence/Repositories |
| 11.13 | `FlightRepository` extended — `GetByCompanyAsync`, `GetAllAsync` (new) | ✅ | |
| 11.14 | `BookingRepository` extended — `GetBookingsByFlightIdsAsync`, `GetBookingsByOperatorNameAsync` | ✅ | |
| 11.15 | `UserRepository.GetOperatorManagerAsync` added | ✅ | Lookup user by OperatorCompanyId |
| 11.16 | Persistence DI — 3 new company repositories registered | ✅ | Persistence/DependencyInjection.cs |
| 11.17 | Application DI — 3 new operator services registered | ✅ | Application/DependencyInjection.cs |
| 11.18 | `JwtService` — adds `operatorCompanyId` claim to JWT for operator roles | ✅ | Infrastructure/Auth/JwtService.cs |
| 11.19 | `IEmailService.SendOperatorCredentialsEmailAsync` + SMTP implementation | ✅ | Color-coded email per operator type |
| 11.20 | `TravelPortDbContext` — 3 new DbSets + soft-delete filters + Flight→FlightCompany FK | ✅ | |
| 11.21 | EF Core migration `AddOperatorPortal` applied | ✅ | New tables: FlightCompanies, BusCompanies, CabCompanies |
| 11.22 | `AdminController` — 9 new endpoints (get/register/toggle per operator type) | ✅ | |
| 11.23 | `FlightOperatorController` — dashboard, flights CRUD, bookings (`[Authorize(Roles="FlightOperator")]`) | ✅ | |
| 11.24 | `BusOperatorController` — dashboard, bookings (`[Authorize(Roles="BusOperator")]`) | ✅ | |
| 11.25 | `CabOperatorController` — dashboard, bookings (`[Authorize(Roles="CabOperator")]`) | ✅ | |
| 11.26 | Frontend types — extended `UserToken` + all operator DTOs + request types | ✅ | frontend/src/types/index.ts |
| 11.27 | Frontend endpoints — operator admin endpoints + 3 operator portal endpoint groups | ✅ | frontend/src/api/endpoints.ts |
| 11.28 | `adminService.ts` — 9 new operator management methods | ✅ | |
| 11.29 | `operatorService.ts` — flightOperatorService, busOperatorService, cabOperatorService | ✅ | |
| 11.30 | `useAuth.ts` — isFlightOperator, isBusOperator, isCabOperator, isOperator helpers | ✅ | |
| 11.31 | `LoginForm.tsx` — auto-redirect operators to correct dashboard on login | ✅ | |
| 11.32 | `OperatorRoute.tsx` — role-based route guard for operator portals | ✅ | |
| 11.33 | `FlightOperatorLayout`, `BusOperatorLayout`, `CabOperatorLayout` sidebar layouts | ✅ | Blue / Green / Amber themes |
| 11.34 | `FlightOperatorDashboardPage` — 7 stat cards + performance summary | ✅ | |
| 11.35 | `FlightOperatorFlightsPage` — list + add/edit/delete form inline | ✅ | Full CRUD UI |
| 11.36 | `FlightOperatorBookingsPage` — searchable passenger bookings table | ✅ | |
| 11.37 | `BusOperatorDashboardPage` + `BusOperatorBookingsPage` | ✅ | |
| 11.38 | `CabOperatorDashboardPage` + `CabOperatorBookingsPage` | ✅ | |
| 11.39 | `AppRouter.tsx` — 3 new portal route groups added | ✅ | /flight-operator/*, /bus-operator/*, /cab-operator/* |
| 11.40 | `AdminPage.tsx` — "Operators" tab with Airlines/Bus/Cab sub-tabs + `RegisterOperatorModal` | ✅ | Full operator management in admin panel |

---

## Phase 10 — Round Trip Flights + Search UX Improvements
**Branch:** `Development`
**Scope:** Round trip flight selection UI, BookFlightPage dual-leg support, reactive transport filters, CitySearch on all search bars

| # | Feature | Status | Notes |
|---|---|---|---|
| 10.1 | `CitySearch` autocomplete replacing city `<select>` on BusesPage, TrainsPage, CabsPage | ✅ | focusColor themed per mode |
| 10.2 | Bus/Train/Cab sidebar filters now reactive via `useMemo` | ✅ | `rawBuses/rawTrains/rawCabs` split from computed display data |
| 10.3 | Round trip two-column flight selection on FlightsPage | ✅ | Departure left + return right; per-column sort headers |
| 10.4 | `RoundTripFlightRow` compact radio-select flight card | ✅ | Airline color, times, duration, price, radio |
| 10.5 | `RoundTripStickyBar` fixed bottom booking bar | ✅ | Dep + ret legs + total + FLAT OFF badge + BOOK NOW |
| 10.6 | Return flights fetched in parallel on search | ✅ | `fetchReturnFlights` useCallback |
| 10.7 | `BookFlightPage` dual-leg support | ✅ | Fetches both flights, books sequentially, shows two-leg UI |
| 10.8 | `handleRoundTripBook` with `returnFlightId` query param | ✅ | |

---

## Phase 9 — Bus / Train / Cab Booking Persistence
**Branch:** `Development`
**Scope:** Full end-to-end booking flow for Bus, Train, and Cab modes — matching flight/hotel depth

| # | Feature | Status | Notes |
|---|---|---|---|
| 9.1 | `BookingType.Cab = 4` added to domain enum | ✅ | `Bus=2, Train=3` already existed |
| 9.2 | `Booking.TransportSnapshot` JSON column added | ✅ | Nullable `nvarchar(max)` stores serialised operator/route/vehicle details |
| 9.3 | EF Core migration `AddTransportSnapshotToBooking` | ✅ | Applied to SQL Server; no schema breaking changes |
| 9.4 | `TransportSnapshot` record (Application/DTOs/Transport) | ✅ | Serialisation target for bus/train/cab booking details |
| 9.5 | `BookBusRequest`, `BookTrainRequest`, `BookCabRequest` DTOs | ✅ | With guest details, coupon, wallet, saved card fields |
| 9.6 | Provider interfaces moved to Application layer | ✅ | `IBusSearchProvider`, `ITrainSearchProvider`, `ICabSearchProvider` |
| 9.7 | Transport search DTOs moved to Application layer | ✅ | Resolves Clean Architecture circular-reference violation |
| 9.8 | `IBusService`, `ITrainService`, `ICabService` interfaces | ✅ | Defined in Application/Services/Interfaces |
| 9.9 | `BusService`, `TrainService`, `CabService` implementations | ✅ | Coupon + wallet + email + snapshot persistence |
| 9.10 | `IEmailService.SendTransportBookingConfirmationAsync` | ✅ | Color-coded HTML email per transport type (green/blue/amber) |
| 9.11 | `IInvoiceDocumentService.GenerateTransportTicketPdf` | ✅ | PdfSharpCore ticket with journey, passenger, fare tables |
| 9.12 | `BusesController`, `TrainsController`, `CabsController` updated | ✅ | Now inject `IBusService` / `ITrainService` / `ICabService` with `[Authorize]` on book endpoints |
| 9.13 | `BookingService.ToDtoAsync` handles transport snapshot fields | ✅ | Deserialises JSON and maps to `BookingDto.transportOperator/vehicleType/amenities/distanceKm` |
| 9.14 | `BookingService.GetInvoiceAsync` routes transport to PDF generator | ✅ | `Bus \| Train \| Cab` → `GenerateTransportTicketPdf` |
| 9.15 | `BookBusPage.tsx` — full booking page | ✅ | Journey summary, passenger form, coupon, payment selector, fare sidebar |
| 9.16 | `BookTrainPage.tsx` — full booking page | ✅ | Shows train number/name/class, running days, passenger form |
| 9.17 | `BookCabPage.tsx` — full booking page | ✅ | Shows pickup/drop, distance, duration, car model |
| 9.18 | `BusesPage.tsx` — BOOK NOW button wired | ✅ | Navigates to `/buses/book` with bus + seats state |
| 9.19 | `TrainsPage.tsx` — BOOK button per class wired | ✅ | Navigates to `/trains/book` with train + classInfo + className state |
| 9.20 | `CabsPage.tsx` — BOOK CAB button wired | ✅ | Navigates to `/cabs/book` with cab + pickupTime + origin/destination state |
| 9.21 | `AppRouter.tsx` — transport booking routes added | ✅ | `/buses/book`, `/trains/book`, `/cabs/book` |
| 9.22 | `BookingDetailPage.tsx` — transport detail display | ✅ | Type-aware icon, operator, vehicle type, amenities, route, times |


---

## Phase 7 — Hotel Management Portal
**Branch:** `Development`
**Scope:** Full hotel manager self-service portal + admin hotel registration

| # | Feature | Status | Notes |
|---|---|---|---|
| 7.1 | `Hotel` role added to `UserRole` enum + `HotelId` FK on `User` | ✅ | JwtService includes `hotelId` claim in token |
| 7.2 | `Images` field on `Hotel` and `HotelRoom` entities | ✅ | Nullable `nvarchar(max)` JSON array of image URLs |
| 7.3 | `IHotelManagerService` + `HotelManagerService` | ✅ | Dashboard, bookings, profile, room CRUD |
| 7.4 | `IHotelRoomRepository` + `HotelRoomRepository` | ✅ | `GetByIdForHotelAsync` for scoped room access |
| 7.5 | Admin hotel registration (`POST /admin/hotels`) | ✅ | Creates hotel + manager user + sends credentials email |
| 7.6 | Admin hotel list + toggle active (`GET/POST /admin/hotels`) | ✅ | Full hotel management in admin panel |
| 7.7 | `HotelManagerController` (8 endpoints, `[Authorize(Roles="Hotel")]`) | ✅ | Dashboard, bookings, profile, room CRUD |
| 7.8 | Hotel credentials email template | ✅ | Sky-blue HTML email with login details + feature list |
| 7.9 | EF Core migration `AddHotelPortal` | ✅ | Adds `Users.HotelId`, `Hotels.Images`, `HotelRooms.Images` |
| 7.10 | Frontend Hotel Portal (`/hotel/*` routes) | ✅ | Sidebar layout with Dashboard, Bookings, Rooms, My Hotel pages |
| 7.11 | `HotelRoute` guard + hotel redirect on login | ✅ | Hotel role redirects to `/hotel/dashboard` after login |
| 7.12 | Admin panel Hotels tab | ✅ | Register hotel modal + active/inactive toggle |
| 7.13 | `hotelManagerService.ts` + types + endpoints | ✅ | Full TypeScript service for all hotel manager API calls |

---

## Phase 8 — Code Quality, Security Hardening & Test Expansion
**Branch:** `feature/hotel-portal`
**Scope:** Static value audit, security fix, validator coverage, doc updates

| # | Feature | Status | Notes |
|---|---|---|---|
| 8.1 | BCrypt cost factor extracted to `SecurityConstants.BcryptWorkFactor` | ✅ | Replaces hardcoded `12` in `AuthService` + `AdminService` |
| 8.2 | SMTP credentials removed from `appsettings.json` | ✅ | Real credentials must live in `appsettings.Development.json` or Docker env vars; `Email.Enabled` defaults `false` |
| 8.3 | `RegisterHotelRequestValidator` (FluentValidation) | ✅ | Validates all 7 fields; star rating 1–5; password policy enforced |
| 8.4 | `CreateRoomRequestValidator` (FluentValidation) | ✅ | Price > 0, guests 1–20, rooms > 0, optional field length limits |
| 8.5 | Test suite expanded: 108 tests (up from 11) | ✅ | Auth, BookFlight, RegisterHotel, CreateRoom — positive + negative cases for every validation rule |
| 8.6 | `AuthValidatorsTests` — full positive/negative coverage | ✅ | 40+ cases covering all 4 auth request types |
| 8.7 | `BookFlightRequestValidatorTests` — boundary + case-sensitivity tests | ✅ | Covers cabin class case sensitivity and all passenger boundaries |
| 8.8 | `RegisterHotelRequestValidatorTests` — comprehensive hotel registration tests | ✅ | Star rating range, password rules, field lengths, email format |
| 8.9 | `CreateRoomRequestValidatorTests` — room creation tests | ✅ | Price/guest/room count boundaries, max-length on optional fields |
| 8.10 | README, API docs, TESTING_GUIDE, TODO, TASK-TRACKER updated | ✅ | Hotel portal, test counts, static value findings documented |

---

## Phase 6 — Test Gate & CI Enforcement
**Branch:** `feature/pdf-linux-font-support`
**Scope:** Baseline automated tests, commit hook, CI policy, documentation

| # | Feature | Status | Notes |
|---|---|---|---|
| 6.1 | Backend validator test project | ✅ | Added `backend/tests/TravelPort.Application.Tests` with auth and flight-booking validator coverage |
| 6.2 | Frontend unit test runner | ✅ | Added `vitest` and formatter tests in `frontend/src/utils/formatters.test.ts` |
| 6.3 | Shared repository test scripts | ✅ | Added `scripts/test-all.sh`, `scripts/test-all.ps1`, and `scripts/test-all.cmd` |
| 6.4 | Pre-commit enforcement | ✅ | Added versioned hook at `.githooks/pre-commit`; enable with `git config core.hooksPath .githooks` |
| 6.5 | CI test enforcement | ✅ | GitHub Actions now runs backend and frontend tests before build/push |
| 6.6 | Documentation refresh | ✅ | Updated README, contributing workflow, deployment guide, testing guide, and PR template |

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
| 2.9 | SMTP email notifications | ✅ | Booking confirmation email via Office365 SMTP; toggle via `Email__Enabled` config |
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
| 10.8 | `docker-compose.yml` — fix healthcheck password var (`$$DB_SA_PASSWORD` → `$$SA_PASSWORD`) | ✅ | Container env var is `SA_PASSWORD`; healthcheck was connecting with empty string causing DB unhealthy |
| 10.9 | `deploy.yml` — add `environment: production` approval gate to docker job | ✅ | Pipeline pauses after build and waits for owner approval before pushing images to Docker Hub |
| 10.10 | `docs/DEPLOYMENT.md` — document approval gate setup and flow | ✅ | Step-by-step GitHub Environment setup instructions added |

---

## Phase 11 — Frontend Reliability & UX Polish
**Branch:** `feature/frontend-reliability-polish`
**Date:** 2026-05-13
**Scope:** Toast feedback, crash recovery, skeleton loading polish, profile UX improvements, safe flight result pagination

| # | Feature | Status | Notes |
|---|---|---|---|
| 11.1 | Shared toast provider | ✅ | Added `ToastProvider` + `useToast()` helpers for success/error/info feedback |
| 11.2 | App-wide error boundary | ✅ | `ErrorBoundary` now wraps routed UI and provides recovery actions on render crashes |
| 11.3 | Transport skeleton loaders | ✅ | Added reusable bus/train/cab skeleton cards and wired them into search pages |
| 11.4 | Profile page overview refresh | ✅ | Added account summary hero, wallet highlights, and cleaner saved-card/traveller sections |
| 11.5 | Profile feedback hardening | ✅ | Wallet top-up, saved cards, and add-card flows now use toasts plus safer confirm dialogs |
| 11.6 | Saved travellers management polish | ✅ | Replaced native confirm with themed dialog and added success/error feedback |
| 11.7 | Flight result pagination | ✅ | Paginated filtered flights locally at 10 results per page without changing backend contracts |
| 11.8 | Verification pass | ✅ | Frontend tests, frontend production build, and backend tests all passed after the changes |
| 11.9 | Flight lowest-fare date strip | ✅ | Added a Goibibo-style nearby-date strip that shows the lowest available fare and supports direct date switching |
| 11.10 | Flight monthly fare calendar | ✅ | Added a 2-month fare calendar overlay with visible-date price prefetch and cached lowest-price rendering |
| 11.11 | Docker SMTP email fix | ✅ | `EMAIL_ENABLED=true` + SMTP credentials added to `.env`; API container restarted; booking confirmation emails now send from Docker |
| 11.12 | `BookingDetailPage` — replace static email placeholder | ✅ | Removed hardcoded "SMTP configuration is added" message; replaced with green success banner showing actual recipient email |

---

## Phase 12 — Multi-Mode Homepage, Search UX, Extended Filters & Saved Traveller Integration
**Branch:** `fix/city-search-autocomplete-and-tab-reset`
**Date:** 2026-05-18
**Scope:** Full multi-mode homepage rewrite, city autocomplete, themed date picker, feature-parity filter sidebars on Bus/Train/Cab pages, SavedTravellerPicker across all booking pages

| # | Feature | Status | Notes |
|---|---|---|---|
| 12.1 | `HomePage` — multi-mode tab bar (Flights / Hotels / Buses / Trains / Cabs) | ✅ | Per-mode hero gradients; `switchMode()` resets all form state on tab switch |
| 12.2 | `HomePage` — mode-specific search forms | ✅ | Separate form state per mode; Bus/Train/Cab forms use CitySearch + HeroDatePicker |
| 12.3 | `HomePage` — per-mode recent searches | ✅ | `filteredRecent` filtered by `s.type === mode`; only shows searches relevant to current tab |
| 12.4 | `HomePage` — popular routes section per mode | ✅ | Mode-specific popular-destination tiles rendered conditionally |
| 12.5 | `HeroDatePicker` component (inline in HomePage) | ✅ | `showPicker()` on click anywhere on field; formatted `en-IN` display; no browser date format |
| 12.6 | `DatePickerInput` component — full rewrite | ✅ | Themed border+background per `accentColor` when value set; `showPicker()` on any click; formatted display; 5 accent themes (blue/green/yellow/orange/indigo) |
| 12.7 | `CitySearch` component (`frontend/src/components/search/CitySearch.tsx`) | ✅ | Autocomplete dropdown; popular cities on focus; type-to-search; click-outside to close; themed per `focusColor` |
| 12.8 | `cities.ts` data file (`frontend/src/data/cities.ts`) | ✅ | 65 Indian cities with state; `searchCities()` filters by name or state; `POPULAR_CITIES` top-10 list |
| 12.9 | `HomePage` — Hotel city field replaced with `CitySearch` | ✅ | `focusColor="blue"`; city value resets on mode switch |
| 12.10 | `HomePage` — Bus origin/destination replaced with `CitySearch` | ✅ | `focusColor="green"`; both fields reset on mode switch |
| 12.11 | `HomePage` — Train origin/destination replaced with `CitySearch` | ✅ | `focusColor="indigo"`; both fields reset on mode switch |
| 12.12 | `HomePage` — Cab origin/destination replaced with `CitySearch` | ✅ | `focusColor="orange"`; both fields reset on mode switch |
| 12.13 | `Navbar` — profile dropdown with user initials + wallet balance | ✅ | Lazy-fetches wallet on open; My Bookings + Profile links; click-outside handler |
| 12.14 | `SavedTravellerPicker` integration — `BookBusPage` | ✅ | `accentColor="green"`; fills firstName/lastName/email/phone via `setValue` |
| 12.15 | `SavedTravellerPicker` integration — `BookTrainPage` | ✅ | `accentColor="blue"`; same `setValue` pattern |
| 12.16 | `SavedTravellerPicker` integration — `BookCabPage` | ✅ | `accentColor="yellow"`; same `setValue` pattern |
| 12.17 | `SavedTravellerPicker` integration — `BookFlightPage` | ✅ | Per-traveller card; fills `fullName`; also sets mobile/email for first traveller |
| 12.18 | `BusesPage` — extended filter sidebar | ✅ | Sort tabs (Cheapest/Earliest/Fastest); departure time slot buttons (🌙🌅☀️🌆); AC + Refundable checkboxes; Bus Type checkboxes (Sleeper/Semi-Sleeper/Seater/Volvo); Operator checkboxes (6 operators); Max Price; Clear all |
| 12.19 | `TrainsPage` — extended filter sidebar | ✅ | Sort tabs (Earliest/Fastest/Cheapest); departure time slot buttons; Tatkal checkbox; Train Class checkboxes (SL/3A/2A/1A/CC); Max Price; Clear all |
| 12.20 | `CabsPage` — extended filter sidebar | ✅ | Sort tabs (Cheapest/Fastest/Top Rated); AC checkbox; Cab Type visual cards (Mini🛺/Sedan🚗/Prime🚙/SUV🚐) with capacity; Provider checkboxes (Ola/Uber/Meru/Zoom); Min Driver Rating buttons (3+/3.5+/4+/4.5+); Max Price; Clear all |
| 12.21 | `CabsPage` — rating sort added | ✅ | New `'rating'` sort option; `sortBy === 'rating'` sorts by `driverRating` descending |
| 12.22 | `CabsPage` — `filterProviders: string[]` replaces single `filterProvider` | ✅ | Multi-select provider checkboxes; array filter applied client-side |
| 12.23 | TypeScript build — zero errors | ✅ | `npx tsc --noEmit` exits clean after all changes |

---

---

## Phase 13 — Version 2 / Phase-2 Bug Fixes & UX Polish
**Branch:** `feat/phase2-ux-polish-and-bug-fixes`
**Date:** 2026-05-20
**Scope:** Login error handling, bus seat labelling, flight date picker UX, cab free-text address, hotel image gallery carousel

| # | Feature | Status | Notes |
|---|---|---|---|
| 13.1 | **Login error message fix** — `extractMessage` handles `ValidationProblemDetails` (FluentValidation format) | ✅ | Reads `d.errors` object + `d.title`; no longer falls back to generic "Login failed" for validation errors |
| 13.2 | **Bus seat L/U labelling** — selected seats sent as `3(L)`, `22(U)` in booking payload | ✅ | Seats ≤ half total = Lower, rest = Upper; shown on confirmation page and PDF e-ticket |
| 13.3 | **Bus seat confirmation + PDF** — Boarding point, dropping point, seat with L/U legend | ✅ | `BusBookingConfirmPage` adds `(L) Lower · (U) Upper` note; PDF footer adds legend line |
| 13.4 | **Flight date picker UX** — departure/return date pickers match FROM/TO underline style | ✅ | New `variant="underline"` on `DatePickerInput`; uppercase label, border-b-2, no box border |
| 13.5 | **Cab free-text address input** — `CitySearch` now fires `onChange` on every keystroke | ✅ | Users can type any address/landmark; city suggestions appear as optional hints; "Using X as address" shown when no match |
| 13.6 | **Hotel image gallery carousel** — multi-photo hero with prev/next arrows + dot indicators | ✅ | `Images` JSON column wired end-to-end (backend DTO → seeder pool → frontend parse) |
| 13.7 | **Hotel lightbox** — full-screen photo viewer with keyboard nav and thumbnail strip | ✅ | Arrow keys + Escape; thumbnail strip at bottom; "View all N photos" button on hero |
| 13.8 | **Hotel images DB populated** — 75/76 hotels updated with 5-photo gallery via direct SQL | ✅ | Star-tier pools (5★/4★/3★); deterministic per hotel; no migration needed (column existed) |
| 13.9 | **Docker API crash fix** — `LayoverAirport`/`LayoverDurationMinutes` columns applied via sqlcmd | ✅ | Direct `ALTER TABLE` + `__EFMigrationsHistory` insert; API container healthy |
| 13.10 | **Hotel Reviews** — confirmed already fully implemented (POST + GET + Admin delete + validation) | ✅ | No code change needed; completed-stay guard, duplicate check, cache invalidation all in place |

---

## Phase 4 — Admin Panel Enhancements (Flight Mgmt, Analytics, Announcements, View-as-User)
**Branch:** `feat/phase4-admin-enhancements`
**Date:** 2026-05-21
**Scope:** 5 admin panel features: flight management, bookings CSV export, site-wide announcement banners, coupon usage analytics, and View-as-User inspection modal.

| # | Feature | Status | Notes |
|---|---|---|---|
| 4.1 | `AdminFlightDto` + `AdminUpdateFlightRequest` DTOs | ✅ | Application/DTOs/Admin/AdminFlightDto.cs |
| 4.2 | `IAdminService.GetAllFlightsAsync` + `UpdateFlightAsync` | ✅ | Search on FlightNumber/Airline/Source/Destination; patch-style update |
| 4.3 | `GET /admin/flights` + `PUT /admin/flights/{id}` endpoints | ✅ | AdminController; cache invalidated on update via `ICacheService.RemoveAsync` |
| 4.4 | AdminPage — Flights tab with searchable table + edit modal | ✅ | Economy/business price, seats, times, isActive; full inline edit UX |
| 4.5 | `GET /admin/bookings/export-csv` endpoint | ✅ | Delegates to `GetBookingsAsync`; streams `text/csv` response |
| 4.6 | AdminPage — "Export CSV" button on Bookings tab | ✅ | `responseType: 'blob'` + `URL.createObjectURL`; triggers browser download |
| 4.7 | `Announcement` domain entity (Message, Type, ExpiresAt, IsActive, CreatedByUserId) | ✅ | Domain/Entities/Announcement.cs; extends BaseEntity (soft-delete) |
| 4.8 | `TravelPortDbContext` — `Announcements` DbSet + soft-delete query filter | ✅ | Persistence/Context/TravelPortDbContext.cs |
| 4.9 | EF Core migration `AddAnnouncementsTable` | ✅ | 20260521121744_AddAnnouncementsTable |
| 4.10 | `AnnouncementDto`, `CreateAnnouncementRequest`, `UpdateAnnouncementRequest` | ✅ | Application/DTOs/Admin/AnnouncementDto.cs |
| 4.11 | `IAnnouncementService` + `AnnouncementService` | ✅ | GetActive filters IsActive && (ExpiresAt == null || ExpiresAt > now) |
| 4.12 | `AnnouncementsController` — 5 endpoints | ✅ | `GET /active` AllowAnonymous; remaining 4 Admin-only |
| 4.13 | AdminPage — Announcements tab (create form + manage list) | ✅ | Type select (info/warning/success), optional expiry date, pause/resume/delete |
| 4.14 | `Layout.tsx` — dismissable announcement banner on all pages | ✅ | Fetches `/announcements/active`; info/warning/success color themes; X dismiss button |
| 4.15 | `CouponAnalyticsDto` + `IAdminService.GetCouponAnalyticsAsync` | ✅ | Aggregates bookings by CouponCode → uses/discount/revenue per coupon |
| 4.16 | `GET /admin/coupons/analytics` endpoint | ✅ | AdminController |
| 4.17 | AdminPage — bar chart of top 5 coupons in Coupons tab | ✅ | SimpleBar pattern (no Recharts); shows uses + discount saved |
| 4.18 | `AdminUserOverviewDto` + `IAdminService.GetUserOverviewAsync` | ✅ | Wallet balance, role, status + last 20 bookings as BookingDtos |
| 4.19 | `GET /admin/users/{id}/overview` endpoint | ✅ | AdminController |
| 4.20 | AdminPage — "View" button on Users tab opens User Overview modal | ✅ | Read-only: wallet, account status, member since, recent booking list |
| 4.21 | Frontend types — `AdminFlightDto`, `AdminUpdateFlightRequest`, `CouponAnalyticsDto`, `AnnouncementDto`, `AdminUserOverviewDto` | ✅ | frontend/src/types/index.ts |
| 4.22 | `adminService.ts` — 5 new methods | ✅ | getFlights, updateFlight, getCouponAnalytics, getUserOverview, exportBookingsCsv |
| 4.23 | `announcementService.ts` — new service file | ✅ | getActive, getAll, create, update, delete |
| 4.24 | `endpoints.ts` — 5 admin + 3 announcements endpoints | ✅ | flights, flight(id), couponAnalytics, userOverview(id), exportCsv; announcements section |
| 4.25 | TypeScript compile — zero errors | ✅ | `npx tsc --noEmit` clean after all changes |

---

## Upcoming / Planned

| # | Feature | Priority | Phase |
|---|---|---|---|
| 14.1 | Email verification flow (OTP) | 🟡 Medium | Phase 14 |
| 14.2 | HTTPS with Let's Encrypt (Nginx + Certbot sidecar) | 🟡 Medium | Phase 14 |
| 14.3 | Mobile-responsive filter drawer (slide-over panel < 1024px) | 🔴 High | Phase 14 |
| 14.4 | Unit tests for FlightService, HotelService, WalletService | 🟢 Low | Phase 14 |
| 14.5 | Redis cache (replace in-memory IMemoryCache) | 🟢 Low | Phase 14 |
| 14.6 | Real Razorpay webhook handler for production | 🟢 Low | Phase 14 |

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
| Total phases completed | 13 (Phase 4 Admin Enhancements added) |
| Total features delivered | 250+ |
| Flights in seed DB | 900+ (dynamic demand-based pricing) |
| Hotels in seed DB | 60+ (12 cities) |
| Coupons | 11 (5 original + 6 new: FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL) |
| API endpoints | 65+ |
| Frontend pages | 19+ |
| Frontend components | 32+ (DatePickerInput, CitySearch, SavedTravellerPicker, HeroDatePicker, AnnouncementBanner, ...) |
| Searchable cities | 65 Indian cities with state (autocomplete) |
| Airlines covered | 7 |
| Routes covered | 42 bidirectional |
| External API integrations | 3 (Duffel, Razorpay, SMTP/Office365) |
| PDF invoices | 2 types (Flight e-ticket A4, Hotel invoice A4) |
| Email events covered | 4 (flight booking, hotel booking, transport booking, cancellation, password reset) |
| Payment methods | 3 (Credit/Debit Card, UPI with QR, Net Banking) |
| Wallet features | Top-up, deduction at booking, 90% refund on cancellation (auto-credited) |
| Search filter depth | Full (Flights + Hotels + Buses + Trains + Cabs — all with sort tabs, time slots, multi-select filters) |
| Admin panel tabs | 6 (Dashboard, Users, Bookings, Coupons, Flights, Announcements) |
| Admin analytics | Coupon usage analytics (uses/discount/revenue per coupon), CSV bookings export |
