using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly TravelPortDbContext _context;

    public RefreshTokenRepository(TravelPortDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(RefreshToken token, CancellationToken ct = default)
        => await _context.RefreshTokens.AddAsync(token, ct);

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default)
        => await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == token && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow, ct);

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync(ct);
        tokens.ForEach(t => t.IsRevoked = true);
    }

    public async Task<int> DeleteExpiredAsync(CancellationToken ct = default)
    {
        var expired = await _context.RefreshTokens
            .Where(r => r.IsRevoked || r.ExpiresAt < DateTime.UtcNow)
            .ToListAsync(ct);
        _context.RemoveRange(expired);
        return expired.Count;
    }
}
