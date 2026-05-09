# 🗄️ Database Design — TravelPort

## ER Diagram (Text Representation)

```
Users ──────────────── Bookings ──────── Payments
  │                       │
  │                 ┌─────┴──────┐
  │                 │            │
  │              Flights       Hotels
  │
  └── SavedTravellers
  └── Wallets ──── WalletTransactions
  └── Coupons

Flights ─── FlightRoutes ─── FlightSchedules
Hotels  ─── HotelRooms ───── RoomBookings
Buses   ─── BusRoutes ─────── BusSchedules
Trains  ─── TrainRoutes ───── TrainSchedules
```

---

## Core Tables

### Users
```sql
CREATE TABLE Users (
    UserId        UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name          NVARCHAR(100)     NOT NULL,
    Email         NVARCHAR(255)     NOT NULL UNIQUE,
    Phone         NVARCHAR(15),
    PasswordHash  NVARCHAR(500)     NOT NULL,
    Role          NVARCHAR(20)      NOT NULL DEFAULT 'User',  -- User | Admin
    IsVerified    BIT               NOT NULL DEFAULT 0,
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2,
    DeletedAt     DATETIME2         NULL,   -- Soft delete
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_Phone (Phone)
);
```

### Flights
```sql
CREATE TABLE Flights (
    FlightId      UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Airline       NVARCHAR(100)     NOT NULL,
    FlightNumber  NVARCHAR(20)      NOT NULL,
    Source        NVARCHAR(10)      NOT NULL,  -- IATA code
    Destination   NVARCHAR(10)      NOT NULL,
    DepartureTime DATETIME2         NOT NULL,
    ArrivalTime   DATETIME2         NOT NULL,
    Duration      INT               NOT NULL,  -- minutes
    TotalSeats    INT               NOT NULL,
    AvailableSeats INT              NOT NULL,
    EconomyPrice  DECIMAL(10,2)     NOT NULL,
    BusinessPrice DECIMAL(10,2),
    Stops         INT               NOT NULL DEFAULT 0,
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Flights_Route (Source, Destination),
    INDEX IX_Flights_Departure (DepartureTime)
);
```

### Hotels
```sql
CREATE TABLE Hotels (
    HotelId       UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name          NVARCHAR(200)     NOT NULL,
    City          NVARCHAR(100)     NOT NULL,
    Address       NVARCHAR(500),
    StarRating    DECIMAL(2,1)      NOT NULL,
    Description   NVARCHAR(MAX),
    Amenities     NVARCHAR(MAX),    -- JSON array
    Latitude      DECIMAL(9,6),
    Longitude     DECIMAL(9,6),
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Hotels_City (City),
    INDEX IX_Hotels_Rating (StarRating)
);
```

### HotelRooms
```sql
CREATE TABLE HotelRooms (
    RoomId        UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    HotelId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Hotels(HotelId),
    RoomType      NVARCHAR(50)      NOT NULL,  -- Standard | Deluxe | Suite
    PricePerNight DECIMAL(10,2)     NOT NULL,
    MaxGuests     INT               NOT NULL,
    TotalRooms    INT               NOT NULL,
    Amenities     NVARCHAR(MAX),    -- JSON
    IsActive      BIT               NOT NULL DEFAULT 1
);
```

### Bookings
```sql
CREATE TABLE Bookings (
    BookingId     UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    BookingRef    NVARCHAR(20)      NOT NULL UNIQUE,  -- TP2024XXXX
    UserId        UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(UserId),
    BookingType   NVARCHAR(20)      NOT NULL,  -- Flight | Hotel | Bus | Train
    ReferenceId   UNIQUEIDENTIFIER  NOT NULL,  -- FlightId/HotelId etc.
    TotalAmount   DECIMAL(10,2)     NOT NULL,
    DiscountAmount DECIMAL(10,2)    NOT NULL DEFAULT 0,
    FinalAmount   DECIMAL(10,2)     NOT NULL,
    Status        NVARCHAR(20)      NOT NULL DEFAULT 'Pending',
    -- Pending | Confirmed | Cancelled | Refunded
    CancelledAt   DATETIME2         NULL,
    RefundAmount  DECIMAL(10,2),
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2,
    INDEX IX_Bookings_User (UserId),
    INDEX IX_Bookings_Status (Status),
    INDEX IX_Bookings_Ref (BookingRef)
);
```

