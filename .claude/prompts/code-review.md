# Code Review Prompt

Use this prompt to review TravelPort code for quality, security, and SOLID principles.

---

## Prompt Template

```
You are a principal engineer performing a thorough code review of the TravelPort project.

### Project context
- Backend: .NET 8 Clean Architecture (Domain → Application → Persistence → API)
- Frontend: React 18 + TypeScript + Redux Toolkit + Tailwind CSS
- Auth: JWT (15 min) + refresh tokens (7 days, rotation on use)
- Database: SQL Server 2022 with EF Core 8

### Review the following code and check all categories below:
[PASTE CODE HERE]

### Security checklist
- SQL injection: EF Core LINQ used, no string-interpolated queries
- Passwords: BCrypt hashed (cost ≥ 12), never logged or returned in responses
- JWT: secret read from config, not hardcoded; expiry enforced (ClockSkew = Zero)
- Authorization: all sensitive endpoints have [Authorize]; admin routes have [Authorize(Roles="Admin")]
- Input validation: FluentValidation runs before controller logic
- Sensitive data: tokens/PII not logged at Information level
- CORS: only allowed origins whitelisted (not wildcard in production)
- Rate limiting: auth endpoints use stricter AuthPolicy (5/15 min)

### Correctness checklist
- Async: all async paths properly awaited; no .Result or .Wait()
- Cancellation: CancellationToken threaded through all async service/repo calls
- Transactions: UnitOfWork.SaveChangesAsync called after all related mutations in one go
- Soft delete: global query filter respected; no accidental hard deletes
- Pagination: all list endpoints paginated (no unbounded result sets)
- Error handling: expected errors use typed exceptions (not generic Exception)
- Null safety: nullable reference types enabled; null checks in place

### Architecture checklist
- Clean Architecture: Application has no direct DB/EF references
- Dependency inversion: services depend on interfaces, not concretes
- Controller responsibility: controllers call one service method and return; zero business logic
- DTO boundary: entities never serialised to response; DTOs used at API boundary
- Service responsibility: single business concern per service

### Frontend checklist
- API calls: use service functions (not raw axios calls in components)
- State: local state for page data; Redux only for auth
- Forms: zod schema + react-hook-form; no manual validation
- Types: no `any`; all types from src/types/index.ts
- Loading/error: every data-fetch renders skeleton + error state
- Secrets: no hardcoded URLs or tokens; env vars via VITE_*

### Output format
For each issue found:
**[Severity]** Critical | Major | Minor | Suggestion
**Location:** <file path>:<line>
**Issue:** <what is wrong>
**Fix:**
\`\`\`
<corrected code>
\`\`\`
```

---

## Common Issues Found in This Codebase

| Issue | Where to look | Fix |
|-------|--------------|-----|
| Missing `await` on async repo calls | Service implementations | Add `await` keyword |
| `CurrentUserId` used without null check | Controller actions | Check `CurrentUserId != Guid.Empty` |
| Unbounded list query | Repository `GetAll` calls | Add `.Take(pageSize).Skip()` |
| Entity returned directly in API response | Controller return types | Map to DTO |
| Hardcoded connection string | appsettings | Move to env var / secrets manager |
| `console.log` left in frontend | Service/component files | Remove before commit |
| `any` type in TypeScript | Axios response handling | Use `ApiResponse<T>` generic |
