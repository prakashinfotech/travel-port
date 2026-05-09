-- Single-row dashboard KPIs used by the admin panel
CREATE VIEW [dbo].[vw_AdminDashboard]
AS
SELECT
    (SELECT COUNT(1) FROM [dbo].[Users]    WHERE [DeletedAt] IS NULL AND [Role] = 'User') AS [TotalUsers],
    (SELECT COUNT(1) FROM [dbo].[Bookings] WHERE [DeletedAt] IS NULL)                     AS [TotalBookings],
    (SELECT COUNT(1) FROM [dbo].[Bookings] WHERE [DeletedAt] IS NULL AND [Status] = 'Confirmed') AS [ConfirmedBookings],
    (SELECT COUNT(1) FROM [dbo].[Bookings] WHERE [DeletedAt] IS NULL AND [Status] = 'Cancelled') AS [CancelledBookings],
    (SELECT ISNULL(SUM([FinalAmount]), 0)
       FROM [dbo].[Bookings]
      WHERE [DeletedAt] IS NULL AND [Status] = 'Confirmed')                               AS [TotalRevenue],
    (SELECT COUNT(1) FROM [dbo].[Flights]  WHERE [IsActive] = 1 AND [DeletedAt] IS NULL) AS [ActiveFlights],
    (SELECT COUNT(1) FROM [dbo].[Hotels]   WHERE [IsActive] = 1 AND [DeletedAt] IS NULL) AS [ActiveHotels],
    (SELECT COUNT(1) FROM [dbo].[Coupons]  WHERE [IsActive] = 1 AND [DeletedAt] IS NULL) AS [ActiveCoupons];
GO
