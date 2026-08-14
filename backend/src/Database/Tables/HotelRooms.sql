CREATE TABLE [dbo].[HotelRooms] (
    [Id]            UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [HotelId]       UNIQUEIDENTIFIER NOT NULL,
    [RoomType]      NVARCHAR (50)    NOT NULL,
    [PricePerNight] DECIMAL (10, 2)  NOT NULL,
    [MaxGuests]     INT              NOT NULL,
    [TotalRooms]    INT              NOT NULL,
    [Amenities]     NVARCHAR (MAX)   NULL,
    [IsActive]      BIT              DEFAULT (CONVERT([bit],(1))) NOT NULL,
    [CreatedAt]     DATETIME2 (7)    NOT NULL,
    [UpdatedAt]     DATETIME2 (7)    NULL,
    [DeletedAt]     DATETIME2 (7)    NULL,
    [Images]        NVARCHAR (MAX)   NULL,
    CONSTRAINT [PK_HotelRooms] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_HotelRooms_Hotels_HotelId] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotels] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_HotelRooms_HotelId]
    ON [dbo].[HotelRooms]([HotelId] ASC);


GO
