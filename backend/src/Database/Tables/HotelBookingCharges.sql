CREATE TABLE [dbo].[HotelBookingCharges] (
    [Id]        UNIQUEIDENTIFIER NOT NULL,
    [BookingId] UNIQUEIDENTIFIER NOT NULL,
    [ItemName]  NVARCHAR (MAX)   NOT NULL,
    [Category]  NVARCHAR (MAX)   NOT NULL,
    [Quantity]  INT              NOT NULL,
    [Price]     DECIMAL (18, 2)  NOT NULL,
    [Tax]       DECIMAL (18, 2)  NOT NULL,
    [Notes]     NVARCHAR (MAX)   NULL,
    [CreatedAt] DATETIME2 (7)    NOT NULL,
    [UpdatedAt] DATETIME2 (7)    NULL,
    [DeletedAt] DATETIME2 (7)    NULL,
    CONSTRAINT [PK_HotelBookingCharges] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_HotelBookingCharges_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [dbo].[Bookings] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_HotelBookingCharges_BookingId]
    ON [dbo].[HotelBookingCharges]([BookingId] ASC);


GO
