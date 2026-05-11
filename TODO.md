# TODO.md — TravelPort Backlog

> Status legend: 🔴 High priority · 🟡 Medium · 🟢 Low · ✅ Done · ❌ Won't do

---

## Active / In-Progress

| # | Item | Priority | Notes |
|---|---|---|---|
| 1 | Drop + recreate DB after seed data expansion | 🔴 | Run migration commands after pulling latest |
| 2 | Test all flight filter combinations end-to-end | 🔴 | Especially combined stop + airline + time filters |
| 3 | Verify calendar popup closes on outside click on mobile | 🟡 | Touch event handling |

---

## Backend

### Bugs
- [x] ✅ **Coupon discount not applied to `FinalAmount`** — Fixed: `ICouponRepository` + `CouponRepository` added; discount wired in both `FlightService.BookAsync` and `HotelService.BookAsync`.
- [x] ✅ **DataSeeder always drops flight-linked bookings on restart** — Fixed: `SeedBookingsAsync` now deletes stale john@example.com bookings before re-inserting fresh ones tied to new flight IDs.
- [ ] 🟡 **Wallet deduction happens before booking confirmation** — if `_bookings.AddAsync` fails after `_wallet.DeductAsync`, the balance is permanently deducted. Wrap in a transaction or use compensating action.
- [ ] 🟡 **Flight seat decrement race condition** — two concurrent `BookAsync` calls for the same flight can both pass the seat check before either decrements. Add optimistic concurrency or row-level lock.

### Features Pending
- [ ] 🔴 **Multi-city flight search** — `FlightSearchRequest` supports origin/destination only. Add `MultiCity` trip type.
- [ ] 🔴 **Bus & Train booking persistence** — buses and trains are mocked in-memory; they have no DB entity or booking endpoint. Add `Bus` and `Train` domain entities + booking flow.
- [ ] 🔴 **Cab booking persistence** — same as buses/trains.
- [ ] 🟡 **Email verification on registration** — OTP flow documented but `IsVerified` is set to `true` in seed; registration sets it `false` with no verification path yet.
- [ ] 🟡 **Admin analytics endpoint** — `GET /admin/analytics` is a stub; add real aggregation queries.
- [ ] 🟡 **Paginated flight search response** — backend returns all matching flights in one call (up to `pageSize=100`); add proper server-side pagination with `total` and `page` in response.
- [ ] 🟡 **Persist individual flight traveller details** — the booking UI now collects per-traveller name/age/gender/ID data, but the current flight booking API still stores passenger count only.
- [ ] 🟢 **Real Razorpay webhook handler** — for production, handle `payment.failed` and `order.paid` webhooks to update booking status asynchronously.
- [ ] 🟢 **Rate limiting** — `429` is documented but no rate-limiting middleware is active.
- [ ] 🟢 **Refresh token rotation** — currently refresh tokens are single-use but rotation isn't enforced; expired tokens should be revoked from DB.

### Technical Debt
- [ ] 🟡 **`RazorpayService._logger` warning** — `_logger` field is declared but never used. Either inject and use `ILogger`, or remove the field.
- [ ] 🟡 **`FlightService.ExtractAmadeusPrice`** — Amadeus support was replaced by Duffel but the extraction helper and fallback code path still exist. Clean up once Amadeus is fully retired.
- [ ] 🟢 **No unit tests** — core services (`FlightService`, `HotelService`, `WalletService`) have zero test coverage.
- [ ] 🟢 **No integration tests** — no test project exists. At minimum, auth and booking flows should be covered.

---

## Frontend

