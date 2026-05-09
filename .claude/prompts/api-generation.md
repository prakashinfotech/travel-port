# API Generation Prompt

Use this prompt to generate .NET 8 API controllers, services, and DTOs for TravelPort.

---

## Prompt Template

```
You are a senior .NET 8 engineer building the TravelPort travel booking API using Clean Architecture.

### Architecture
- Domain layer: entities, enums, no dependencies
- Application layer: DTOs, service interfaces, service implementations, FluentValidation validators
- Persistence layer: EF Core DbContext, repositories, UnitOfWork
- API layer: ASP.NET Core 8 controllers, middleware, Program.cs

### Conventions
- No CQRS or MediatR — use direct service injection
- All controllers inherit BaseApiController (provides CurrentUserId from JWT sub claim)
- All endpoints return ApiResponse<T> with .Ok() / .Fail() / .Paged() factory methods
- Throw NotFoundException / BusinessException / UnauthorizedException — global middleware handles mapping to HTTP codes
- FluentValidation auto-validation is enabled — validators run automatically on model binding
- Use CancellationToken in all async methods
- Repository pattern: IRepository<T> generic + specific typed interfaces
- SaveChangesAsync via IUnitOfWork after all mutations
- Soft-delete: set DeletedAt, never hard-delete

### Task
Generate a complete API endpoint for: [DESCRIBE FEATURE]

Include:
1. Request/Response DTOs in Application/DTOs/<domain>/
2. FluentValidation validator for the request
3. Service interface method signature
4. Service implementation using repositories
5. Controller action with correct HTTP verb, route, and auth attributes
6. Any new repository method needed (interface + implementation)
```

---

## Example Output Structure

```
// Application/DTOs/Flights/BookFlightRequest.cs
public record BookFlightRequest(Guid FlightId, int Passengers, string? CouponCode);

// Application/Validators/Flights/BookFlightRequestValidator.cs
public class BookFlightRequestValidator : AbstractValidator<BookFlightRequest> { ... }

// Application/Services/Interfaces/IFlightService.cs — add method:
Task<BookingCreatedResponse> BookAsync(Guid userId, BookFlightRequest request, CancellationToken ct);

// Application/Services/FlightService.cs — implement:
public async Task<BookingCreatedResponse> BookAsync(...) { ... }

// API/Controllers/FlightsController.cs — add action:
[HttpPost("book")]
[Authorize]
public async Task<ActionResult<ApiResponse<BookingCreatedResponse>>> Book([FromBody] BookFlightRequest request, CancellationToken ct)
```

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `src/API/Controllers/BaseApiController.cs` | `CurrentUserId` property |
| `src/Application/Common/Models/ApiResponse.cs` | Response wrapper factory |
| `src/Application/Common/Exceptions/` | NotFoundException, BusinessException, UnauthorizedException |
| `src/Persistence/Context/TravelPortDbContext.cs` | All DbSets |
| `src/Application/Common/Interfaces/IUnitOfWork.cs` | SaveChangesAsync |
