IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [UserId] uniqueidentifier NULL,
        [Action] nvarchar(100) NOT NULL,
        [Entity] nvarchar(100) NOT NULL,
        [EntityId] nvarchar(100) NULL,
        [OldValues] nvarchar(max) NULL,
        [NewValues] nvarchar(max) NULL,
        [IpAddress] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Coupons] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [Code] nvarchar(30) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Value] decimal(10,2) NOT NULL,
        [MinAmount] decimal(10,2) NOT NULL DEFAULT 0.0,
        [MaxDiscount] decimal(10,2) NULL,
        [UsageLimit] int NULL,
        [UsedCount] int NOT NULL DEFAULT 0,
        [ExpiresAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Coupons] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Flights] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [Airline] nvarchar(100) NOT NULL,
        [FlightNumber] nvarchar(20) NOT NULL,
        [Source] nvarchar(10) NOT NULL,
        [Destination] nvarchar(10) NOT NULL,
        [DepartureTime] datetime2 NOT NULL,
        [ArrivalTime] datetime2 NOT NULL,
        [Duration] int NOT NULL,
        [TotalSeats] int NOT NULL,
        [AvailableSeats] int NOT NULL,
        [EconomyPrice] decimal(10,2) NOT NULL,
        [BusinessPrice] decimal(10,2) NULL,
        [Stops] int NOT NULL DEFAULT 0,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Flights] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Hotels] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [Name] nvarchar(200) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [Address] nvarchar(500) NULL,
        [StarRating] decimal(2,1) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Amenities] nvarchar(max) NULL,
        [Latitude] decimal(9,6) NULL,
        [Longitude] decimal(9,6) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Hotels] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [Name] nvarchar(100) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [Phone] nvarchar(15) NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [Role] nvarchar(max) NOT NULL DEFAULT N'User',
        [IsVerified] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [HotelRooms] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [HotelId] uniqueidentifier NOT NULL,
        [RoomType] nvarchar(50) NOT NULL,
        [PricePerNight] decimal(10,2) NOT NULL,
        [MaxGuests] int NOT NULL,
        [TotalRooms] int NOT NULL,
        [Amenities] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_HotelRooms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HotelRooms_Hotels_HotelId] FOREIGN KEY ([HotelId]) REFERENCES [Hotels] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Bookings] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [BookingRef] nvarchar(20) NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [BookingType] nvarchar(max) NOT NULL,
        [ReferenceId] uniqueidentifier NOT NULL,
        [TotalAmount] decimal(10,2) NOT NULL,
        [DiscountAmount] decimal(10,2) NOT NULL DEFAULT 0.0,
        [FinalAmount] decimal(10,2) NOT NULL,
        [Status] nvarchar(450) NOT NULL DEFAULT N'Pending',
        [CancelledAt] datetime2 NULL,
        [RefundAmount] decimal(10,2) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Bookings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Bookings_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [UserId] uniqueidentifier NOT NULL,
        [Token] nvarchar(500) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [SavedTravellers] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [UserId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Email] nvarchar(255) NULL,
        [Phone] nvarchar(15) NULL,
        [DOB] date NULL,
        [PassportNo] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_SavedTravellers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SavedTravellers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Wallets] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [UserId] uniqueidentifier NOT NULL,
        [Balance] decimal(10,2) NOT NULL DEFAULT 0.0,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL DEFAULT (GETUTCDATE()),
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Wallets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Wallets_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [BookingId] uniqueidentifier NOT NULL,
        [Method] nvarchar(30) NOT NULL,
        [GatewayOrderId] nvarchar(100) NULL,
        [GatewayPaymentId] nvarchar(100) NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Status] nvarchar(max) NOT NULL DEFAULT N'Pending',
        [PaidAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE TABLE [WalletTransactions] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [WalletId] uniqueidentifier NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Description] nvarchar(200) NULL,
        [ReferenceId] uniqueidentifier NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_WalletTransactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WalletTransactions_Wallets_WalletId] FOREIGN KEY ([WalletId]) REFERENCES [Wallets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Bookings_Ref] ON [Bookings] ([BookingRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Bookings_Status] ON [Bookings] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Bookings_User] ON [Bookings] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Coupons_Code] ON [Coupons] ([Code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Flights_Departure] ON [Flights] ([DepartureTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Flights_Route] ON [Flights] ([Source], [Destination]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_HotelRooms_HotelId] ON [HotelRooms] ([HotelId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Hotels_City] ON [Hotels] ([City]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Hotels_Rating] ON [Hotels] ([StarRating]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Payments_Booking] ON [Payments] ([BookingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_User] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SavedTravellers_UserId] ON [SavedTravellers] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Users_Phone] ON [Users] ([Phone]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Wallets_UserId] ON [Wallets] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_WalletTransactions_WalletId] ON [WalletTransactions] ([WalletId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509095115_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260509095115_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO
BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Hotels] ADD [ImageUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Hotels] ADD [ReviewCount] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Hotels] ADD [ReviewScore] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Bookings] ADD [CheckIn] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Bookings] ADD [CheckOut] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Bookings] ADD [CouponCode] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    ALTER TABLE [Bookings] ADD [Passengers] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100219_AddHotelReviewsAndBookingDetails'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260509100219_AddHotelReviewsAndBookingDetails', N'8.0.11');
END;
GO

