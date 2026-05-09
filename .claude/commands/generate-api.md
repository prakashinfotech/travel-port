---
description: Generate a complete API endpoint for TravelPort (controller action + service method + DTOs + validator)
---

You are working on the **TravelPort** .NET 8 Clean Architecture backend.

## Project conventions
- **Layer structure:** Domain → Application → Infrastructure/Persistence → API
- **No CQRS/MediatR** — use direct service injection (e.g. `IFlightService`)
- **Response wrapper:** always return `ApiResponse<T>` from `TravelPort.Application.Common.Models`
- **Exceptions:** throw `NotFoundException`, `BusinessException`, or `UnauthorizedException` — the global middleware maps them
- **Auth:** `[Authorize]` on protected actions; read `CurrentUserId` from `BaseApiController`
- **Validation:** FluentValidation — create a `*Validator : AbstractValidator<T>` in `Application/Validators/`
- **DTOs** live in `Application/DTOs/<domain>/`
- **Services** live in `Application/Services/` with an interface in `Application/Services/Interfaces/`

## Task
Generate a complete endpoint for: **$ARGUMENTS**

Produce in order:
1. **DTO** (request + response if needed) in the correct `Application/DTOs/` subfolder
2. **FluentValidation validator** for the request DTO
3. **Service interface method** — add to the existing `I*Service` interface
4. **Service implementation** — implement in the existing `*Service` class using repositories + UnitOfWork
5. **Controller action** — add to the correct existing controller with proper `[Http*]`, `[Authorize]`, and `[FromBody/Query/Route]` attributes
6. **Registration** — note if any DI registration needs updating

Show each file with its full path relative to the `backend/src/` folder.
