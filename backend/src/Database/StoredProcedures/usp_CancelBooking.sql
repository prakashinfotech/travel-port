CREATE PROCEDURE [dbo].[usp_CancelBooking]
    @BookingId    UNIQUEIDENTIFIER,
    @UserId       UNIQUEIDENTIFIER,
    @RefundAmount DECIMAL(10, 2)   OUTPUT,
    @ErrorMessage NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @RefundAmount = CAST(0.00 AS DECIMAL(10, 2));
    SET @ErrorMessage = NULL;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Status      NVARCHAR(450),
                @FinalAmount DECIMAL(10, 2),
                @BookingType NVARCHAR(MAX),
                @ReferenceId UNIQUEIDENTIFIER,
                @WalletId    UNIQUEIDENTIFIER,
                @PassengerCount INT;

        SELECT
            @Status      = [Status],
            @FinalAmount = [FinalAmount],
            @BookingType = [BookingType],
            @ReferenceId = [ReferenceId],
            @PassengerCount = ISNULL([Passengers], 1)
        FROM [dbo].[Bookings]
        WHERE [Id] = @BookingId AND [UserId] = @UserId AND [DeletedAt] IS NULL;

        IF @Status IS NULL
        BEGIN
            SET @ErrorMessage = 'Booking not found.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @Status NOT IN ('Pending', 'Confirmed')
        BEGIN
            SET @ErrorMessage = 'Only Pending or Confirmed bookings can be cancelled.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Refund policy: 90% refund if cancelled more than 24 hrs before departure
        SET @RefundAmount = @FinalAmount * CAST(0.90 AS DECIMAL(10, 2));

        -- Update booking status
        UPDATE [dbo].[Bookings]
        SET [Status]       = 'Cancelled',
            [CancelledAt]  = GETUTCDATE(),
            [RefundAmount] = @RefundAmount,
            [UpdatedAt]    = GETUTCDATE()
        WHERE [Id] = @BookingId;

        -- Restore flight seats if a flight booking
        IF @BookingType = 'Flight'
        BEGIN
            UPDATE [dbo].[Flights]
            SET [AvailableSeats] = [AvailableSeats] + @PassengerCount,
                [UpdatedAt]      = GETUTCDATE()
            WHERE [Id] = @ReferenceId;
        END;

        -- Credit refund to wallet
        SELECT @WalletId = [Id] FROM [dbo].[Wallets] WHERE [UserId] = @UserId AND [DeletedAt] IS NULL;

        IF @WalletId IS NOT NULL AND @RefundAmount > CAST(0.00 AS DECIMAL(10, 2))
        BEGIN
            UPDATE [dbo].[Wallets]
            SET [Balance]   = [Balance] + @RefundAmount,
                [UpdatedAt] = GETUTCDATE()
            WHERE [Id] = @WalletId;

            INSERT INTO [dbo].[WalletTransactions]
                ([WalletId], [Type], [Amount], [Description], [ReferenceId])
            VALUES
                (@WalletId, 'Credit', @RefundAmount, 'Booking cancellation refund', @BookingId);
        END;

        -- Update payment status
        UPDATE [dbo].[Payments]
        SET [Status]    = 'Refunded',
            [UpdatedAt] = GETUTCDATE()
        WHERE [BookingId] = @BookingId AND [Status] = 'Success';

        -- Audit
        INSERT INTO [dbo].[AuditLogs] ([UserId], [Action], [Entity], [EntityId], [NewValues])
        VALUES (@UserId, 'CancelBooking', 'Booking', CAST(@BookingId AS NVARCHAR(100)),
                CONCAT('{"refundAmount":', @RefundAmount, '}'));

        SET @ErrorMessage = NULL;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ErrorMessage = ERROR_MESSAGE();
    END CATCH;
END;
GO
