CREATE TABLE [dbo].[SavedTravellers] (
    [Id]         UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [UserId]     UNIQUEIDENTIFIER NOT NULL,
    [Name]       NVARCHAR (100)   NOT NULL,
    [Email]      NVARCHAR (255)   NULL,
    [Phone]      NVARCHAR (15)    NULL,
    [DOB]        DATE             NULL,
    [PassportNo] NVARCHAR (50)    NULL,
    [CreatedAt]  DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]  DATETIME2 (7)    NULL,
    [DeletedAt]  DATETIME2 (7)    NULL,
    CONSTRAINT [PK_SavedTravellers] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_SavedTravellers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_SavedTravellers_UserId]
    ON [dbo].[SavedTravellers]([UserId] ASC);


GO
