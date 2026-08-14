CREATE TABLE [dbo].[HotelReviews] (
    [Id]        UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [HotelId]   UNIQUEIDENTIFIER NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Rating]    INT              NOT NULL,
    [Comment]   NVARCHAR (1000)  NOT NULL,
    [CreatedAt] DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt] DATETIME2 (7)    NULL,
    [DeletedAt] DATETIME2 (7)    NULL,
    CONSTRAINT [PK_HotelReviews] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_HotelReviews_Hotels_HotelId] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotels] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_HotelReviews_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id])
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_HotelReviews_HotelId_UserId]
    ON [dbo].[HotelReviews]([HotelId] ASC, [UserId] ASC) WHERE ([DeletedAt] IS NULL);


GO

CREATE NONCLUSTERED INDEX [IX_HotelReviews_HotelId]
    ON [dbo].[HotelReviews]([HotelId] ASC);


GO
