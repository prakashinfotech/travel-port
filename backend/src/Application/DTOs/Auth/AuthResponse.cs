namespace TravelPort.Application.DTOs.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserTokenDto User
);

public record UserTokenDto(Guid Id, string Name, string Email, string Role, Guid? HotelId = null, Guid? OperatorCompanyId = null);
