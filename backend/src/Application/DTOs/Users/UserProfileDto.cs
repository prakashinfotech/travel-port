namespace TravelPort.Application.DTOs.Users;

public record UserProfileDto(
    Guid UserId,
    string Name,
    string Email,
    string? Phone,
    string Role,
    bool IsVerified,
    DateTime CreatedAt
);

public record UpdateProfileRequest(string Name, string? Phone);

public record WalletDto(
    Guid WalletId,
    decimal Balance,
    List<WalletTransactionDto> RecentTransactions
);

public record WalletTransactionDto(
    string Type,
    decimal Amount,
    string? Description,
    DateTime CreatedAt
);

public record SavedTravellerDto(
    Guid TravellerId,
    string Name,
    string? Email,
    string? Phone,
    DateOnly? DOB
);

public record AddTravellerRequest(
    string Name,
    string? Email,
    string? Phone,
    DateOnly? DOB,
    string? PassportNo
);
