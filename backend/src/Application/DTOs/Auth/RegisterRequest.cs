namespace TravelPort.Application.DTOs.Auth;

public record RegisterRequest(
    string Name,
    string Email,
    string Phone,
    string Password
);
