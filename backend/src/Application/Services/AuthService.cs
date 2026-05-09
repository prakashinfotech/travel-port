using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Auth;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwt;

    public AuthService(IUserRepository users, IRefreshTokenRepository tokens, IUnitOfWork uow, IJwtService jwt)
    {
        _users = users;
        _tokens = tokens;
        _uow = uow;
        _jwt = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(request.Email, ct))
            throw new BusinessException("Email is already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email.ToLowerInvariant(),
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            Role = UserRole.User,
            IsActive = true
        };
        user.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = user.Id };

        await _users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByEmailAsync(request.Email.ToLowerInvariant(), ct)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedException("Account is disabled.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await _tokens.GetByTokenAsync(refreshToken, ct)
            ?? throw new UnauthorizedException("Invalid or expired refresh token.");

        if (stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("Refresh token has expired.");

        stored.IsRevoked = true;
        await _uow.SaveChangesAsync(ct);

        var user = await _users.GetByIdAsync(stored.UserId, ct)
            ?? throw new UnauthorizedException("User not found.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task LogoutAsync(Guid userId, CancellationToken ct = default)
    {
        await _tokens.RevokeAllForUserAsync(userId, ct);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        var rawRefresh = _jwt.GenerateRefreshToken();

        await _tokens.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = rawRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        }, ct);
        await _uow.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, rawRefresh, 900,
            new UserTokenDto(user.Id, user.Name, user.Email, user.Role.ToString()));
    }
}
