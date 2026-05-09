using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IWalletRepository : IRepository<Wallet>
{
    Task<Wallet?> GetByUserIdWithTransactionsAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<WalletTransaction>> GetTransactionsPagedAsync(Guid walletId, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetTransactionCountAsync(Guid walletId, CancellationToken ct = default);
}
