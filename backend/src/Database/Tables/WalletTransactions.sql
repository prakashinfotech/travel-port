CREATE TABLE [dbo].[WalletTransactions]
(
    [TransactionId] UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [WalletId]      UNIQUEIDENTIFIER  NOT NULL,
    [Type]          NVARCHAR(20)      NOT NULL,   -- Credit | Debit
    [Amount]        DECIMAL(10, 2)    NOT NULL,
    [Description]   NVARCHAR(200)     NULL,
    [ReferenceId]   UNIQUEIDENTIFIER  NULL,       -- BookingId when applicable
    [CreatedAt]     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]     DATETIME2         NULL,
    [DeletedAt]     DATETIME2         NULL,

    CONSTRAINT [PK_WalletTransactions]          PRIMARY KEY ([TransactionId]),
    CONSTRAINT [FK_WalletTransactions_Wallets]  FOREIGN KEY ([WalletId]) REFERENCES [dbo].[Wallets] ([WalletId]),
    CONSTRAINT [CK_WalletTransactions_Type]     CHECK ([Type] IN ('Credit', 'Debit')),
    CONSTRAINT [CK_WalletTransactions_Amount]   CHECK ([Amount] > 0)
);
GO

CREATE INDEX [IX_WalletTransactions_Wallet] ON [dbo].[WalletTransactions] ([WalletId]);
GO
