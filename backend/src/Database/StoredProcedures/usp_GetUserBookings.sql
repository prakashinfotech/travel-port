CREATE PROCEDURE [dbo].[usp_GetUserBookings]
    @UserId     UNIQUEIDENTIFIER,
    @Status     NVARCHAR(20) = NULL,   -- NULL = all statuses
    @PageNumber INT          = 1,
    @PageSize   INT          = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        b.[Id] AS [BookingId],
        b.[BookingRef],
        b.[BookingType],
        b.[ReferenceId],
        b.[TotalAmount],
        b.[DiscountAmount],
        b.[FinalAmount],
        b.[Status],
        b.[CreatedAt],
        b.[CancelledAt],
        b.[RefundAmount],
        p.[Id] AS [PaymentId],
        p.[Method]       AS [PaymentMethod],
        p.[Status]       AS [PaymentStatus],
        p.[PaidAt],
        COUNT(1) OVER () AS [TotalCount]
    FROM [dbo].[Bookings] b
    LEFT JOIN [dbo].[Payments] p ON p.[BookingId] = b.[Id] AND p.[DeletedAt] IS NULL
    WHERE
        b.[UserId]    = @UserId
        AND b.[DeletedAt] IS NULL
        AND (@Status IS NULL OR b.[Status] = @Status)
    ORDER BY b.[CreatedAt] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
