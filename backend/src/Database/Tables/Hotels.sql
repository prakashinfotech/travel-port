CREATE TABLE [dbo].[Hotels]
(
    [HotelId]     UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Name]        NVARCHAR(200)     NOT NULL,
    [City]        NVARCHAR(100)     NOT NULL,
    [Address]     NVARCHAR(500)     NULL,
    [StarRating]  DECIMAL(2, 1)     NOT NULL,
    [Description] NVARCHAR(MAX)     NULL,
    [Amenities]   NVARCHAR(MAX)     NULL,   -- JSON array e.g. ["WiFi","Pool"]
    [Latitude]    DECIMAL(9, 6)     NULL,
    [Longitude]   DECIMAL(9, 6)     NULL,
    [IsActive]    BIT               NOT NULL DEFAULT 1,
    [CreatedAt]   DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]   DATETIME2         NULL,
    [DeletedAt]   DATETIME2         NULL,

    CONSTRAINT [PK_Hotels]            PRIMARY KEY ([HotelId]),
    CONSTRAINT [CK_Hotels_StarRating] CHECK ([StarRating] >= 1.0 AND [StarRating] <= 5.0)
);
GO

CREATE INDEX [IX_Hotels_City]   ON [dbo].[Hotels] ([City])       WHERE [DeletedAt] IS NULL;
GO
CREATE INDEX [IX_Hotels_Rating] ON [dbo].[Hotels] ([StarRating]) WHERE [DeletedAt] IS NULL;
GO
