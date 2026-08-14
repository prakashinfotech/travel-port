CREATE TABLE [dbo].[SavedCards] (
    [Id]             UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [UserId]         UNIQUEIDENTIFIER NOT NULL,
    [CardHolderName] NVARCHAR (100)   NOT NULL,
    [LastFourDigits] NVARCHAR (4)     NOT NULL,
    [ExpiryMonth]    INT              NOT NULL,
    [ExpiryYear]     INT              NOT NULL,
    [CardType]       NVARCHAR (20)    NOT NULL,
    [NickName]       NVARCHAR (50)    NULL,
    [IsDefault]      BIT              NOT NULL,
    [CreatedAt]      DATETIME2 (7)    NOT NULL,
    [UpdatedAt]      DATETIME2 (7)    NULL,
    [DeletedAt]      DATETIME2 (7)    NULL,
    CONSTRAINT [PK_SavedCards] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_SavedCards_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_SavedCards_UserId]
    ON [dbo].[SavedCards]([UserId] ASC);


GO
