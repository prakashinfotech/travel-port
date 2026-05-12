namespace TravelPort.Application.DTOs.Admin;

public record AdminUserDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string Role,
    bool IsActive,
    bool IsVerified,
    decimal WalletBalance,
    int TotalBookings,
    DateTime CreatedAt
);
