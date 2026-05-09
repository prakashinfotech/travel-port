-- Generates a unique booking reference like TP2024001234
CREATE FUNCTION [dbo].[fn_GenerateBookingRef]()
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Year     NVARCHAR(4)  = CAST(YEAR(GETUTCDATE()) AS NVARCHAR(4));
    DECLARE @Count    INT;
    DECLARE @Sequence NVARCHAR(6);

    SELECT @Count = COUNT(1) + 1 FROM [dbo].[Bookings];
    SET @Sequence = RIGHT('000000' + CAST(@Count AS NVARCHAR(6)), 6);

    RETURN 'TP' + @Year + @Sequence;
END;
GO
