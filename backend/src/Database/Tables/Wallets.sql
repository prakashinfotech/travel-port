CREATE TABLE [dbo].[Wallets]
(
    [WalletId]  UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]    UNIQUEIDENTIFIER  NOT NULL,
    [Balance]   DECIMAL(10, 2)    NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2         NULL,
    [DeletedAt] DATETIME2         NULL,

    CONSTRAINT [PK_Wallets]         PRIMARY KEY ([WalletId]),
    CONSTRAINT [FK_Wallets_Users]   FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [CK_Wallets_Balance] CHECK ([Balance] >= 0)
);
GO

-- Each user has exactly one wallet
CREATE UNIQUE INDEX [IX_Wallets_User] ON [dbo].[Wallets] ([UserId]) WHERE [DeletedAt] IS NULL;
GO
