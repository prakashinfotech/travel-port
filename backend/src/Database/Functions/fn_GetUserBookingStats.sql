-- Table-valued function: returns booking statistics per user for the admin dashboard.
CREATE FUNCTION [dbo].[fn_GetUserBookingStats]
(
    @UserId UNIQUEIDENTIFIER = NULL   -- NULL = all users
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        u.[Id] AS [UserId],
        u.[Name],
        u.[Email],
        COUNT(b.[Id])                                                AS [TotalBookings],
        COUNT(CASE WHEN b.[Status] = 'Confirmed'  THEN 1 END)       AS [ConfirmedBookings],
        COUNT(CASE WHEN b.[Status] = 'Cancelled'  THEN 1 END)       AS [CancelledBookings],
        ISNULL(SUM(CASE WHEN b.[Status] = 'Confirmed' THEN b.[FinalAmount] END), 0) AS [TotalSpent],
        ISNULL(dbo.fn_GetWalletBalance(u.[Id]), 0)                  AS [WalletBalance],
        MAX(b.[CreatedAt])                                           AS [LastBookingDate]
    FROM [dbo].[Users] u
    LEFT JOIN [dbo].[Bookings] b
        ON b.[UserId] = u.[Id] AND b.[DeletedAt] IS NULL
    WHERE
        u.[DeletedAt] IS NULL
        AND (@UserId IS NULL OR u.[Id] = @UserId)
    GROUP BY
        u.[Id], u.[Name], u.[Email]
);
GO
