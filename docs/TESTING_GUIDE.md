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
- `backend/tests/TravelPort.Application.Tests` for FluentValidation rules on auth and flight booking DTOs
- `frontend/src/utils/formatters.test.ts` for shared UI formatting helpers

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
- Keep `scripts/test-all.sh` and `scripts/test-all.ps1` as the single entrypoint for the repo test gate
