# Skill: Generate a Database Schema Change

**Slash command:** `/generate-migration`
**Category:** Database
**Stack:** SSDT/Microsoft.Build.Sql, EF Core 8, SQL Server 2019+

## Purpose

Create synchronized SSDT and EF Core changes. `backend/src/Database/TravelPort.Database.sqlproj` is the authoritative deployment source; EF migrations preserve application-model compatibility and the optional local fallback.

## Use this for

- Adding or changing a table, column, index, key, or relationship
- Adding or changing a stored procedure, function, view, or seed record
- Updating an entity or Fluent API mapping

## Required artifacts

| Artifact | Location |
|---|---|
| Domain entity | `backend/src/Domain/Entities/` |
| EF configuration and DbSet | `backend/src/Persistence/` |
| EF compatibility migration | `backend/src/Persistence/Migrations/` |
| SSDT schema/program object | `backend/src/Database/` |
| Deployment DACPAC | `backend/src/Database/bin/Release/TravelPort.Database.dacpac` |

## Workflow

1. Update the entity, Fluent API mapping, and repository interfaces as needed.
2. Update the equivalent SSDT table and any dependent program objects.
3. Generate and review an EF migration:

   ```bash
   dotnet ef migrations add <MigrationName> --project backend/src/Persistence --startup-project backend/src/API
   ```

4. Build the authoritative DACPAC:

   ```bash
   dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release
   ```

5. Publish it to a disposable validation database and run the backend tests.
6. Generate a target-specific deployment script before any shared deployment:

   ```bash
   sqlpackage /Action:Script \
     /SourceFile:backend/src/Database/bin/Release/TravelPort.Database.dacpac \
     /TargetConnectionString:"<target-connection-string>" \
     /OutputPath:TravelPort.deploy.sql \
     /p:BlockOnPossibleDataLoss=True
   ```

## Conventions

- Plural table names and `uniqueidentifier` primary keys named `Id`
- Explicit string lengths, indexes, precision, and delete behavior
- `CreatedAt`, `UpdatedAt`, and nullable `DeletedAt` audit fields
- No accounts, passwords, tokens, private bookings, or other secrets in PostDeploy data
- `Database:ApplyEfMigrations=false` in shared environments
