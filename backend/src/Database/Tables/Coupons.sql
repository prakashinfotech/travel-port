CREATE TABLE [dbo].[Coupons] (
    [Id]          UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [Code]        NVARCHAR (30)    NOT NULL,
    [Type]        NVARCHAR (20)    NOT NULL,
    [Value]       DECIMAL (10, 2)  NOT NULL,
    [MinAmount]   DECIMAL (10, 2)  DEFAULT ((0.0)) NOT NULL,
    [MaxDiscount] DECIMAL (10, 2)  NULL,
    [UsageLimit]  INT              NULL,
    [UsedCount]   INT              DEFAULT ((0)) NOT NULL,
    [ExpiresAt]   DATETIME2 (7)    NULL,
    [IsActive]    BIT              DEFAULT (CONVERT([bit],(1))) NOT NULL,
    [CreatedAt]   DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]   DATETIME2 (7)    NULL,
    [DeletedAt]   DATETIME2 (7)    NULL,
    [IsFeatured]  BIT              DEFAULT (CONVERT([bit],(0))) NOT NULL,
    CONSTRAINT [PK_Coupons] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Coupons_Code]
    ON [dbo].[Coupons]([Code] ASC);


GO
