CREATE TABLE [dbo].[Bookings]
(
    [BookingId]      UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [BookingRef]     NVARCHAR(20)      NOT NULL,   -- TP2024001234
    [UserId]         UNIQUEIDENTIFIER  NOT NULL,
    [BookingType]    NVARCHAR(20)      NOT NULL,   -- Flight | Hotel | Bus | Train
    [ReferenceId]    UNIQUEIDENTIFIER  NOT NULL,   -- FlightId / HotelId etc.
    [TotalAmount]    DECIMAL(10, 2)    NOT NULL,
    [DiscountAmount] DECIMAL(10, 2)    NOT NULL DEFAULT 0,
    [FinalAmount]    DECIMAL(10, 2)    NOT NULL,
    [Status]         NVARCHAR(20)      NOT NULL DEFAULT 'Pending',
    [CancelledAt]    DATETIME2         NULL,
    [RefundAmount]   DECIMAL(10, 2)    NULL,
    [CreatedAt]      DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]      DATETIME2         NULL,
    [DeletedAt]      DATETIME2         NULL,

    CONSTRAINT [PK_Bookings]              PRIMARY KEY ([BookingId]),
    CONSTRAINT [FK_Bookings_Users]        FOREIGN KEY ([UserId])    REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [CK_Bookings_Status]       CHECK ([Status]      IN ('Pending', 'Confirmed', 'Cancelled', 'Refunded')),
    CONSTRAINT [CK_Bookings_Type]         CHECK ([BookingType] IN ('Flight', 'Hotel', 'Bus', 'Train')),
    CONSTRAINT [CK_Bookings_FinalAmount]  CHECK ([FinalAmount] >= 0),
    CONSTRAINT [CK_Bookings_Amounts]      CHECK ([FinalAmount] = [TotalAmount] - [DiscountAmount])
);
GO

CREATE UNIQUE INDEX [IX_Bookings_Ref]    ON [dbo].[Bookings] ([BookingRef]);
GO
CREATE        INDEX [IX_Bookings_User]   ON [dbo].[Bookings] ([UserId])  WHERE [DeletedAt] IS NULL;
GO
CREATE        INDEX [IX_Bookings_Status] ON [dbo].[Bookings] ([Status])  WHERE [DeletedAt] IS NULL;
GO
