-- ============================================================
-- Post-deployment seed script
-- Runs AFTER schema is applied. Uses IF NOT EXISTS guards
-- so it is safe to run multiple times (idempotent).
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Email] = 'admin@travelport.com')
BEGIN
    INSERT INTO [dbo].[Users] ([UserId], [Name], [Email], [Phone], [PasswordHash], [Role], [IsVerified], [IsActive])
    VALUES (NEWID(), 'Admin User', 'admin@travelport.com', '9000000001',
            '$2a$12$admin_placeholder_hash', 'Admin', 1, 1);
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Email] = 'john@example.com')
BEGIN
    DECLARE @UserId1 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO [dbo].[Users] ([UserId], [Name], [Email], [Phone], [PasswordHash], [Role], [IsVerified], [IsActive])
    VALUES (@UserId1, 'John Doe', 'john@example.com', '9876543210',
            '$2a$12$user_placeholder_hash', 'User', 1, 1);

    -- Create wallet for the demo user
    INSERT INTO [dbo].[Wallets] ([WalletId], [UserId], [Balance])
    VALUES (NEWID(), @UserId1, 500.00);
END;

-- ── Flights ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Flights] WHERE [FlightNumber] = '6E-123')
BEGIN
    DECLARE @BaseDate DATE = DATEADD(DAY, 7, CAST(GETUTCDATE() AS DATE));

    INSERT INTO [dbo].[Flights]
        ([FlightId], [Airline], [FlightNumber], [Source], [Destination],
         [DepartureTime], [ArrivalTime], [Duration], [TotalSeats], [AvailableSeats],
         [EconomyPrice], [BusinessPrice], [Stops])
    VALUES
        (NEWID(), 'IndiGo',   '6E-123', 'BOM', 'DEL',
         CAST(@BaseDate AS DATETIME2) + CAST('06:00' AS TIME),
         CAST(@BaseDate AS DATETIME2) + CAST('08:15' AS TIME),
         135, 180, 120, 4599.00, 12000.00, 0),

        (NEWID(), 'Air India', 'AI-202', 'DEL', 'BOM',
         CAST(@BaseDate AS DATETIME2) + CAST('14:00' AS TIME),
         CAST(@BaseDate AS DATETIME2) + CAST('16:20' AS TIME),
         140, 200, 85, 5299.00, 15000.00, 0),

        (NEWID(), 'SpiceJet',  'SG-501', 'BOM', 'BLR',
         CAST(@BaseDate AS DATETIME2) + CAST('09:00' AS TIME),
         CAST(@BaseDate AS DATETIME2) + CAST('10:40' AS TIME),
         100, 150, 60, 3299.00, NULL, 0),

        (NEWID(), 'Vistara',   'UK-801', 'DEL', 'BLR',
         CAST(@BaseDate AS DATETIME2) + CAST('11:00' AS TIME),
         CAST(@BaseDate AS DATETIME2) + CAST('13:30' AS TIME),
         150, 160, 90, 6499.00, 18000.00, 0);
END;

-- ── Hotels ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Hotels] WHERE [Name] = 'Taj Mahal Palace')
BEGIN
    DECLARE @HotelId1 UNIQUEIDENTIFIER = NEWID();
    DECLARE @HotelId2 UNIQUEIDENTIFIER = NEWID();
    DECLARE @HotelId3 UNIQUEIDENTIFIER = NEWID();

    INSERT INTO [dbo].[Hotels]
        ([HotelId], [Name], [City], [Address], [StarRating], [Description], [Amenities], [Latitude], [Longitude])
    VALUES
        (@HotelId1, 'Taj Mahal Palace', 'Mumbai',
         'Apollo Bunder, Colaba, Mumbai - 400001', 5.0,
         'Iconic luxury hotel overlooking the Gateway of India.',
         '["WiFi","Pool","Spa","Restaurant","Gym","Valet"]', 18.9220, 72.8332),

        (@HotelId2, 'The Oberoi', 'Delhi',
         'Dr. Zakir Hussain Marg, New Delhi - 110003', 5.0,
         'Luxury hotel in the heart of New Delhi.',
         '["WiFi","Pool","Spa","Restaurant","Bar"]', 28.5983, 77.2402),

        (@HotelId3, 'Lemon Tree Premier', 'Bangalore',
         'Ulsoor, Bengaluru - 560042', 4.0,
         'Modern business hotel in the heart of Bangalore.',
         '["WiFi","Gym","Restaurant","Conference Room"]', 12.9716, 77.5946);

    -- Rooms for Taj Mahal Palace
    INSERT INTO [dbo].[HotelRooms] ([RoomId], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms])
    VALUES
        (NEWID(), @HotelId1, 'Deluxe', 12000.00, 2, 20),
        (NEWID(), @HotelId1, 'Suite',  35000.00, 4,  8);

    -- Rooms for The Oberoi
    INSERT INTO [dbo].[HotelRooms] ([RoomId], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms])
    VALUES
        (NEWID(), @HotelId2, 'Standard', 8000.00,  2, 30),
        (NEWID(), @HotelId2, 'Deluxe',  14000.00,  2, 15),
        (NEWID(), @HotelId2, 'Suite',   28000.00,  4,  5);

    -- Rooms for Lemon Tree
    INSERT INTO [dbo].[HotelRooms] ([RoomId], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms])
    VALUES
        (NEWID(), @HotelId3, 'Standard', 3500.00, 2, 40),
        (NEWID(), @HotelId3, 'Deluxe',   5500.00, 2, 20);
END;

-- ── Coupons ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Coupons] WHERE [Code] = 'SAVE100')
BEGIN
    INSERT INTO [dbo].[Coupons]
        ([CouponId], [Code], [Type], [Value], [MinAmount], [UsageLimit], [ExpiresAt])
    VALUES
        (NEWID(), 'SAVE100', 'Fixed',      100.00, 1000.00, 1000, DATEADD(MONTH, 3, GETUTCDATE())),
        (NEWID(), 'FIRST10', 'Percentage',  10.00,  500.00,  500, DATEADD(MONTH, 6, GETUTCDATE())),
        (NEWID(), 'FLAT500', 'Fixed',       500.00, 5000.00,  200, DATEADD(MONTH, 2, GETUTCDATE()));
END;
GO
