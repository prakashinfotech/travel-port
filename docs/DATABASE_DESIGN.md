# 🗄️ Database Design — TravelPort

## ER Diagram (Text Representation)

```
Users ──────────────────────── Bookings
  │  └── HotelId (FK→Hotels)      │
  │                          ┌────┴──────┐
  │                          │           │
  │                       Flights     Hotels ──── HotelRooms
  │                                      └───── HotelReviews ←── Users
  │
  └── SavedTravellers
  └── SavedCards
  └── Wallets ──── WalletTransactions
  └── RefreshTokens

Hotels  ─── HotelRooms
Hotels  ─── HotelReviews
Coupons (global — referenced by Bookings.CouponCode)
```

---

## Core Tables

### Users
```sql
CREATE TABLE Users (
    Id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name          NVARCHAR(100)     NOT NULL,
    Email         NVARCHAR(255)     NOT NULL UNIQUE,
    Phone         NVARCHAR(15),
    PasswordHash  NVARCHAR(500)     NOT NULL,
    Role          NVARCHAR(20)      NOT NULL DEFAULT 'User',
    -- Role values: 'User' | 'Admin' | 'Hotel'
    HotelId       UNIQUEIDENTIFIER  NULL REFERENCES Hotels(Id),
    -- Populated for Hotel-role users; NULL for User and Admin roles
    IsVerified    BIT               NOT NULL DEFAULT 0,
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2,
    DeletedAt     DATETIME2         NULL,   -- Soft delete
    INDEX IX_Users_Email (Email)
);
```

### Flights
```sql
CREATE TABLE Flights (
    Id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Airline       NVARCHAR(100)     NOT NULL,
    FlightNumber  NVARCHAR(20)      NOT NULL,
    Source        NVARCHAR(10)      NOT NULL,  -- IATA code (e.g. BOM, DEL)
    Destination   NVARCHAR(10)      NOT NULL,
    DepartureTime DATETIME2         NOT NULL,
    ArrivalTime   DATETIME2         NOT NULL,
    Duration      INT               NOT NULL,  -- minutes
    TotalSeats    INT               NOT NULL,
    AvailableSeats INT              NOT NULL,
    EconomyPrice           DECIMAL(10,2)     NOT NULL,
    BusinessPrice          DECIMAL(10,2),
    Stops                  INT               NOT NULL DEFAULT 0,
    LayoverAirport         NVARCHAR(10)      NULL,  -- IATA code, populated when Stops = 1
    LayoverDurationMinutes INT               NULL,  -- minutes, populated when Stops = 1
    IsActive               BIT               NOT NULL DEFAULT 1,
    CreatedAt              DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Flights_Route (Source, Destination),
    INDEX IX_Flights_Departure (DepartureTime)
);
```

### Hotels
```sql
CREATE TABLE Hotels (
    Id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name          NVARCHAR(200)     NOT NULL,
    City          NVARCHAR(100)     NOT NULL,
    Address       NVARCHAR(500),
    StarRating    DECIMAL(2,1)      NOT NULL,
    Description   NVARCHAR(MAX),
    Amenities     NVARCHAR(MAX),    -- JSON array e.g. ["Pool","WiFi","Gym"]
    ImageUrl      NVARCHAR(500),    -- Primary image URL
    Images        NVARCHAR(MAX),    -- JSON array of gallery image URLs (nullable)
    ReviewScore   DECIMAL(3,1)      NOT NULL DEFAULT 0,
    ReviewCount   INT               NOT NULL DEFAULT 0,
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    DeletedAt     DATETIME2         NULL,
    INDEX IX_Hotels_City (City),
    INDEX IX_Hotels_Rating (StarRating)
);
```

### HotelReviews
```sql
CREATE TABLE HotelReviews (
    Id        UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    HotelId   UNIQUEIDENTIFIER  NOT NULL REFERENCES Hotels(Id),
    UserId    UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    Rating    INT               NOT NULL,  -- 1–5
    Comment   NVARCHAR(MAX)     NOT NULL,
    CreatedAt DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    DeletedAt DATETIME2         NULL,
    INDEX IX_HotelReviews_Hotel (HotelId),
    INDEX IX_HotelReviews_User  (UserId)
);
```

