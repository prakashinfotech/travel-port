# Skill: Generate API Endpoint

**Slash command:** `/generate-api`
**Category:** Backend Development
**Stack:** .NET 8 · Clean Architecture · ASP.NET Core

---

## Purpose

Generates a complete, production-ready API endpoint for TravelPort following all project conventions — from DTO to controller action — in a single prompt.

---

## When to Use

- Adding a new feature endpoint (e.g. "add coupon validation endpoint")
- Extending an existing service with a new operation
- Creating admin-only endpoints

---

## Usage

```
/generate-api <description of the endpoint>
```

**Examples:**
```
/generate-api add wallet top-up endpoint for users
/generate-api admin endpoint to deactivate a user account
/generate-api get flight booking details with payment info
```

---

## What Gets Generated

| Artifact | Location |
|----------|----------|
| Request / Response DTOs | `backend/src/Application/DTOs/<domain>/` |
| FluentValidation validator | `backend/src/Application/Validators/<domain>/` |
| Service interface method | `backend/src/Application/Services/Interfaces/I<Name>Service.cs` |
| Service implementation | `backend/src/Application/Services/<Name>Service.cs` |
| Controller action | `backend/src/API/Controllers/<Name>Controller.cs` |

---

## Project Conventions Applied

- No CQRS / MediatR — direct service injection
- Returns `ApiResponse<T>` wrapper on all actions
- Throws `NotFoundException` / `BusinessException` / `UnauthorizedException` — middleware handles HTTP mapping
- `CancellationToken` threaded through all async methods
- `IUnitOfWork.SaveChangesAsync()` called after all mutations
- `[Authorize]` / `[Authorize(Roles="Admin")]` applied automatically based on description
- FluentValidation auto-validation — no manual ModelState checks needed

---

## Example Output

**Prompt:** `/generate-api add wallet top-up endpoint`

```csharp
// Application/DTOs/Users/TopUpWalletRequest.cs
public record TopUpWalletRequest(decimal Amount);

// Application/Validators/Users/TopUpWalletRequestValidator.cs
public class TopUpWalletRequestValidator : AbstractValidator<TopUpWalletRequest>
{
    public TopUpWalletRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).LessThanOrEqualTo(50000);
    }
}

// Application/Services/Interfaces/IUserService.cs — added:
Task<WalletDto> TopUpWalletAsync(Guid userId, TopUpWalletRequest request, CancellationToken ct = default);

// API/Controllers/UsersController.cs — added:
[HttpPost("wallet/topup")]
public async Task<ActionResult<ApiResponse<WalletDto>>> TopUp(
    [FromBody] TopUpWalletRequest request, CancellationToken ct)
{
    var result = await _users.TopUpWalletAsync(CurrentUserId, request, ct);
    return Ok(ApiResponse<WalletDto>.Ok(result));
}
```
