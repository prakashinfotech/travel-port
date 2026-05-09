CREATE TABLE [dbo].[HotelRooms]
(
    [RoomId]        UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [HotelId]       UNIQUEIDENTIFIER  NOT NULL,
    [RoomType]      NVARCHAR(50)      NOT NULL,   -- Standard | Deluxe | Suite
    [PricePerNight] DECIMAL(10, 2)    NOT NULL,
    [MaxGuests]     INT               NOT NULL,
    [TotalRooms]    INT               NOT NULL,
    [Amenities]     NVARCHAR(MAX)     NULL,        -- JSON
    [IsActive]      BIT               NOT NULL DEFAULT 1,
    [CreatedAt]     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]     DATETIME2         NULL,
    [DeletedAt]     DATETIME2         NULL,

    CONSTRAINT [PK_HotelRooms]              PRIMARY KEY ([RoomId]),
    CONSTRAINT [FK_HotelRooms_Hotels]       FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotels] ([HotelId]),
    CONSTRAINT [CK_HotelRooms_Price]        CHECK ([PricePerNight] > 0),
    CONSTRAINT [CK_HotelRooms_MaxGuests]    CHECK ([MaxGuests] > 0),
    CONSTRAINT [CK_HotelRooms_TotalRooms]   CHECK ([TotalRooms] > 0),
    CONSTRAINT [CK_HotelRooms_RoomType]     CHECK ([RoomType] IN ('Standard', 'Deluxe', 'Suite'))
);
GO

CREATE INDEX [IX_HotelRooms_Hotel] ON [dbo].[HotelRooms] ([HotelId]) WHERE [DeletedAt] IS NULL;
GO