### Bugs
- [x] ✅ **Login redirect** — Fixed: post-login now restores `location.state.from` so users return to their intended page.
- [x] ✅ **endpoints.ts duplicate property keys** — Fixed: removed duplicate `profile`, `wallet`, `walletTopup`, `walletTransactions`, `travellers`, `traveller` keys from `users` object.
- [x] ✅ **FlightsPage TypeScript errors** — Fixed: zero TS errors; removed dead components (DateBar, CalendarPicker), fixed duplicate state, wired FilterSidebar + SortTabs.
- [x] ✅ **PaymentPage broken imports** — Fixed: added `ApiResponse`, `CreateOrderResponse`, `endpoints`, `AlertCircle`; removed unused card/UPI state; typed Razorpay window.
- [ ] 🔴 **Mobile filter sidebar hidden** — the sidebar uses `hidden lg:block`; on mobile there's no way to access filters. Add a slide-over drawer triggered by a filter button.
- [ ] 🟡 **Calendar popup z-index on mobile** — calendar may render behind the search bar on small screens.
- [ ] 🟡 **Date bar adjacent-date fetches fire on every render** — the `useEffect` for background date-price fetching has incomplete deps; debounce or guard with a ref.
- [ ] 🟢 **`AirportSearch` doesn't pre-populate city label on page reload** — `originCity` state is empty on load from URL params; city name only shows after user interacts.

### Features Pending
- [x] ✅ **HomePage buses/trains/cabs search** — Added full search forms for each mode; replaced "Coming soon" block; each form navigates with URL params and auto-triggers search.
- [x] ✅ **Recent searches** — clickable chips navigate to saved results; ✕ button removes entry.
- [ ] 🔴 **Mobile-responsive filter drawer** — slide-over panel for filters on screens < 1024px.
- [ ] 🔴 **Hotel search filter sidebar** — HotelsPage has no filter sidebar yet; add star rating, price range, amenities filters matching Goibibo style.
- [ ] 🟡 **Trains page booking flow** — TrainsPage shows results but the BOOK button is not wired to a booking endpoint (no train booking API yet).
- [ ] 🟡 **Buses page booking flow** — same as trains.
- [ ] 🟡 **Cabs page booking flow** — same as trains.
- [ ] 🟡 **Profile page** — `GET /users/profile` and `PUT /users/profile` exist; profile page UI is basic.
- [ ] 🟡 **Saved travellers management** — API endpoints exist (`GET/POST/DELETE /users/travellers`) but no UI.
- [ ] 🟡 **Admin panel UI** — admin routes and endpoints exist but no admin dashboard pages in the frontend.
- [ ] 🟡 **Error boundary** — no React error boundary; unhandled component errors crash the whole app.
- [ ] 🟢 **Toast notifications** — success/error toasts for booking, payment, coupon apply actions.
- [ ] 🟢 **Skeleton loaders for Hotels, Buses, Trains, Cabs** — only FlightCardSkeleton exists.
- [ ] 🟢 **Dark mode** — Tailwind config supports it; no dark-mode classes applied.
- [ ] 🟢 **PWA / offline support** — Vite PWA plugin not configured.

---

## Infrastructure / DevOps

- [ ] 🟡 **Environment-specific Dockerfile** — no containerisation; add `Dockerfile` for API and serve frontend via Nginx.
- [ ] 🟡 **CI pipeline** — no GitHub Actions workflow; add build + test checks on PR.
- [ ] 🟢 **Redis for caching** — replace in-memory `IMemoryCache` with Redis for multi-instance support.
- [ ] 🟢 **Database migrations CI** — auto-run `dotnet ef database update` in deployment pipeline.

---

## Recently Completed ✅

- [x] Duffel API integration (external flight provider, sandboxed)
- [x] Disable Duffel, switch to rich DB seed data (900+ flights, 40+ hotels, 12 cities)
- [x] BusSearchProvider — route-specific durations, 14 operators, realistic pricing
- [x] TrainSearchProvider — 39 named trains, route-specific durations, distance-based pricing
- [x] Goibibo-style FlightsPage — Popular Filters, date bar with prices, calendar picker, sort tabs, fare type
- [x] FlightCard redesign — airline color badge, VIEW FARES button, Goibibo layout
- [x] Buses, Trains, Cabs frontend pages
- [x] PaymentPage with Razorpay checkout and mock fallback
- [x] Forgot password / Reset password flow with expiring email link and token invalidation
- [x] Goibibo-style flight fare popup with fare-family booking flow and traveller details UI
- [x] Goibibo-style booking detail page with downloadable PDF e-ticket
- [x] Home page recent searches saved with click-through navigation
- [x] FlightCard — stops badge, baggage, refundable, originCity/destinationCity
- [x] CLAUDE.md, GIT.md, TODO.md, TASK-TRACKER.md created
