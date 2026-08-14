# Skill: Generate Tests

**Slash command:** `/generate-tests`
**Category:** Quality Assurance
**Stack:** xUnit · Moq · FluentAssertions (backend) · Vitest · React Testing Library (frontend)

---

## Purpose

Generates comprehensive test suites for TravelPort backend services (xUnit) or frontend components (Vitest), covering happy path, error cases, and boundary conditions.

---

## When to Use

- After implementing a new service method
- After building a new React component or page
- When increasing test coverage before a release

---

## Usage

```
/generate-tests <service or component name> [backend|frontend]
```

**Examples:**
```
/generate-tests BookingService backend
/generate-tests LoginForm frontend
/generate-tests FlightService.BookAsync backend
/generate-tests FlightsPage frontend
```

---

## What Gets Generated

### Backend (xUnit)
| Artifact | Location |
|----------|----------|
| Test class | `backend/tests/TravelPort.Application.Tests/<domain>/<Name>Tests.cs` |
| Mock setup | Inline using `Moq` |
| Assertions | `FluentAssertions` |

### Frontend (Vitest)
| Artifact | Location |
|----------|----------|
| Test file | `frontend/src/<path>/<Name>.test.tsx` |
| Service mocks | `vi.mock('@/services/...')` |
| Provider wrapper | `renderWithProviders` helper |

---

## Scenario Coverage

Every generated test suite covers:

| # | Scenario | Backend | Frontend |
|---|----------|---------|----------|
| 1 | Happy path — returns expected result | ✅ | ✅ |
| 2 | Not found — throws NotFoundException | ✅ | — |
| 3 | Business rule violation — throws BusinessException | ✅ | — |
| 4 | Unauthorized access | ✅ | ✅ |
| 5 | Validation failure | ✅ | ✅ |
| 6 | Loading state rendered | — | ✅ |
| 7 | Error state rendered | — | ✅ |
| 8 | Form submission calls service | — | ✅ |

### Validator Test Pattern (xUnit + FluentValidation)

All validator tests follow the factory-method pattern with C# `with` expressions:

```csharp
private static BookHotelRequest ValidRequest() => new(...); // all-valid baseline

// Positive: accept valid values
[Fact] void Validator_AcceptsFullyValidRequest() => Assert.True(_validator.Validate(ValidRequest()).IsValid);

// Negative: override one field at a time
[Fact] void Validator_RejectsEmptyHotelId() {
    var result = _validator.Validate(ValidRequest() with { HotelId = Guid.Empty });
    Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.HotelId));
}
```

**Conventions:**
- Optional fields (`When(x => !IsNullOrWhiteSpace(x.Email))`) — test both null (accept) and invalid string (reject)
- Case-insensitive enums — test lowercase, uppercase, and invalid values
- Boundary numbers — test exact min-1, min, max, max+1
- Remove FluentValidation AspNetCore-incompatible edge cases (e.g. `"spaces in@email.com"` passes `.EmailAddress()`)

**Current coverage:** 562 tests across 28 validator test classes — 0 failures.

---

## Example Output (Backend)

**Prompt:** `/generate-tests AuthService.LoginAsync backend`

```csharp
public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IRefreshTokenRepository> _tokens = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IJwtService> _jwt = new();
    private AuthService CreateSut() => new(_users.Object, _tokens.Object, _uow.Object, _jwt.Object);

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
    {
        var user = new User { Email = "test@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"), IsActive = true };
        _users.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns("access-token");
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh-token");

        var result = await CreateSut().LoginAsync(new LoginRequest("test@example.com", "Pass123!"));

        result.Should().NotBeNull();
        result.AccessToken.Should().Be("access-token");
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorizedException()
    {
        var user = new User { Email = "test@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct"), IsActive = true };
        _users.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var act = () => CreateSut().LoginAsync(new LoginRequest("test@example.com", "wrong"));

        await act.Should().ThrowAsync<UnauthorizedException>();
    }
}
```
