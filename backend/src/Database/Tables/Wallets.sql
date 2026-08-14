CREATE TABLE [dbo].[Wallets] (
    [Id]        UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Balance]   DECIMAL (10, 2)  DEFAULT ((0.0)) NOT NULL,
    [CreatedAt] DATETIME2 (7)    NOT NULL,
    [UpdatedAt] DATETIME2 (7)    DEFAULT (getutcdate()) NULL,
    [DeletedAt] DATETIME2 (7)    NULL,
    CONSTRAINT [PK_Wallets] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Wallets_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Wallets_UserId]
    ON [dbo].[Wallets]([UserId] ASC);


GO