COMMIT;
GO
BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260512111203_AddGuestDetailsToBooking'
)
BEGIN
    ALTER TABLE [Bookings] ADD [GuestEmail] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260512111203_AddGuestDetailsToBooking'
)
BEGIN
    ALTER TABLE [Bookings] ADD [GuestName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260512111203_AddGuestDetailsToBooking'
)
BEGIN
    ALTER TABLE [Bookings] ADD [GuestPhone] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260512111203_AddGuestDetailsToBooking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260512111203_AddGuestDetailsToBooking', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260513061450_AddSavedCards'
)
BEGIN
    CREATE TABLE [SavedCards] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [UserId] uniqueidentifier NOT NULL,
        [CardHolderName] nvarchar(100) NOT NULL,
        [LastFourDigits] nvarchar(4) NOT NULL,
        [ExpiryMonth] int NOT NULL,
        [ExpiryYear] int NOT NULL,
        [CardType] nvarchar(20) NOT NULL,
        [NickName] nvarchar(50) NULL,
        [IsDefault] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_SavedCards] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SavedCards_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260513061450_AddSavedCards'
)
BEGIN
    CREATE INDEX [IX_SavedCards_UserId] ON [SavedCards] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260513061450_AddSavedCards'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260513061450_AddSavedCards', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515065116_AddHotelPortal'
)
BEGIN
    ALTER TABLE [Users] ADD [HotelId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515065116_AddHotelPortal'
)
BEGIN
    ALTER TABLE [Hotels] ADD [Images] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515065116_AddHotelPortal'
)
BEGIN
    ALTER TABLE [HotelRooms] ADD [Images] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515065116_AddHotelPortal'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260515065116_AddHotelPortal', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518101614_AddTransportSnapshotToBooking'
)
BEGIN
    ALTER TABLE [Bookings] ADD [TransportSnapshot] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518101614_AddTransportSnapshotToBooking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260518101614_AddTransportSnapshotToBooking', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    ALTER TABLE [Users] ADD [OperatorCompanyId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    ALTER TABLE [Flights] ADD [FlightCompanyId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    CREATE TABLE [BusCompanies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [ContactEmail] nvarchar(max) NULL,
        [ContactPhone] nvarchar(max) NULL,
        [HeadquartersCity] nvarchar(max) NULL,
        [BusTypes] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_BusCompanies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    CREATE TABLE [CabCompanies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [ContactEmail] nvarchar(max) NULL,
        [ContactPhone] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [CabTypes] nvarchar(max) NULL,
        [IsIndividualDriver] bit NOT NULL,
        [DriverLicenseNumber] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_CabCompanies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    CREATE TABLE [FlightCompanies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [IataCode] nvarchar(max) NOT NULL,
        [LogoUrl] nvarchar(max) NULL,
        [ContactEmail] nvarchar(max) NULL,
        [ContactPhone] nvarchar(max) NULL,
        [HeadquartersCity] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_FlightCompanies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    CREATE INDEX [IX_Flights_FlightCompanyId] ON [Flights] ([FlightCompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    ALTER TABLE [Flights] ADD CONSTRAINT [FK_Flights_FlightCompanies_FlightCompanyId] FOREIGN KEY ([FlightCompanyId]) REFERENCES [FlightCompanies] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519092033_AddOperatorPortal'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519092033_AddOperatorPortal', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519183000_AddHotelReviewsTable'
)
BEGIN
    CREATE TABLE [HotelReviews] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [HotelId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Rating] int NOT NULL,
        [Comment] nvarchar(1000) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_HotelReviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HotelReviews_Hotels_HotelId] FOREIGN KEY ([HotelId]) REFERENCES [Hotels] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_HotelReviews_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519183000_AddHotelReviewsTable'
)
BEGIN
    CREATE INDEX [IX_HotelReviews_HotelId] ON [HotelReviews] ([HotelId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519183000_AddHotelReviewsTable'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_HotelReviews_HotelId_UserId] ON [HotelReviews] ([HotelId], [UserId]) WHERE [DeletedAt] IS NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519183000_AddHotelReviewsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519183000_AddHotelReviewsTable', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519193000_AddFlightLayoverFields'
)
BEGIN
    ALTER TABLE [Flights] ADD [LayoverAirport] nvarchar(10) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519193000_AddFlightLayoverFields'
)
BEGIN
    ALTER TABLE [Flights] ADD [LayoverDurationMinutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519193000_AddFlightLayoverFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519193000_AddFlightLayoverFields', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520112518_AddCouponIsFeatured'
)
BEGIN
    ALTER TABLE [Coupons] ADD [IsFeatured] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520112518_AddCouponIsFeatured'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260520112518_AddCouponIsFeatured', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113429_AddNotificationsTable'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113429_AddNotificationsTable'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113429_AddNotificationsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260520113429_AddNotificationsTable', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113633_AddPriceAlertsTable'
)
BEGIN
    CREATE TABLE [PriceAlerts] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Origin] nvarchar(max) NOT NULL,
        [Destination] nvarchar(max) NOT NULL,
        [TravelDate] date NOT NULL,
        [LastSeenPrice] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [LastNotifiedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_PriceAlerts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PriceAlerts_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113633_AddPriceAlertsTable'
)
BEGIN
    CREATE INDEX [IX_PriceAlerts_UserId] ON [PriceAlerts] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520113633_AddPriceAlertsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260520113633_AddPriceAlertsTable', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260521070547_AddRoomIdToBooking'
)
BEGIN
    ALTER TABLE [Bookings] ADD [RoomId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260521070547_AddRoomIdToBooking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260521070547_AddRoomIdToBooking', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260521121744_AddAnnouncementsTable'
)
BEGIN
    CREATE TABLE [Announcements] (
        [Id] uniqueidentifier NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [ExpiresAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedByUserId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Announcements] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260521121744_AddAnnouncementsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260521121744_AddAnnouncementsTable', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    ALTER TABLE [Bookings] ADD [ActualCheckOutTime] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    ALTER TABLE [Bookings] ADD [CheckInNotes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    ALTER TABLE [Bookings] ADD [CheckInTime] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    ALTER TABLE [Bookings] ADD [PaymentMethod] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    ALTER TABLE [Bookings] ADD [RoomNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    CREATE TABLE [HotelBookingCharges] (
        [Id] uniqueidentifier NOT NULL,
        [BookingId] uniqueidentifier NOT NULL,
        [ItemName] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [Quantity] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [Tax] decimal(18,2) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_HotelBookingCharges] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HotelBookingCharges_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    CREATE INDEX [IX_HotelBookingCharges_BookingId] ON [HotelBookingCharges] ([BookingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522083624_AddHotelBookingChargesAndOpsFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260522083624_AddHotelBookingChargesAndOpsFields', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522102339_AddFlightSeatLayout'
)
BEGIN
    ALTER TABLE [Flights] ADD [LadiesSeats] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522102339_AddFlightSeatLayout'
)
BEGIN
    ALTER TABLE [Flights] ADD [SeatLayoutConfig] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522102339_AddFlightSeatLayout'
)
BEGIN
    ALTER TABLE [Flights] ADD [SeatRows] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522102339_AddFlightSeatLayout'
)
BEGIN
    ALTER TABLE [Bookings] ADD [SeatNumbers] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522102339_AddFlightSeatLayout'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260522102339_AddFlightSeatLayout', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525141036_AddBusEntity'
)
BEGIN
    CREATE TABLE [Buses] (
        [Id] uniqueidentifier NOT NULL,
        [BusNumber] nvarchar(max) NOT NULL,
        [BusCompanyId] uniqueidentifier NOT NULL,
        [Origin] nvarchar(max) NOT NULL,
        [Destination] nvarchar(max) NOT NULL,
        [DepartureTime] datetime2 NOT NULL,
        [ArrivalTime] datetime2 NOT NULL,
        [DurationMinutes] int NOT NULL,
        [TotalSeats] int NOT NULL,
        [AvailableSeats] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [BusType] nvarchar(max) NOT NULL,
        [SeatLayoutConfig] nvarchar(max) NOT NULL,
        [SeatRows] int NOT NULL,
        [LadiesSeats] nvarchar(max) NULL,
        [Amenities] nvarchar(max) NULL,
        [DriverName] nvarchar(max) NULL,
        [DriverPhone] nvarchar(max) NULL,
        [DriverLicense] nvarchar(max) NULL,
        [StaffDetails] nvarchar(max) NULL,
        [PhotoUrl] nvarchar(max) NULL,
        [ScheduleType] nvarchar(max) NOT NULL,
        [DaysOfWeek] nvarchar(max) NULL,
        [BoardingPoints] nvarchar(max) NULL,
        [DroppingPoints] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Buses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Buses_BusCompanies_BusCompanyId] FOREIGN KEY ([BusCompanyId]) REFERENCES [BusCompanies] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525141036_AddBusEntity'
)
BEGIN
    CREATE INDEX [IX_Buses_BusCompanyId] ON [Buses] ([BusCompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525141036_AddBusEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260525141036_AddBusEntity', N'8.0.11');
END;
GO

COMMIT;
GO
