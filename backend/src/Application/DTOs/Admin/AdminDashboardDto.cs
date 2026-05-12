namespace TravelPort.Application.DTOs.Admin;

public record AdminDashboardDto(
    int TotalUsers,
    int TotalBookings,
    decimal TotalRevenue,
    int ActiveBookings,
    int CancelledBookings,
    int FlightBookings,
    int HotelBookings,
    decimal AvgBookingValue
);
