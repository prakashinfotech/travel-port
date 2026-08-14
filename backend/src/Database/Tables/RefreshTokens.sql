CREATE TABLE [dbo].[RefreshTokens] (
    [Id]        UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Token]     NVARCHAR (500)   NOT NULL,
    [ExpiresAt] DATETIME2 (7)    NOT NULL,
    [IsRevoked] BIT              DEFAULT (CONVERT([bit],(0))) NOT NULL,
    [CreatedAt] DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_RefreshTokens_User]
    ON [dbo].[RefreshTokens]([UserId] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_RefreshTokens_Token]
    ON [dbo].[RefreshTokens]([Token] ASC);


GO
