CREATE TABLE [dbo].[Payments] (
    [Id]               UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [BookingId]        UNIQUEIDENTIFIER NOT NULL,
    [Method]           NVARCHAR (30)    NOT NULL,
    [GatewayOrderId]   NVARCHAR (100)   NULL,
    [GatewayPaymentId] NVARCHAR (100)   NULL,
    [Amount]           DECIMAL (10, 2)  NOT NULL,
    [Status]           NVARCHAR (MAX)   DEFAULT (N'Pending') NOT NULL,
    [PaidAt]           DATETIME2 (7)    NULL,
    [CreatedAt]        DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]        DATETIME2 (7)    NULL,
    [DeletedAt]        DATETIME2 (7)    NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Payments_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [dbo].[Bookings] ([Id]) ON DELETE CASCADE
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Payments_Booking]
    ON [dbo].[Payments]([BookingId] ASC);


GO
