CREATE TABLE [dbo].[PriceAlerts] (
    [Id]             UNIQUEIDENTIFIER NOT NULL,
    [UserId]         UNIQUEIDENTIFIER NOT NULL,
    [Email]          NVARCHAR (MAX)   NOT NULL,
    [Origin]         NVARCHAR (MAX)   NOT NULL,
    [Destination]    NVARCHAR (MAX)   NOT NULL,
    [TravelDate]     DATE             NOT NULL,
    [LastSeenPrice]  DECIMAL (18, 2)  NOT NULL,
    [IsActive]       BIT              NOT NULL,
    [LastNotifiedAt] DATETIME2 (7)    NULL,
    [CreatedAt]      DATETIME2 (7)    NOT NULL,
    [UpdatedAt]      DATETIME2 (7)    NULL,
    [DeletedAt]      DATETIME2 (7)    NULL,
    CONSTRAINT [PK_PriceAlerts] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PriceAlerts_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_PriceAlerts_UserId]
    ON [dbo].[PriceAlerts]([UserId] ASC);


GO
