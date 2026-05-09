CREATE TABLE [dbo].[Coupons]
(
    [CouponId]    UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Code]        NVARCHAR(30)      NOT NULL,
    [Type]        NVARCHAR(20)      NOT NULL,   -- Percentage | Fixed
    [Value]       DECIMAL(10, 2)    NOT NULL,
    [MinAmount]   DECIMAL(10, 2)    NOT NULL DEFAULT 0,
    [MaxDiscount] DECIMAL(10, 2)    NULL,
    [UsageLimit]  INT               NULL,
    [UsedCount]   INT               NOT NULL DEFAULT 0,
    [ExpiresAt]   DATETIME2         NULL,
    [IsActive]    BIT               NOT NULL DEFAULT 1,
    [CreatedAt]   DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]   DATETIME2         NULL,
    [DeletedAt]   DATETIME2         NULL,

    CONSTRAINT [PK_Coupons]          PRIMARY KEY ([CouponId]),
    CONSTRAINT [CK_Coupons_Type]     CHECK ([Type] IN ('Percentage', 'Fixed')),
    CONSTRAINT [CK_Coupons_Value]    CHECK ([Value] > 0),
    CONSTRAINT [CK_Coupons_PctMax]   CHECK ([Type] <> 'Percentage' OR [Value] <= 100),
    CONSTRAINT [CK_Coupons_Usage]    CHECK ([UsedCount] >= 0)
);
GO

CREATE UNIQUE INDEX [IX_Coupons_Code] ON [dbo].[Coupons] ([Code]) WHERE [DeletedAt] IS NULL;
GO
