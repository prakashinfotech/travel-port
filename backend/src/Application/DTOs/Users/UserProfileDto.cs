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

public record WalletTopUpRequest(decimal Amount, string? Description = null);

public record WalletTransactionsResponse(List<WalletTransactionDto> Items, int Total, int Page, int PageSize);

public record SavedCardDto(
    Guid CardId,
    string CardHolderName,
    string LastFourDigits,
    int ExpiryMonth,
    int ExpiryYear,
    string CardType,
    string? NickName,
    bool IsDefault
);

public record AddSavedCardRequest(
    string CardHolderName,
    string CardNumber,       // received but only last 4 digits stored
    int ExpiryMonth,
    int ExpiryYear,
    string CardType,
    string? NickName = null,
    bool SetAsDefault = false
);
