---
description: Generate synchronized SSDT and EF Core changes for a database schema update
---

You are working on the **TravelPort** .NET 8 backend using SSDT/Microsoft.Build.Sql and EF Core 8 with SQL Server. The SSDT project is the deployment authority; EF migrations are a synchronized local-development fallback.

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
dotnet build src/Database/TravelPort.Database.sqlproj --configuration Release
```

## Task
Generate the migration for: **$ARGUMENTS**

Produce:
1. The entity change or new entity (Domain layer)
2. The Fluent API configuration file (Persistence/Configurations/)
3. Any interface change in Application/Common/Interfaces/
4. The exact `dotnet ef migrations add` command to keep the EF model synchronized
5. The SSDT table/object and PostDeploy changes
6. The DACPAC build and SqlPackage validation commands
