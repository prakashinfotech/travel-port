CREATE TABLE [dbo].[Users]
(
    [UserId]       UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Name]         NVARCHAR(100)     NOT NULL,
    [Email]        NVARCHAR(255)     NOT NULL,
    [Phone]        NVARCHAR(15)      NULL,
    [PasswordHash] NVARCHAR(500)     NOT NULL,
    [Role]         NVARCHAR(20)      NOT NULL DEFAULT 'User',   -- User | Admin
    [IsVerified]   BIT               NOT NULL DEFAULT 0,
    [IsActive]     BIT               NOT NULL DEFAULT 1,
    [CreatedAt]    DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]    DATETIME2         NULL,
    [DeletedAt]    DATETIME2         NULL,

    CONSTRAINT [PK_Users]           PRIMARY KEY ([UserId]),
    CONSTRAINT [CK_Users_Role]      CHECK ([Role] IN ('User', 'Admin')),
    CONSTRAINT [CK_Users_Email_Fmt] CHECK ([Email] LIKE '%_@_%._%')
);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [dbo].[Users] ([Email]) WHERE [DeletedAt] IS NULL;
GO

CREATE INDEX [IX_Users_Phone] ON [dbo].[Users] ([Phone]) WHERE [Phone] IS NOT NULL;
GO
