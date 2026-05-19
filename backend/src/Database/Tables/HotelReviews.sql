CREATE TABLE [dbo].[HotelReviews]
(
    [Id]        UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_HotelReviews_Id] DEFAULT NEWSEQUENTIALID(),
    [HotelId]   UNIQUEIDENTIFIER NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Rating]    INT              NOT NULL,
    [Comment]   NVARCHAR(1000)   NOT NULL,
    [CreatedAt] DATETIME2        NOT NULL CONSTRAINT [DF_HotelReviews_CreatedAt] DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2        NULL,
    [DeletedAt] DATETIME2        NULL,

    CONSTRAINT [PK_HotelReviews] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_HotelReviews_Hotels] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotels]([Id]),
    CONSTRAINT [FK_HotelReviews_Users]  FOREIGN KEY ([UserId])  REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [CK_HotelReviews_Rating] CHECK ([Rating] >= 1 AND [Rating] <= 5)
);

GO
CREATE INDEX [IX_HotelReviews_HotelId] ON [dbo].[HotelReviews]([HotelId]);
GO
CREATE UNIQUE INDEX [IX_HotelReviews_HotelId_UserId] ON [dbo].[HotelReviews]([HotelId], [UserId]) WHERE [DeletedAt] IS NULL;
