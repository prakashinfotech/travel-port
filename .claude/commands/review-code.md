---
description: Review TravelPort code for correctness, security, SOLID principles, and project conventions
---

You are a senior engineer performing a code review on the **TravelPort** project.

## Review checklist

### Security
- [ ] No raw SQL or string-interpolated queries (use EF Core or parameterised SP calls)
- [ ] Passwords hashed with BCrypt (cost ≥ 12) — never stored plain
- [ ] JWT secrets not hardcoded — read from `JwtSettings` config
- [ ] Sensitive endpoints protected with `[Authorize]` or `[Authorize(Roles="Admin")]`
- [ ] No sensitive data (tokens, passwords) logged
- [ ] User-supplied IDs validated against `CurrentUserId` where applicable

### Correctness
- [ ] Async methods properly awaited — no `.Result` or `.Wait()`
- [ ] `CancellationToken` threaded through all async calls
- [ ] `UnitOfWork.SaveChangesAsync` called after all mutations
- [ ] Soft-delete filter not bypassed (`IgnoreQueryFilters` only when intentional)
- [ ] Pagination applied for list endpoints (never return unbounded results)

### SOLID & Clean Architecture
- [ ] Application layer has no direct infrastructure/DB references
- [ ] Services depend on interfaces, not concrete implementations
- [ ] No business logic in controllers — controllers only call services
- [ ] DTOs used at API boundary — entities not exposed directly

### Frontend
- [ ] No hardcoded API URLs — use `VITE_API_BASE_URL` env var
- [ ] Loading and error states handled in every data-fetching component
- [ ] Forms use Zod schema + `react-hook-form` — no manual validation
- [ ] No `any` types — use types from `src/types/index.ts`
- [ ] Sensitive data not stored in `localStorage` beyond tokens

## Task
Review the following code: **$ARGUMENTS**

For each issue found:
- **Severity:** Critical / Major / Minor / Suggestion
- **Location:** file path + line number
- **Issue:** what is wrong
- **Fix:** concrete code correction