### Payments
```sql
CREATE TABLE Payments (
    PaymentId         UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    BookingId         UNIQUEIDENTIFIER  NOT NULL REFERENCES Bookings(BookingId),
    Method            NVARCHAR(30)      NOT NULL,  -- Card | UPI | NetBanking | Wallet
    GatewayOrderId    NVARCHAR(100),
    GatewayPaymentId  NVARCHAR(100),
    Amount            DECIMAL(10,2)     NOT NULL,
    Status            NVARCHAR(20)      NOT NULL,  -- Pending | Success | Failed | Refunded
    PaidAt            DATETIME2,
    CreatedAt         DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Payments_Booking (BookingId)
);
```

### Wallets
```sql
CREATE TABLE Wallets (
    WalletId   UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId     UNIQUEIDENTIFIER  NOT NULL UNIQUE REFERENCES Users(UserId),
    Balance    DECIMAL(10,2)     NOT NULL DEFAULT 0,
    UpdatedAt  DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE WalletTransactions (
    TransactionId  UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    WalletId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Wallets(WalletId),
    Type           NVARCHAR(20)      NOT NULL,  -- Credit | Debit
    Amount         DECIMAL(10,2)     NOT NULL,
    Description    NVARCHAR(200),
    ReferenceId    UNIQUEIDENTIFIER, -- BookingId
    CreatedAt      DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

### SavedTravellers
```sql
CREATE TABLE SavedTravellers (
    TravellerId  UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(UserId),
    Name         NVARCHAR(100)     NOT NULL,
    Email        NVARCHAR(255),
    Phone        NVARCHAR(15),
    DOB          DATE,
    PassportNo   NVARCHAR(50),
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

### Coupons
```sql
CREATE TABLE Coupons (
    CouponId     UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Code         NVARCHAR(30)      NOT NULL UNIQUE,
    Type         NVARCHAR(20)      NOT NULL,  -- Percentage | Fixed
    Value        DECIMAL(10,2)     NOT NULL,
    MinAmount    DECIMAL(10,2)     NOT NULL DEFAULT 0,
    MaxDiscount  DECIMAL(10,2),
    UsageLimit   INT,
    UsedCount    INT               NOT NULL DEFAULT 0,
    ExpiresAt    DATETIME2,
    IsActive     BIT               NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

### AuditLogs
```sql
CREATE TABLE AuditLogs (
    LogId      UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId     UNIQUEIDENTIFIER,
    Action     NVARCHAR(100)     NOT NULL,
    Entity     NVARCHAR(100)     NOT NULL,
    EntityId   NVARCHAR(100),
    OldValues  NVARCHAR(MAX),
    NewValues  NVARCHAR(MAX),
    IpAddress  NVARCHAR(50),
    CreatedAt  DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

---

## Indexing Strategy

| Table     | Index Columns             | Type      | Reason                   |
|-----------|---------------------------|-----------|--------------------------|
| Flights   | Source, Destination       | Composite | Route search             |
| Flights   | DepartureTime             | Single    | Date-based search        |
| Hotels    | City                      | Single    | City search              |
| Bookings  | UserId, Status            | Composite | User booking history     |
| Users     | Email                     | Unique    | Login lookup             |
| Coupons   | Code                      | Unique    | Coupon validation        |

---

## Soft Delete Strategy

All major tables include `DeletedAt DATETIME2 NULL`.
EF Core Global Query Filter: `.HasQueryFilter(e => e.DeletedAt == null)`

---

## Audit Fields Pattern

Every entity inherits from `BaseEntity`:
```csharp
public abstract class BaseEntity {
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
```
