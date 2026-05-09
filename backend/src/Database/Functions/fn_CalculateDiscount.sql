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
    DECLARE @Discount    DECIMAL(10, 2) = 0;
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
      AND ([ExpiresAt] IS NULL OR [ExpiresAt] > GETUTCDATE())
      AND [DeletedAt] IS NULL;

    -- Coupon not found or expired
    IF @Type IS NULL RETURN 0;

    -- Minimum order amount not met
    IF @OrderAmount < @MinAmount RETURN 0;

    -- Usage limit exceeded
    IF @UsageLimit IS NOT NULL AND @UsedCount >= @UsageLimit RETURN 0;

    SET @Discount = CASE @Type
        WHEN 'Percentage' THEN @OrderAmount * @Value / 100
        ELSE @Value
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
