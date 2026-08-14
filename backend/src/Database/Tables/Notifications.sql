CREATE TABLE [dbo].[Notifications] (
    [Id]        UNIQUEIDENTIFIER NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Type]      NVARCHAR (MAX)   NOT NULL,
    [Title]     NVARCHAR (MAX)   NOT NULL,
    [Message]   NVARCHAR (MAX)   NOT NULL,
    [IsRead]    BIT              NOT NULL,
    [CreatedAt] DATETIME2 (7)    NOT NULL,
    [UpdatedAt] DATETIME2 (7)    NULL,
    [DeletedAt] DATETIME2 (7)    NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserId]
    ON [dbo].[Notifications]([UserId] ASC);


GO
