CREATE PROCEDURE [dbo].[usp_BookFlight]
    @UserId         UNIQUEIDENTIFIER,
    @FlightId       UNIQUEIDENTIFIER,
    @Class          NVARCHAR(20),
    @PassengerCount INT,
    @CouponCode     NVARCHAR(30)     = NULL,
    @BookingId      UNIQUEIDENTIFIER OUTPUT,
    @BookingRef     NVARCHAR(20)     OUTPUT,
    @FinalAmount    DECIMAL(10, 2)   OUTPUT,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @BookingId = NULL;
    SET @BookingRef = NULL;
    SET @FinalAmount = CAST(0.00 AS DECIMAL(10, 2));
    SET @ErrorMessage = NULL;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate flight and seat availability
        DECLARE @EconomyPrice   DECIMAL(10, 2),
                @BusinessPrice  DECIMAL(10, 2),
                @AvailableSeats INT;

        SELECT
            @EconomyPrice   = [EconomyPrice],
            @BusinessPrice  = [BusinessPrice],
            @AvailableSeats = [AvailableSeats]
        FROM [dbo].[Flights] WITH (UPDLOCK, ROWLOCK)
        WHERE [Id] = @FlightId AND [IsActive] = 1 AND [DeletedAt] IS NULL;

        IF @EconomyPrice IS NULL
        BEGIN
            SET @ErrorMessage = 'Flight not found or inactive.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @PassengerCount <= 0
        BEGIN
            SET @ErrorMessage = 'Passenger count must be greater than zero.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @Class = 'Business' AND @BusinessPrice IS NULL
        BEGIN
            SET @ErrorMessage = 'Business class is not available for this flight.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @AvailableSeats < @PassengerCount
        BEGIN
            SET @ErrorMessage = 'Not enough seats available.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Calculate price
        DECLARE @UnitPrice     DECIMAL(10, 2) = CASE @Class WHEN 'Business' THEN ISNULL(@BusinessPrice, @EconomyPrice) ELSE @EconomyPrice END;
        DECLARE @TotalAmount   DECIMAL(10, 2) = @UnitPrice * CAST(@PassengerCount AS DECIMAL(10, 2));
        DECLARE @DiscountAmt   DECIMAL(10, 2) = CAST(0.00 AS DECIMAL(10, 2));

        -- Apply coupon if provided
        IF @CouponCode IS NOT NULL
        BEGIN
            DECLARE @CouponId    UNIQUEIDENTIFIER,
                    @CouponType  NVARCHAR(20),
                    @CouponValue DECIMAL(10, 2),
                    @MinAmount   DECIMAL(10, 2),
                    @MaxDiscount DECIMAL(10, 2),
                    @UsageLimit  INT,
                    @UsedCount   INT;

            SELECT
                @CouponId    = [Id],
                @CouponType  = [Type],
                @CouponValue = [Value],
                @MinAmount   = [MinAmount],
                @MaxDiscount = [MaxDiscount],
                @UsageLimit  = [UsageLimit],
                @UsedCount   = [UsedCount]
            FROM [dbo].[Coupons]
            WHERE [Code] = @CouponCode
              AND [IsActive] = 1
              AND ISNULL([ExpiresAt], CONVERT(DATETIME2, '9999-12-31')) > GETUTCDATE()
              AND [DeletedAt] IS NULL;

            IF @CouponId IS NOT NULL AND @TotalAmount >= ISNULL(@MinAmount, CAST(0.00 AS DECIMAL(10, 2)))
               AND (@UsageLimit IS NULL OR ISNULL(@UsedCount, 0) < @UsageLimit)
            BEGIN
                SET @DiscountAmt = CASE @CouponType
                    WHEN 'Percentage' THEN @TotalAmount * ISNULL(@CouponValue, CAST(0.00 AS DECIMAL(10, 2))) / CAST(100.00 AS DECIMAL(10, 2))
                    ELSE ISNULL(@CouponValue, CAST(0.00 AS DECIMAL(10, 2)))
                END;

                IF @MaxDiscount IS NOT NULL AND @DiscountAmt > @MaxDiscount
                    SET @DiscountAmt = @MaxDiscount;

                -- Increment coupon usage
                UPDATE [dbo].[Coupons] SET [UsedCount] = [UsedCount] + 1 WHERE [Id] = @CouponId;
            END;
        END;

        SET @FinalAmount = @TotalAmount - @DiscountAmt;

        -- Generate booking reference
        SET @BookingRef = dbo.fn_GenerateBookingRef();

        -- Create booking
        SET @BookingId = NEWID();
        INSERT INTO [dbo].[Bookings]
            ([Id], [BookingRef], [UserId], [BookingType], [ReferenceId],
             [TotalAmount], [DiscountAmount], [FinalAmount], [Status], [Passengers], [CouponCode])
        VALUES
            (@BookingId, @BookingRef, @UserId, 'Flight', @FlightId,
             @TotalAmount, @DiscountAmt, @FinalAmount, 'Pending', @PassengerCount, @CouponCode);

        -- Decrement available seats
        UPDATE [dbo].[Flights]
        SET [AvailableSeats] = [AvailableSeats] - @PassengerCount,
            [UpdatedAt]      = GETUTCDATE()
        WHERE [Id] = @FlightId;

        -- Audit
        INSERT INTO [dbo].[AuditLogs] ([UserId], [Action], [Entity], [EntityId], [NewValues])
        VALUES (@UserId, 'BookFlight', 'Booking', CAST(@BookingId AS NVARCHAR(100)),
                CONCAT('{"bookingRef":"', @BookingRef, '","finalAmount":', @FinalAmount, '}'));

        SET @ErrorMessage = NULL;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ErrorMessage = ERROR_MESSAGE();
    END CATCH;
END;
GO
