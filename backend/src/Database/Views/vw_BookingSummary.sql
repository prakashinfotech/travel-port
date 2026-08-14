-- Full booking summary joining users, bookings, and payments - used by admin dashboard
CREATE VIEW [dbo].[vw_BookingSummary]
AS
SELECT
    b.[Id]              AS [BookingId],
    b.[BookingRef],
    b.[BookingType],
    b.[ReferenceId],
    b.[Status]         AS [BookingStatus],
    b.[TotalAmount],
    b.[DiscountAmount],
    b.[FinalAmount],
    b.[CancelledAt],
    b.[RefundAmount],
    b.[CreatedAt]      AS [BookedAt],
    u.[Id]              AS [UserId],
    u.[Name]           AS [UserName],
    u.[Email]          AS [UserEmail],
    u.[Phone]          AS [UserPhone],
    p.[Id]              AS [PaymentId],
    p.[Method]         AS [PaymentMethod],
    p.[Status]         AS [PaymentStatus],
    p.[Amount]         AS [PaymentAmount],
    p.[PaidAt]
FROM [dbo].[Bookings]  b
INNER JOIN [dbo].[Users]    u ON u.[Id]        = b.[UserId] AND u.[DeletedAt] IS NULL
LEFT  JOIN [dbo].[Payments] p ON p.[BookingId] = b.[Id]     AND p.[DeletedAt] IS NULL
WHERE b.[DeletedAt] IS NULL;
GO
