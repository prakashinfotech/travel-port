CREATE PROCEDURE [dbo].[usp_ProcessWalletTransaction]
    @UserId       UNIQUEIDENTIFIER,
    @Type         NVARCHAR(20),           -- Credit | Debit
    @Amount       DECIMAL(10, 2),
    @Description  NVARCHAR(200) = NULL,
    @ReferenceId  UNIQUEIDENTIFIER = NULL,
    @NewBalance   DECIMAL(10, 2)   OUTPUT,
    @ErrorMessage NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @WalletId      UNIQUEIDENTIFIER,
                @CurrentBalance DECIMAL(10, 2);

        SELECT @WalletId = [WalletId], @CurrentBalance = [Balance]
        FROM [dbo].[Wallets] WITH (UPDLOCK, ROWLOCK)
        WHERE [UserId] = @UserId AND [DeletedAt] IS NULL;

        IF @WalletId IS NULL
        BEGIN
            SET @ErrorMessage = 'Wallet not found for user.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @Type = 'Debit' AND @CurrentBalance < @Amount
        BEGIN
            SET @ErrorMessage = 'Insufficient wallet balance.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        SET @NewBalance = CASE @Type
            WHEN 'Credit' THEN @CurrentBalance + @Amount
            ELSE               @CurrentBalance - @Amount
        END;

        UPDATE [dbo].[Wallets]
        SET [Balance]   = @NewBalance,
            [UpdatedAt] = GETUTCDATE()
        WHERE [WalletId] = @WalletId;

        INSERT INTO [dbo].[WalletTransactions]
            ([WalletId], [Type], [Amount], [Description], [ReferenceId])
        VALUES
            (@WalletId, @Type, @Amount, @Description, @ReferenceId);

        SET @ErrorMessage = NULL;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ErrorMessage = ERROR_MESSAGE();
    END CATCH;
END;
GO
