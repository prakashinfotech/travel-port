# Skill: Generate EF Core Migration

**Slash command:** `/generate-migration`
**Category:** Database
**Stack:** EF Core 8 · SQL Server · TravelPort.Persistence

---

## Purpose

Generates everything needed to add or modify a database table via EF Core — entity changes, Fluent API configuration, repository updates, and the exact migration commands to run.

---

## When to Use

- Adding a new entity/table to the domain
- Modifying an existing entity (new column, index, relationship)
- Adding a new index or constraint

---

## Usage

```
/generate-migration <description of schema change>
```

**Examples:**
```
/generate-migration add Notifications table for user alerts
/generate-migration add PassengerCount column to Bookings
/generate-migration add composite index on Flights (Origin, Destination, DepartureDate)
```

---

## What Gets Generated

| Artifact | Location |
|----------|----------|
| Entity class (new/modified) | `backend/src/Domain/Entities/<Name>.cs` |
| EF Core configuration | `backend/src/Persistence/Configurations/<Name>Configuration.cs` |
| DbSet registration | `backend/src/Persistence/Context/TravelPortDbContext.cs` |
| Repository interface (if new) | `backend/src/Application/Common/Interfaces/I<Name>Repository.cs` |
| Repository implementation | `backend/src/Persistence/Repositories/<Name>Repository.cs` |
| DI registration | `backend/src/Persistence/DependencyInjection.cs` |
| Migration command | Terminal command to run |
| SQL table (optional) | `backend/src/Database/Tables/<Name>.sql` |

---

## Migration Commands

Run from the `backend/` directory:

```bash
# Create migration
dotnet ef migrations add <MigrationName> \
  --project src/Persistence \
  --startup-project src/API

# Apply to database
dotnet ef database update \
  --project src/Persistence \
  --startup-project src/API

# Revert last migration (if needed)
dotnet ef migrations remove \
  --project src/Persistence \
  --startup-project src/API
```

---

## EF Core Conventions Used in This Project

| Convention | Implementation |
|-----------|---------------|
| Soft delete | `DeletedAt DATETIME2 NULL` + global query filter in `OnModelCreating` |
| Auto timestamps | `SaveChangesAsync` override sets `CreatedAt` / `UpdatedAt` |
| PK type | `Guid` — mapped to `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` |
| String length | Always set `HasMaxLength()` — no `nvarchar(max)` for indexed columns |
| Decimal precision | `.HasPrecision(18, 2)` for all money columns |
| Table naming | Plural (e.g. `Users`, `Flights`) via `ToTable()` |
| FK naming | `HasForeignKey` with `OnDelete(DeleteBehavior.Restrict)` |

---

## Example Output

**Prompt:** `/generate-migration add Notifications table`

```csharp
// Domain/Entities/Notification.cs
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public User User { get; set; } = null!;
}

// Persistence/Configurations/NotificationConfiguration.cs
public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasQueryFilter(x => x.DeletedAt == null);
        b.HasIndex(x => new { x.UserId, x.IsRead });
    }
}
```

```bash
dotnet ef migrations add AddNotificationsTable --project src/Persistence --startup-project src/API
```
