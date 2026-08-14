# Skill: Maintain the Database Schema

**Command:** `/generate-migration`
**Stack:** SSDT/Microsoft.Build.Sql, SQL Server 2019+, EF Core 8

## Purpose

Maintain TravelPort's SQL Server schema with `backend/src/Database/TravelPort.Database.sqlproj` as the authoritative deployment source. The EF Core model and migration chain remain synchronized for application mapping and the explicitly enabled local-development fallback.

## Workflow

1. Update the domain entity and Fluent API configuration.
2. Update the corresponding SSDT table, index, constraint, stored procedure, function, view, or post-deployment script.
3. Generate and review an EF migration when the application model changes:

   ```bash
   dotnet ef migrations add <MigrationName> --project backend/src/Persistence --startup-project backend/src/API
   ```

4. Build the DACPAC:

   ```bash
   dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release
   ```

5. Publish the DACPAC to a disposable validation database and confirm the EF model matches it.
6. Generate a SqlPackage deployment script against the actual target and review it before publication.

## Conventions

- Use plural table names and `uniqueidentifier` primary keys named `Id`.
- Configure string lengths and money precision consistently in both SSDT and EF.
- Preserve `CreatedAt`, `UpdatedAt`, and nullable `DeletedAt` audit fields.
- Use safe delete behavior and explicitly review data-loss operations.
- Seed only non-sensitive catalogue data. Never seed accounts, passwords, tokens, or private bookings.
- Leave `Database:ApplyEfMigrations` disabled outside local development.

See [Database Design](../DATABASE_DESIGN.md) and [Database Deployment](../../database/README.md).
