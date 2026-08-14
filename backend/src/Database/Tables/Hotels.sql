CREATE TABLE [dbo].[Hotels] (
    [Id]          UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [Name]        NVARCHAR (200)   NOT NULL,
    [City]        NVARCHAR (100)   NOT NULL,
    [Address]     NVARCHAR (500)   NULL,
    [StarRating]  DECIMAL (2, 1)   NOT NULL,
    [Description] NVARCHAR (MAX)   NULL,
    [Amenities]   NVARCHAR (MAX)   NULL,
    [Latitude]    DECIMAL (9, 6)   NULL,
    [Longitude]   DECIMAL (9, 6)   NULL,
    [IsActive]    BIT              DEFAULT (CONVERT([bit],(1))) NOT NULL,
    [CreatedAt]   DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]   DATETIME2 (7)    NULL,
    [DeletedAt]   DATETIME2 (7)    NULL,
    [ImageUrl]    NVARCHAR (MAX)   NULL,
    [ReviewCount] INT              DEFAULT ((0)) NOT NULL,
    [ReviewScore] DECIMAL (18, 2)  DEFAULT ((0.0)) NOT NULL,
    [Images]      NVARCHAR (MAX)   NULL,
    CONSTRAINT [PK_Hotels] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Hotels_Rating]
    ON [dbo].[Hotels]([StarRating] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Hotels_City]
    ON [dbo].[Hotels]([City] ASC);


GO
