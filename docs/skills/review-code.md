# Skill: Code Review

**Slash command:** `/review-code`
**Category:** Code Quality
**Stack:** .NET 8 · React 18 · TypeScript · SQL Server

---

## Purpose

Performs a structured, multi-category code review of any TravelPort file or snippet, checking for security vulnerabilities, correctness issues, SOLID violations, and project convention breaches.

---

## When to Use

- Before merging a pull request
- After implementing a complex feature
- When auditing existing code for security or performance
- During peer reviews

---

## Usage

```
/review-code <file path or paste code>
```

**Examples:**
```
/review-code src/Application/Services/BookingService.cs
/review-code src/pages/BookFlightPage.tsx
/review-code (paste code directly after command)
```

---

## Review Categories

### 🔒 Security
| Check | What's Verified |
|-------|----------------|
| SQL Injection | EF Core LINQ used; no string-interpolated queries |
| Password storage | BCrypt hash (cost ≥ 12); never plain-text or logged |
| JWT secret | Read from `JwtSettings` config, not hardcoded |
| Authorization | `[Authorize]` on all sensitive endpoints |
| Data exposure | Entities not returned directly; DTOs used at boundary |
| Rate limiting | Auth endpoints use `AuthPolicy` (5 req/15 min) |

### ✅ Correctness
| Check | What's Verified |
|-------|----------------|
| Async/await | No `.Result` or `.Wait()` deadlocks |
| CancellationToken | Threaded through all async calls |
| UnitOfWork | `SaveChangesAsync` called after all mutations |
| Soft delete | Global query filter respected |
| Pagination | All list endpoints paginated |
| Null safety | Null-conditional operators used appropriately |

### 🏛️ Architecture (SOLID)
| Check | What's Verified |
|-------|----------------|
| Clean layers | Application has no EF Core / SQL references |
| DIP | Services depend on interfaces, not concretes |
| SRP | Controllers only call services; zero business logic |
| DTO boundary | No entity serialisation in API responses |

### ⚛️ Frontend
| Check | What's Verified |
|-------|----------------|
| API calls | Service functions used, not raw axios |
| Loading/error | Both states handled in every fetch |
| Forms | Zod schema + react-hook-form only |
| Types | No `any`; types from `src/types/index.ts` |
| Env vars | No hardcoded URLs; `VITE_*` env vars used |

---

## Output Format

Each issue is reported as:

```
[Severity] Critical | Major | Minor | Suggestion
Location:  backend/src/Application/Services/BookingService.cs:47
Issue:     Missing await on SaveChangesAsync — changes will not be persisted
Fix:
  await _uow.SaveChangesAsync(ct);
```
