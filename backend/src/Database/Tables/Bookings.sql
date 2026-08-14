CREATE TABLE [dbo].[Bookings] (
    [Id]                 UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [BookingRef]         NVARCHAR (20)    NOT NULL,
    [UserId]             UNIQUEIDENTIFIER NOT NULL,
    [BookingType]        NVARCHAR (MAX)   NOT NULL,
    [ReferenceId]        UNIQUEIDENTIFIER NOT NULL,
    [TotalAmount]        DECIMAL (10, 2)  NOT NULL,
    [DiscountAmount]     DECIMAL (10, 2)  DEFAULT ((0.0)) NOT NULL,
    [FinalAmount]        DECIMAL (10, 2)  NOT NULL,
    [Status]             NVARCHAR (450)   DEFAULT (N'Pending') NOT NULL,
    [CancelledAt]        DATETIME2 (7)    NULL,
    [RefundAmount]       DECIMAL (10, 2)  NULL,
    [CreatedAt]          DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]          DATETIME2 (7)    NULL,
    [DeletedAt]          DATETIME2 (7)    NULL,
    [CheckIn]            DATETIME2 (7)    NULL,
    [CheckOut]           DATETIME2 (7)    NULL,
    [CouponCode]         NVARCHAR (MAX)   NULL,
    [Passengers]         INT              NULL,
    [GuestEmail]         NVARCHAR (MAX)   NULL,
    [GuestName]          NVARCHAR (MAX)   NULL,
    [GuestPhone]         NVARCHAR (MAX)   NULL,
    [TransportSnapshot]  NVARCHAR (MAX)   NULL,
    [RoomId]             UNIQUEIDENTIFIER NULL,
    [ActualCheckOutTime] DATETIME2 (7)    NULL,
    [CheckInNotes]       NVARCHAR (MAX)   NULL,
    [CheckInTime]        DATETIME2 (7)    NULL,
    [PaymentMethod]      NVARCHAR (MAX)   NULL,
    [RoomNumber]         NVARCHAR (MAX)   NULL,
    [SeatNumbers]        NVARCHAR (MAX)   NULL,
    CONSTRAINT [PK_Bookings] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Bookings_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Bookings_Ref]
    ON [dbo].[Bookings]([BookingRef] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Bookings_User]
    ON [dbo].[Bookings]([UserId] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Bookings_Status]
    ON [dbo].[Bookings]([Status] ASC);


GO
