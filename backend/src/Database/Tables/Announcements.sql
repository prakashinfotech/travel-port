CREATE TABLE [dbo].[Announcements] (
    [Id]              UNIQUEIDENTIFIER NOT NULL,
    [Message]         NVARCHAR (MAX)   NOT NULL,
    [Type]            NVARCHAR (MAX)   NOT NULL,
    [ExpiresAt]       DATETIME2 (7)    NULL,
    [IsActive]        BIT              NOT NULL,
    [CreatedByUserId] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt]       DATETIME2 (7)    NOT NULL,
    [UpdatedAt]       DATETIME2 (7)    NULL,
    [DeletedAt]       DATETIME2 (7)    NULL,
    CONSTRAINT [PK_Announcements] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
