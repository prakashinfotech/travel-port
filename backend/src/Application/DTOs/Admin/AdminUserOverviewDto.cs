using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Application.DTOs.Admin;

public record AdminUserOverviewDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string Role,
    bool IsActive,
    bool IsVerified,
    decimal WalletBalance,
    DateTime CreatedAt,
    List<BookingDto> RecentBookings
);