One review per user per hotel enforced at the service layer. `Hotels.ReviewScore` and `Hotels.ReviewCount` are updated atomically when a review is created or deleted.

### HotelRooms
```sql
CREATE TABLE HotelRooms (
    Id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    HotelId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Hotels(Id),
    RoomType      NVARCHAR(100)     NOT NULL,  -- e.g. Standard | Deluxe | Suite
    PricePerNight DECIMAL(10,2)     NOT NULL,
    MaxGuests     INT               NOT NULL,
    TotalRooms    INT               NOT NULL,
    Amenities     NVARCHAR(MAX),    -- JSON array e.g. ["AC","TV","WiFi"]
    Images        NVARCHAR(MAX),    -- JSON array of room image URLs (nullable)
    IsActive      BIT               NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    DeletedAt     DATETIME2         NULL
);
```

### Bookings
```sql
CREATE TABLE Bookings (
    Id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    BookingRef    NVARCHAR(20)      NOT NULL UNIQUE,
    -- Format: FL2026XXXXXX (flights) | HT2026XXXXXX (hotels)
    UserId        UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    BookingType   NVARCHAR(20)      NOT NULL,  -- 'Flight' | 'Hotel' | 'Bus' | 'Train'
    ReferenceId   UNIQUEIDENTIFIER  NOT NULL,  -- FlightId or HotelId
    TotalAmount   DECIMAL(10,2)     NOT NULL,
    DiscountAmount DECIMAL(10,2)    NOT NULL DEFAULT 0,
    FinalAmount   DECIMAL(10,2)     NOT NULL,
    Status        NVARCHAR(20)      NOT NULL DEFAULT 'Pending',
    -- Status: 'Pending' | 'Confirmed' | 'Cancelled'
    -- Flight booking fields
    Passengers    INT,
    CabinClass    NVARCHAR(20),
    -- Hotel booking fields
    CheckIn       DATETIME2,
    CheckOut      DATETIME2,
    -- Guest / traveller details (stored per booking)
    GuestName     NVARCHAR(200),
    GuestEmail    NVARCHAR(255),
    GuestPhone    NVARCHAR(20),
    -- Coupon
    CouponCode    NVARCHAR(30),
    CancelledAt   DATETIME2         NULL,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2,
    DeletedAt     DATETIME2         NULL,
    INDEX IX_Bookings_User (UserId),
    INDEX IX_Bookings_Status (Status),
    INDEX IX_Bookings_Ref (BookingRef),
    INDEX IX_Bookings_Reference (ReferenceId)
);
```

