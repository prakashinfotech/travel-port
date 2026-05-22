# TESTING_GUIDE.md â€” TravelPort Test Strategy

> This document defines the local and CI test gate for TravelPort.

---

## Rule

Every commit must pass the shared repository test gate before it is created, and every push or pull request to `Development` must pass the same tests in GitHub Actions.

---

## Commands

Linux, macOS, or Git Bash:

```bash
./scripts/test-all.sh
```

PowerShell:

```powershell
.\scripts\test-all.cmd
```

---

## What Runs

- Backend: `dotnet test backend/TravelPort.sln -c Release`
- Frontend: `npm --prefix frontend run test -- --run`

Current automated coverage includes:

**Backend — `backend/tests/TravelPort.Application.Tests`** (562 tests total):

*Auth validators:*
- `AuthValidatorsTests` — RegisterRequest (valid email formats, strong passwords, invalid phone, missing fields, each password rule independently), LoginRequest, ForgotPasswordRequest, ResetPasswordRequest

*Flight validators:*
- `BookFlightRequestValidatorTests` — Economy/Business cabin; passengers 1–9; empty FlightId; optional GuestEmail/GuestPhone validated when provided
- `FlightSearchRequestValidatorTests` — Origin/Destination required; passengers 1–9; CabinClass enum; SortBy enum; MaxPrice > 0; MaxStops 0–2; pagination bounds

*Hotel validators:*
- `RegisterHotelRequestValidatorTests` — all fields; star rating 1–5; strong password rules; max-length boundaries
- `CreateRoomRequestValidatorTests` — RoomType/Price/MaxGuests/TotalRooms required; optional field max-lengths
- `CreateHotelReviewRequestValidatorTests` — rating 1–5; comment required/max 1000 chars; dual-failure
- `BookHotelRequestValidatorTests` — HotelId/RoomId; CheckOut > CheckIn; guests 1–20; optional email/phone; meal plan ≥ 0
- `HotelSearchRequestValidatorTests` — City required; CheckOut > CheckIn; guests 1–20; MinPrice/MaxPrice; StarRating 0–5; SortBy enum; pagination

*Hotel manager validators:*
- `UpdateHotelDetailsRequestValidatorTests` — all optional fields; StarRating 1–5; max-length on Name/City/Address/Description/Amenities
- `UpdateRoomRequestValidatorTests` — all optional; PricePerNight > 0; MaxGuests 1–20; TotalRooms > 0; max-lengths

*Transport validators:*
- `BookBusRequestValidatorTests` — all required fields; arrival > departure; price > 0; seats 1–10; optional email/phone
- `BookTrainRequestValidatorTests` — all required fields incl. Class; arrival > departure; price > 0; passengers 1–9
- `BookCabRequestValidatorTests` — all required fields; distance > 0; price > 0; driver rating 0–5 nullable
- `BusSearchRequestValidatorTests` — Origin/Destination required; seats 1–10; pagination
- `CabSearchRequestValidatorTests` — Origin/Destination required; TripType enum (OneWay/Outstation/Rental); pagination
- `TrainSearchRequestValidatorTests` — Origin/Destination/Class required; passengers 1–9; pagination
- `SeatLockRequestValidatorTests` — non-empty array; max 10 seats; no empty seat strings

*Admin validators:*
- `CreateCouponRequestValidatorTests` — Code format (UPPERCASE/digits); Type percentage/flat; Value > 0; ≤100% cap; MinAmount ≥ 0; optional MaxDiscount/UsageLimit > 0
- `UpdateAnnouncementRequestValidatorTests` — all optional; Message max 500; Type enum when provided
- `AdminUpdateFlightRequestValidatorTests` — all optional; prices > 0; TotalSeats > 0; AvailableSeats ≥ 0; arrival > departure when both given
- `RegisterFlightOperatorRequestValidatorTests` — CompanyName; IataCode 2–3 uppercase chars; strong password; manager email
- `RegisterBusOperatorRequestValidatorTests` — CompanyName; optional ContactPhone 10-digit; strong password; manager email
- `RegisterCabOperatorRequestValidatorTests` — CompanyName; DriverLicenseNumber required when IsIndividualDriver; strong password

*AI validators:*
- `AiChatRequestValidatorTests` — non-empty messages; role user/assistant; content required/max 4000
- `NlSearchRequestValidatorTests` — query required/max 500; whitespace rejected
- `TripPlanRequestValidatorTests` — brief required/max 1000; whitespace rejected

*User validators:*
- `UpdateProfileRequestValidatorTests` — Name required/max 100; optional Phone 10-digit regex
- `AddTravellerRequestValidatorTests` — Name required; optional Email/Phone/PassportNo validated
- `WalletTopUpRequestValidatorTests` — Amount 1–100000
- `AddSavedCardRequestValidatorTests` — CardHolderName; CardNumber 16-digit; ExpiryMonth 1–12; ExpiryYear ≥ current; CardType credit/debit (case-insensitive)

*Payment validators:*
- `InitiatePaymentRequestValidatorTests` — BookingId not empty Guid
- `VerifyPaymentRequestValidatorTests` — BookingId + all 3 Razorpay fields not empty

*Operator validators:*
- `CreateFlightRequestValidatorTests` — FlightNumber/Source/Destination required; ArrivalTime > DepartureTime; TotalSeats 1–500; EconomyPrice > 0; Stops 0–2


**Frontend — `frontend/src/utils/formatters.test.ts`** for shared UI formatting helpers

---

## Pre-Commit Enforcement

The repository contains a versioned hook at `.githooks/pre-commit`.

Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

After that, `git commit` automatically runs the shared test gate and blocks the commit if any test fails.

---

## CI Enforcement

GitHub Actions runs the same quality gate on:
- Every push to `Development`
- Every pull request targeting `Development`

The pipeline runs tests before Docker image build and push, so failed tests stop the release flow early.

---

## Extending Coverage

When adding features:
- Add backend tests under `backend/tests`
- Add frontend unit tests next to the code as `*.test.ts` or `*.test.tsx`
- Keep `scripts/test-all.sh`, `scripts/test-all.ps1`, and `scripts/test-all.cmd` as the supported entrypoints for the repo test gate
