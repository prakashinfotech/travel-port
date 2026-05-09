# Database Schema Prompt

Use this prompt to generate SQL Server schema definitions, stored procedures, functions, and views for TravelPort.

---

## Prompt Template

```
You are a SQL Server DBA designing schema for TravelPort, a travel booking platform.

### Database conventions
- SQL Server 2022, compatibility level 150
- All PKs: UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() (reduces index fragmentation)
- All tables: CreatedAt DATETIME2 DEFAULT GETUTCDATE(), UpdatedAt DATETIME2, DeletedAt DATETIME2 NULL (soft delete)
- Foreign keys with ON DELETE NO ACTION (application handles cascades)
- Filtered indexes on DeletedAt IS NULL for active-record queries
- NVARCHAR for all variable-length strings (Unicode support)
- DECIMAL(18,2) for all monetary amounts
- Schema: dbo (default)
- Naming: PascalCase tables/columns, usp_ prefix for stored procs, fn_ prefix for functions, vw_ prefix for views

### Current tables
Users, Flights, Hotels, HotelRooms, Bookings, Payments, Wallets,
WalletTransactions, SavedTravellers, Coupons, AuditLogs, RefreshTokens

### Task
Generate: [DESCRIBE TABLE, PROCEDURE, FUNCTION, OR VIEW]
```

---

## Table Template
```sql
CREATE TABLE dbo.[TableName]
(
    Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
    -- domain columns
    CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    DeletedAt       DATETIME2               NULL,

    CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
);

CREATE INDEX IX_TableName_ActiveRecords
    ON dbo.TableName (CreatedAt DESC)
    WHERE DeletedAt IS NULL;
```

---

## Stored Procedure Template
```sql
CREATE OR ALTER PROCEDURE dbo.usp_ProcedureName
    @Param1 UNIQUEIDENTIFIER,
    @Param2 NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- work
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
```

---

## Scalar Function Template
```sql
CREATE OR ALTER FUNCTION dbo.fn_FunctionName
(
    @Param UNIQUEIDENTIFIER
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Result DECIMAL(18,2);
    SELECT @Result = ...;
    RETURN ISNULL(@Result, 0);
END;
```

---

## Existing Stored Procedures Reference

| Procedure | Purpose |
|-----------|---------|
| `usp_SearchFlights` | Paged flight search with price/duration sort |
| `usp_SearchHotels` | Paged hotel search with star/price filter |
| `usp_BookFlight` | Transactional booking: seat decrement + coupon + audit |
| `usp_CancelBooking` | 90% refund → wallet credit + seat restore |
| `usp_GetUserBookings` | Paged user booking history with payment join |
| `usp_ProcessWalletTransaction` | Credit/debit with balance check |

## Existing Functions Reference

| Function | Returns |
|----------|---------|
| `fn_GenerateBookingRef` | Unique booking reference string |
| `fn_CalculateDiscount` | Discount amount given coupon + base price |
| `fn_GetWalletBalance` | Current wallet balance for a user |
| `fn_GetUserBookingStats` | Table-valued: booking counts by status |