### Wallets
```sql
CREATE TABLE Wallets (
    Id         UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId     UNIQUEIDENTIFIER  NOT NULL UNIQUE REFERENCES Users(Id),
    Balance    DECIMAL(10,2)     NOT NULL DEFAULT 0,
    UpdatedAt  DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE WalletTransactions (
    Id           UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    WalletId     UNIQUEIDENTIFIER  NOT NULL REFERENCES Wallets(Id),
    Type         NVARCHAR(20)      NOT NULL,  -- 'Credit' | 'Debit'
    Amount       DECIMAL(10,2)     NOT NULL,
    Description  NVARCHAR(200),
    ReferenceId  UNIQUEIDENTIFIER, -- BookingId
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

### SavedCards
```sql
CREATE TABLE SavedCards (
    Id           UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    Last4        NVARCHAR(4)       NOT NULL,  -- ONLY last 4 digits — no full PAN stored
    CardBrand    NVARCHAR(20),                -- 'Visa' | 'Mastercard' | 'Rupay' etc.
    ExpiryMonth  INT               NOT NULL,
    ExpiryYear   INT               NOT NULL,
    CardHolder   NVARCHAR(100)     NOT NULL,
    IsDefault    BIT               NOT NULL DEFAULT 0,
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    DeletedAt    DATETIME2         NULL
);
```

### SavedTravellers
```sql
CREATE TABLE SavedTravellers (
    Id           UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    Name         NVARCHAR(100)     NOT NULL,
    Email        NVARCHAR(255),
    Phone        NVARCHAR(15),
    DOB          DATE,
    PassportNo   NVARCHAR(50),
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    DeletedAt    DATETIME2         NULL
);
```

### Coupons
```sql
CREATE TABLE Coupons (
    Id           UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Code         NVARCHAR(30)      NOT NULL UNIQUE,
    Type         NVARCHAR(20)      NOT NULL,  -- 'Percentage' | 'Fixed'
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

### RefreshTokens
```sql
CREATE TABLE RefreshTokens (
    Id           UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId       UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    TokenHash    NVARCHAR(500)     NOT NULL,
    ExpiresAt    DATETIME2         NOT NULL,
    RevokedAt    DATETIME2         NULL,
    CreatedAt    DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

---

## Seed Data (DataSeeder)

| Entity | Count |
|---|---|
| Users | 4 (1 Admin, 3 Users) + hotel managers created dynamically |
| Flights | 900+ across 42 routes, 7 airlines, 14 date slots |
| Hotels | 60+ across 12 Indian cities |
| Hotel Rooms | 120+ room types across all hotels |
| Coupons | 11 (flight-specific + hotel-specific + universal) |
| Bookings | Sample confirmed bookings for John (flight + hotel) |

---

## Relationships

| Relationship | Type | Notes |
|---|---|---|
| User → Wallet | 1:1 | Created on registration |
| User → Bookings | 1:N | All booking types |
| User → SavedCards | 1:N | Soft-deleted |
| User → SavedTravellers | 1:N | Soft-deleted |
| User → Hotel (HotelId) | N:1 (nullable) | Only Hotel-role users have this set |
| Hotel → HotelRooms | 1:N | Soft-deleted |
| Hotel → HotelReviews | 1:N | One per user per hotel; score/count denormalised on Hotel |
| HotelReview → User | N:1 | |
| Hotel → User (manager) | 1:1 (via HotelId) | One manager per hotel |
| Booking → User | N:1 | |
| Booking → Flight/Hotel | N:1 (via ReferenceId) | Polymorphic reference |
| Wallet → WalletTransactions | 1:N | |

---

## Indexing Strategy

| Table | Index Columns | Type | Reason |
|---|---|---|---|
| Flights | Source, Destination | Composite | Route search |
| Flights | DepartureTime | Single | Date-based search |
| Hotels | City | Single | City search |
| Hotels | StarRating | Single | Rating filter |
| Bookings | UserId, Status | Composite | User booking history |
| Bookings | ReferenceId | Single | Hotel booking lookups |
| Users | Email | Unique | Login lookup |
| Coupons | Code | Unique | Coupon validation |

---

## Soft Delete Strategy

All major tables include `DeletedAt DATETIME2 NULL`.
EF Core Global Query Filter: `.HasQueryFilter(e => e.DeletedAt == null)`

Affected tables: `Users`, `Hotels`, `HotelRooms`, `Bookings`, `SavedCards`, `SavedTravellers`

---

## Audit Fields Pattern

Every entity inherits from `BaseEntity`:
```csharp
public abstract class BaseEntity {
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }  // null = not deleted
}
```

---

## EF Core Migrations

| Migration | Changes |
|---|---|
| `InitialCreate` | All base tables (Users, Flights, Hotels, HotelRooms, Bookings, Wallets, Coupons, etc.) |
| `AddHotelGuestDetails` | `Bookings.GuestName`, `GuestEmail`, `GuestPhone` |
| `AddSavedCards` | `SavedCards` table |
| `AddHotelPortal` | `Users.HotelId` (nullable FK), `Hotels.Images`, `HotelRooms.Images` |
| `AddOperatorPortal` | `FlightCompanies`, `BusCompanies`, `CabCompanies` tables; `Flight.FlightCompanyId` FK; `User.OperatorCompanyId` |
| `AddHotelReviewsTable` | `HotelReviews` table with FK to Hotels + Users |
| `AddFlightLayoverFields` | `Flights.LayoverAirport`, `Flights.LayoverDurationMinutes` |
