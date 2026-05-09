CREATE TABLE [dbo].[Payments]
(
    [PaymentId]        UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [BookingId]        UNIQUEIDENTIFIER  NOT NULL,
    [Method]           NVARCHAR(30)      NOT NULL,   -- Card | UPI | NetBanking | Wallet
    [GatewayOrderId]   NVARCHAR(100)     NULL,
    [GatewayPaymentId] NVARCHAR(100)     NULL,
    [Amount]           DECIMAL(10, 2)    NOT NULL,
    [Status]           NVARCHAR(20)      NOT NULL DEFAULT 'Pending',
    [PaidAt]           DATETIME2         NULL,
    [CreatedAt]        DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]        DATETIME2         NULL,
    [DeletedAt]        DATETIME2         NULL,

    CONSTRAINT [PK_Payments]          PRIMARY KEY ([PaymentId]),
    CONSTRAINT [FK_Payments_Bookings] FOREIGN KEY ([BookingId]) REFERENCES [dbo].[Bookings] ([BookingId]),
    CONSTRAINT [CK_Payments_Status]   CHECK ([Status] IN ('Pending', 'Success', 'Failed', 'Refunded')),
    CONSTRAINT [CK_Payments_Method]   CHECK ([Method] IN ('Card', 'UPI', 'NetBanking', 'Wallet')),
    CONSTRAINT [CK_Payments_Amount]   CHECK ([Amount] > 0)
);
GO

CREATE INDEX [IX_Payments_Booking] ON [dbo].[Payments] ([BookingId]);
GO
