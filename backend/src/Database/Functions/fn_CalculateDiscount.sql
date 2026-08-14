-- Returns the discount amount for a given coupon code and order amount.
-- Returns 0 if the coupon is invalid or not applicable.
CREATE FUNCTION [dbo].[fn_CalculateDiscount]
(
    @CouponCode  NVARCHAR(30),
    @OrderAmount DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @Discount    DECIMAL(10, 2) = CAST(0.00 AS DECIMAL(10, 2));
    DECLARE @Type        NVARCHAR(20);
    DECLARE @Value       DECIMAL(10, 2);
    DECLARE @MinAmount   DECIMAL(10, 2);
    DECLARE @MaxDiscount DECIMAL(10, 2);
    DECLARE @UsageLimit  INT;
    DECLARE @UsedCount   INT;

    SELECT
        @Type        = [Type],
        @Value       = [Value],
        @MinAmount   = [MinAmount],
        @MaxDiscount = [MaxDiscount],
        @UsageLimit  = [UsageLimit],
        @UsedCount   = [UsedCount]
    FROM [dbo].[Coupons]
    WHERE [Code]     = @CouponCode
      AND [IsActive] = 1
      AND ISNULL([ExpiresAt], CONVERT(DATETIME2, '9999-12-31')) > GETUTCDATE()
      AND [DeletedAt] IS NULL;

    -- Coupon not found or expired
    IF @Type IS NULL RETURN CAST(0.00 AS DECIMAL(10, 2));

    -- Minimum order amount not met
    IF @OrderAmount < ISNULL(@MinAmount, CAST(0.00 AS DECIMAL(10, 2))) RETURN CAST(0.00 AS DECIMAL(10, 2));

    -- Usage limit exceeded
    IF @UsageLimit IS NOT NULL AND ISNULL(@UsedCount, 0) >= @UsageLimit RETURN CAST(0.00 AS DECIMAL(10, 2));

    SET @Discount = CASE @Type
        WHEN 'Percentage' THEN @OrderAmount * ISNULL(@Value, CAST(0.00 AS DECIMAL(10, 2))) / CAST(100.00 AS DECIMAL(10, 2))
        ELSE ISNULL(@Value, CAST(0.00 AS DECIMAL(10, 2)))
    END;

    -- Cap at maximum discount
    IF @MaxDiscount IS NOT NULL AND @Discount > @MaxDiscount
        SET @Discount = @MaxDiscount;

    -- Cannot exceed order amount
    IF @Discount > @OrderAmount
        SET @Discount = @OrderAmount;

    RETURN @Discount;
END;
GO
