-- Returns the current wallet balance for a user. Returns NULL if no wallet exists.
CREATE FUNCTION [dbo].[fn_GetWalletBalance]
(
    @UserId UNIQUEIDENTIFIER
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @Balance DECIMAL(10, 2);

    SELECT @Balance = [Balance]
    FROM [dbo].[Wallets]
    WHERE [UserId] = @UserId AND [DeletedAt] IS NULL;

    RETURN @Balance;
END;
GO
