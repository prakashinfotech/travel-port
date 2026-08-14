CREATE TABLE [dbo].[WalletTransactions] (
    [Id]          UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [WalletId]    UNIQUEIDENTIFIER NOT NULL,
    [Type]        NVARCHAR (20)    NOT NULL,
    [Amount]      DECIMAL (10, 2)  NOT NULL,
    [Description] NVARCHAR (200)   NULL,
    [ReferenceId] UNIQUEIDENTIFIER NULL,
    [CreatedAt]   DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]   DATETIME2 (7)    NULL,
    [DeletedAt]   DATETIME2 (7)    NULL,
    CONSTRAINT [PK_WalletTransactions] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_WalletTransactions_Wallets_WalletId] FOREIGN KEY ([WalletId]) REFERENCES [dbo].[Wallets] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_WalletTransactions_WalletId]
    ON [dbo].[WalletTransactions]([WalletId] ASC);


GO
