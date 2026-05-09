CREATE TABLE [dbo].[SavedTravellers]
(
    [TravellerId] UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]      UNIQUEIDENTIFIER  NOT NULL,
    [Name]        NVARCHAR(100)     NOT NULL,
    [Email]       NVARCHAR(255)     NULL,
    [Phone]       NVARCHAR(15)      NULL,
    [DOB]         DATE              NULL,
    [PassportNo]  NVARCHAR(50)      NULL,   -- stored encrypted in application layer
    [CreatedAt]   DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]   DATETIME2         NULL,
    [DeletedAt]   DATETIME2         NULL,

    CONSTRAINT [PK_SavedTravellers]        PRIMARY KEY ([TravellerId]),
    CONSTRAINT [FK_SavedTravellers_Users]  FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId])
);
GO

CREATE INDEX [IX_SavedTravellers_User] ON [dbo].[SavedTravellers] ([UserId]) WHERE [DeletedAt] IS NULL;
GO
