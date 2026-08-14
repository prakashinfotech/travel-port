# Testing Generation Prompt

Use this prompt to generate xUnit tests (backend) and Vitest tests (frontend) for TravelPort.

---

## Backend — xUnit Prompt Template

```
You are a senior .NET 8 engineer writing xUnit tests for the TravelPort backend.

### Test project setup
- Project: TravelPort.Application.Tests (xUnit 2.x)
- Dependencies: Moq, FluentAssertions, Microsoft.EntityFrameworkCore.InMemory
- Test target: Application layer services (no infrastructure dependencies in unit tests)

### Conventions
- Class name: <ServiceName>Tests
- Method name: <Method>_<Scenario>_<ExpectedOutcome>
  Examples:
    LoginAsync_ValidCredentials_ReturnsAuthResponse
    RegisterAsync_DuplicateEmail_ThrowsBusinessException
    BookAsync_InsufficientSeats_ThrowsBusinessException
- Structure: Arrange / Act / Assert (blank lines between sections)
- Use Mock<IRepository>.Setup().ReturnsAsync() for repository mocks
- Use FluentAssertions: result.Should().NotBeNull(), action.Should().ThrowAsync<NotFoundException>()
- Use CancellationToken.None in all async calls

### Scenarios to cover for every service method
1. Happy path — returns expected result
2. Not found — throws NotFoundException when entity missing
3. Business rule violation — throws BusinessException
4. Unauthorized — throws UnauthorizedException when applicable
5. Validation edge cases (null, empty, boundary values)

### Task
Generate xUnit tests for: [SERVICE CLASS AND METHOD]

Reference the actual implementation in src/Application/Services/<ServiceName>.cs.
Mock all interfaces injected into the constructor.
```

---

## Frontend — Vitest Prompt Template

```
You are a senior React engineer writing Vitest + React Testing Library tests for TravelPort.

### Test setup
- Framework: Vitest + @testing-library/react + @testing-library/user-event
- Mock API services: vi.mock('@/services/flightService') etc.
- Redux wrapper: renderWithProviders(ui, { preloadedState }) helper
- Router wrapper: wrap with MemoryRouter or use renderWithProviders

### Conventions
- File: <ComponentName>.test.tsx colocated or in __tests__/
- Describe block per component, it() blocks per scenario
- Always test: renders correctly, user interaction, loading state, error state, success state
- Use screen.getByRole / getByText / getByLabelText (not getByTestId)
- Use userEvent.click(), userEvent.type() — never fireEvent
- Mock return values: vi.mocked(service.method).mockResolvedValue({ data: mockDto, ... })

### Scenarios to cover for every page/form
1. Renders without crashing (smoke test)
2. Shows loading skeleton while fetching
3. Shows error message on API failure
4. Shows data correctly on success
5. Form validation errors shown on invalid submit
6. Successful form submission calls service and navigates

### Task
Generate Vitest tests for: [COMPONENT OR PAGE NAME]

Reference the actual component in src/pages/ or src/components/.
```

---

## Test Data Fixtures

### Backend mock entities
```csharp
var user = new User { Id = Guid.NewGuid(), Name = "Test User", Email = "test@example.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"), Role = UserRole.User, IsActive = true };

var flight = new Flight { Id = Guid.NewGuid(), FlightNumber = "AI101", Airline = "Air India",
    Origin = "DEL", Destination = "BOM", Price = 5000, AvailableSeats = 100 };
```

### Frontend mock DTOs
```typescript
const mockFlight: FlightDto = {
  id: '1', flightNumber: 'AI101', airline: 'Air India',
  origin: 'DEL', destination: 'BOM',
  departureTime: '2025-06-01T06:00:00Z', arrivalTime: '2025-06-01T08:00:00Z',
  durationMinutes: 120, cabinClass: 'Economy', price: 5000, availableSeats: 50
}
```
