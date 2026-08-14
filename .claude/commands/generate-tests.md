---
description: Generate xUnit tests (backend) or Vitest tests (frontend) for a TravelPort service or component
---

You are working on the **TravelPort** project.

## Backend — xUnit (.NET 8)
- Test project: `backend/tests/TravelPort.Application.Tests/`
- Use `Moq` for mocking interfaces (`IUserRepository`, `IUnitOfWork`, `IJwtService`, etc.)
- Use `FluentAssertions` for readable assertions
- Test class naming: `<ServiceName>Tests`
- Method naming: `<Method>_<Scenario>_<ExpectedOutcome>` (e.g. `LoginAsync_InvalidPassword_ThrowsUnauthorizedException`)
- Arrange / Act / Assert sections with blank line separation
- Use `CancellationToken.None` for all async calls in tests
- Cover: happy path, validation failure, not-found, business rule violation, unauthorized

## Frontend — Vitest + React Testing Library
- Test files: `*.test.tsx` colocated with the component or in `__tests__/`
- Mock API services with `vi.mock('@/services/...')`
- Use `renderWithProviders` helper that wraps with Redux `<Provider>` and `<BrowserRouter>`
- Test: renders correctly, form validation errors, successful submission, loading state, error state
- Use `userEvent` for interactions (not `fireEvent`)

## Task
Generate tests for: **$ARGUMENTS**

Specify whether backend (xUnit) or frontend (Vitest). If unclear, generate both.

Produce:
1. Full test file with path
2. Any required test helpers or fixtures
3. List of scenarios covered
