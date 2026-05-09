using TravelPort.Application.DTOs.Users;

namespace TravelPort.Application.Services.Interfaces;

public interface IWalletService
{
    Task<WalletDto> TopUpAsync(Guid userId, WalletTopUpRequest request, CancellationToken ct = default);
    Task<(List<WalletTransactionDto> Items, int Total)> GetTransactionsAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task DeductAsync(Guid userId, decimal amount, string description, Guid? referenceId = null, CancellationToken ct = default);
    Task RefundAsync(Guid userId, decimal amount, string description, Guid? referenceId = null, CancellationToken ct = default);
}
