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

**Backend — `backend/tests/TravelPort.Application.Tests`** (108 tests total):
- `AuthValidatorsTests` — RegisterRequest (valid email formats, strong passwords, invalid phone, missing fields, each password rule independently), LoginRequest (valid/empty/invalid-format email, empty password), ForgotPasswordRequest (valid/invalid/empty email), ResetPasswordRequest (valid, empty token, weak password, each missing character class)
- `BookFlightRequestValidatorTests` — Economy and Business cabin accepted; all boundary passenger counts (1, 9 valid; 0, 10 invalid); empty FlightId rejected; case-sensitive cabin class check
- `RegisterHotelRequestValidatorTests` — valid full request; star ratings 1–5 accepted, 0/6/10 rejected; strong password accepted; each field empty rejected; each password rule tested independently; max-length boundaries on name, city, address
- `CreateRoomRequestValidatorTests` — valid full request; null optional fields accepted; boundary MaxGuests (1/20 valid, 0/21 invalid); zero/negative price rejected; zero/negative TotalRooms rejected; Amenities/Images over max length rejected

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
