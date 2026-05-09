# Skill: Generate Database Schema

**Slash command:** `/generate-migration` (for EF Core) or use the prompt template below for raw SQL
**Category:** Database
**Stack:** SQL Server 2022 · SSDT (.sqlproj)

---

## Purpose

Generates SQL Server DDL (tables, stored procedures, functions, views) following TravelPort's database conventions and adds them to the SSDT database project.

---

## When to Use

- Designing a new table in the SQL Database project
- Writing a new stored procedure for a complex transactional operation
- Creating a scalar/table-valued function for business logic
- Building a reporting view

---

## Usage (with prompt template)

Copy the prompt from [`.claude/prompts/database-schema.md`](../../.claude/prompts/database-schema.md) and fill in the task description.

---

## Naming Conventions

| Object | Prefix | Example |
|--------|--------|---------|
| Table | none | `Bookings` |
| Stored Procedure | `usp_` | `usp_BookFlight` |
| Scalar Function | `fn_` | `fn_CalculateDiscount` |
| Table-Valued Function | `fn_` | `fn_GetUserBookingStats` |
| View | `vw_` | `vw_AdminDashboard` |
| Index | `IX_` | `IX_Flights_OriginDestinationDate` |
| Unique Index | `UQ_` | `UQ_Users_Email` |

---

## Standard Column Set (every table)

```sql
Id          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
...
CreatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
UpdatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
DeletedAt   DATETIME2               NULL     -- soft delete
```

---

## Existing Objects Reference

### Tables
`Users` · `Flights` · `Hotels` · `HotelRooms` · `Bookings` · `Payments`
`Wallets` · `WalletTransactions` · `SavedTravellers` · `Coupons` · `AuditLogs` · `RefreshTokens`

### Stored Procedures
| Procedure | Purpose |
|-----------|---------|
| `usp_SearchFlights` | Paged, sorted flight search |
| `usp_SearchHotels` | Paged hotel search with star/price filter |
| `usp_BookFlight` | Atomic: seat decrement + coupon + audit log |
| `usp_CancelBooking` | 90% refund → wallet + seat restore |
| `usp_GetUserBookings` | Paged booking history with payment join |
| `usp_ProcessWalletTransaction` | Credit/debit with balance guard |

### Scalar Functions
| Function | Returns |
|----------|---------|
| `fn_GenerateBookingRef` | Unique booking reference (e.g. `TP-20250601-ABCD`) |
| `fn_CalculateDiscount` | Discount amount given coupon code + base price |
| `fn_GetWalletBalance` | Current balance for a user |

### Table-Valued Functions
| Function | Returns |
|----------|---------|
| `fn_GetUserBookingStats` | Booking counts per status for a user |

### Views
| View | Purpose |
|------|---------|
| `vw_FlightSearchResults` | Denormalised flight data for search |
| `vw_BookingSummary` | Booking + payment + user summary |
| `vw_AdminDashboard` | Aggregate stats (revenue, bookings, users) |

---

## SSDT Project Location

All SQL files live in:
```
backend/src/Database/
├── Tables/
├── StoredProcedures/
├── Functions/
├── Views/
└── Scripts/PostDeploy/
```

Files must be added as `<Build Include="..." />` entries in `TravelPort.Database.sqlproj`.
