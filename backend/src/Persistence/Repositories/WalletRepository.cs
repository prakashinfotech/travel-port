using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class WalletRepository : BaseRepository<Wallet>, IWalletRepository
{
    public WalletRepository(TravelPortDbContext context) : base(context) { }

    public async Task<Wallet?> GetByUserIdWithTransactionsAsync(Guid userId, CancellationToken ct = default)
        => await _dbSet
            .Include(w => w.Transactions)
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);

    public async Task<IReadOnlyList<WalletTransaction>> GetTransactionsPagedAsync(
        Guid walletId, int page, int pageSize, CancellationToken ct = default)
        => await _context.Set<WalletTransaction>()
            .Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<int> GetTransactionCountAsync(Guid walletId, CancellationToken ct = default)
        => await _context.Set<WalletTransaction>()
            .CountAsync(t => t.WalletId == walletId, ct);
}
