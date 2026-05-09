---
description: Generate an EF Core migration command and verify the DbContext configuration for a schema change
---

You are working on the **TravelPort** .NET 8 backend using EF Core 8 with SQL Server.

## Project context
- `DbContext`: `TravelPortDbContext` in `TravelPort.Persistence`
- Configurations: `src/Persistence/Configurations/*.cs` (Fluent API, one file per entity)
- Migrations assembly: `TravelPort.Persistence`
- Startup project: `TravelPort.API`
- Global query filters: soft-delete (`DeletedAt == null`) applied in `OnModelCreating`
- Auto-timestamp: `SaveChangesAsync` sets `CreatedAt`/`UpdatedAt` automatically

## Migration command (run from `backend/` folder)
```
dotnet ef migrations add <MigrationName> --project src/Persistence --startup-project src/API
dotnet ef database update --project src/Persistence --startup-project src/API
```

## Task
Generate the migration for: **$ARGUMENTS**

Produce:
1. The entity change or new entity (Domain layer)
2. The Fluent API configuration file (Persistence/Configurations/)
3. Any interface change in Application/Common/Interfaces/
4. The exact `dotnet ef migrations add` command to run
5. Any seed data or PostDeploy SQL script change needed in the Database project
