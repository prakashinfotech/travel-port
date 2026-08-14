-- ============================================================
-- Post-deployment seed script
-- Runs AFTER schema is applied. Uses IF NOT EXISTS guards
-- so it is safe to run multiple times (idempotent).
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
-- User, role, password, wallet, traveller, and booking records are intentionally
-- excluded from the public post-deployment script. Provision accounts through
-- the application workflow or an approved private runbook.

-- ── Flights ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Flights] WHERE [FlightNumber] = '6E-123')
BEGIN
    DECLARE @BaseDate DATE = DATEADD(DAY, 7, CAST(GETUTCDATE() AS DATE));

    INSERT INTO [dbo].[Flights]
        ([Id], [Airline], [FlightNumber], [Source], [Destination],
         [DepartureTime], [ArrivalTime], [Duration], [TotalSeats], [AvailableSeats],
         [EconomyPrice], [BusinessPrice], [Stops])
    VALUES
        (NEWID(), 'IndiGo',   '6E-123', 'BOM', 'DEL',
         DATEADD(MINUTE, 360, CAST(@BaseDate AS DATETIME2)),
         DATEADD(MINUTE, 495, CAST(@BaseDate AS DATETIME2)),
         135, 180, 120, 4599.00, 12000.00, 0),

        (NEWID(), 'Air India', 'AI-202', 'DEL', 'BOM',
         DATEADD(MINUTE, 840, CAST(@BaseDate AS DATETIME2)),
         DATEADD(MINUTE, 980, CAST(@BaseDate AS DATETIME2)),
         140, 200, 85, 5299.00, 15000.00, 0),

        (NEWID(), 'SpiceJet',  'SG-501', 'BOM', 'BLR',
         DATEADD(MINUTE, 540, CAST(@BaseDate AS DATETIME2)),
         DATEADD(MINUTE, 640, CAST(@BaseDate AS DATETIME2)),
         100, 150, 60, 3299.00, NULL, 0),

        (NEWID(), 'Vistara',   'UK-801', 'DEL', 'BLR',
         DATEADD(MINUTE, 660, CAST(@BaseDate AS DATETIME2)),
         DATEADD(MINUTE, 810, CAST(@BaseDate AS DATETIME2)),
         150, 160, 90, 6499.00, 18000.00, 0);
END;

-- ── Hotels ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Hotels] WHERE [Name] = 'Taj Mahal Palace')
BEGIN
    DECLARE @HotelId1 UNIQUEIDENTIFIER = NEWID();
    DECLARE @HotelId2 UNIQUEIDENTIFIER = NEWID();
    DECLARE @HotelId3 UNIQUEIDENTIFIER = NEWID();

    INSERT INTO [dbo].[Hotels]
        ([Id], [Name], [City], [Address], [StarRating], [Description], [Amenities], [Latitude], [Longitude])
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
    INSERT INTO [dbo].[HotelRooms] ([Id], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms], [CreatedAt])
    VALUES
        (NEWID(), @HotelId1, 'Deluxe', 12000.00, 2, 20, GETUTCDATE()),
        (NEWID(), @HotelId1, 'Suite',  35000.00, 4,  8, GETUTCDATE());

    -- Rooms for The Oberoi
    INSERT INTO [dbo].[HotelRooms] ([Id], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms], [CreatedAt])
    VALUES
        (NEWID(), @HotelId2, 'Standard', 8000.00,  2, 30, GETUTCDATE()),
        (NEWID(), @HotelId2, 'Deluxe',  14000.00,  2, 15, GETUTCDATE()),
        (NEWID(), @HotelId2, 'Suite',   28000.00,  4,  5, GETUTCDATE());

    -- Rooms for Lemon Tree
    INSERT INTO [dbo].[HotelRooms] ([Id], [HotelId], [RoomType], [PricePerNight], [MaxGuests], [TotalRooms], [CreatedAt])
    VALUES
        (NEWID(), @HotelId3, 'Standard', 3500.00, 2, 40, GETUTCDATE()),
        (NEWID(), @HotelId3, 'Deluxe',   5500.00, 2, 20, GETUTCDATE());
END;

-- ── Coupons ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Coupons] WHERE [Code] = 'SAVE100')
BEGIN
    INSERT INTO [dbo].[Coupons]
        ([Id], [Code], [Type], [Value], [MinAmount], [UsageLimit], [ExpiresAt])
    VALUES
        (NEWID(), 'SAVE100', 'Fixed',      100.00, 1000.00, 1000, DATEADD(MONTH, 3, GETUTCDATE())),
        (NEWID(), 'FIRST10', 'Percentage',  10.00,  500.00,  500, DATEADD(MONTH, 6, GETUTCDATE())),
        (NEWID(), 'FLAT500', 'Fixed',       500.00, 5000.00,  200, DATEADD(MONTH, 2, GETUTCDATE()));
END;
GO
