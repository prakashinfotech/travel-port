using System.Security.Cryptography;
using System.Text;
using TravelPort.Application.Common.Constants;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Auth;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class AuthService : IAuthService
{
    private static readonly TimeSpan PasswordResetTtl = TimeSpan.FromHours(1);
    private const string PasswordResetTokenPrefix = "password_reset:token:";
    private const string PasswordResetUserPrefix = "password_reset:user:";

    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwt;
    private readonly IEmailService _email;
    private readonly ICacheService _cache;

    public AuthService(
        IUserRepository users,
        IRefreshTokenRepository tokens,
        IUnitOfWork uow,
        IJwtService jwt,
        IEmailService email,
        ICacheService cache)
    {
        _users = users;
        _tokens = tokens;
        _uow = uow;
        _jwt = jwt;
        _email = email;
        _cache = cache;
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, SecurityConstants.BcryptWorkFactor),
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

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByEmailAsync(request.Email.ToLowerInvariant(), ct);
        if (user is null || !user.IsActive)
            return;

        var existingTokenKey = await _cache.GetAsync<string>(GetUserResetKey(user.Id), ct);
        if (!string.IsNullOrWhiteSpace(existingTokenKey))
            await _cache.RemoveAsync(existingTokenKey, ct);

        var rawToken = GenerateSecureToken();
        var tokenKey = GetTokenCacheKey(rawToken);

        await _cache.SetAsync(tokenKey, new ResetPasswordTokenCacheEntry(user.Id), PasswordResetTtl, ct);
        await _cache.SetAsync(GetUserResetKey(user.Id), tokenKey, PasswordResetTtl, ct);

        var resetLink = $"http://localhost:5173/reset-password?token={Uri.EscapeDataString(rawToken)}";
        await _email.SendPasswordResetAsync(user.Email, user.Name, resetLink, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var tokenKey = GetTokenCacheKey(request.Token);
        var entry = await _cache.GetAsync<ResetPasswordTokenCacheEntry>(tokenKey, ct)
            ?? throw new BusinessException("Reset link is invalid or expired.");

        var user = await _users.GetByIdAsync(entry.UserId, ct)
            ?? throw new BusinessException("Reset link is invalid or expired.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, SecurityConstants.BcryptWorkFactor);

        await _tokens.RevokeAllForUserAsync(user.Id, ct);
        await _cache.RemoveAsync(tokenKey, ct);
        await _cache.RemoveAsync(GetUserResetKey(user.Id), ct);
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

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string GetTokenCacheKey(string rawToken)
        => PasswordResetTokenPrefix + ComputeSha256(rawToken);

    private static string GetUserResetKey(Guid userId)
        => PasswordResetUserPrefix + userId;

    private static string ComputeSha256(string input)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash);
    }

    private sealed record ResetPasswordTokenCacheEntry(Guid UserId);
}
