using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Users;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class WalletService : IWalletService
{
    private readonly IWalletRepository _wallets;
    private readonly IRepository<WalletTransaction> _transactions;
    private readonly IUnitOfWork _uow;

    public WalletService(IWalletRepository wallets, IRepository<WalletTransaction> transactions, IUnitOfWork uow)
    {
        _wallets = wallets;
        _transactions = transactions;
        _uow = uow;
    }

    public async Task<WalletDto> TopUpAsync(Guid userId, WalletTopUpRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new BusinessException("Amount must be greater than zero.");
        if (request.Amount > 100000)
            throw new BusinessException("Maximum top-up is ₹1,00,000 per transaction.");

        var wallet = await _wallets.GetByUserIdWithTransactionsAsync(userId, ct)
            ?? throw new NotFoundException("Wallet not found for user.");

        wallet.Balance += request.Amount;
        await _transactions.AddAsync(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.Credit,
            Amount = request.Amount,
            Description = request.Description ?? "Wallet top-up"
        }, ct);
        await _wallets.UpdateAsync(wallet, ct);
        await _uow.SaveChangesAsync(ct);

        var recent = wallet.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(ToDto)
            .ToList();

        return new WalletDto(wallet.Id, wallet.Balance, recent);
    }

    public async Task<(List<WalletTransactionDto> Items, int Total)> GetTransactionsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var wallet = await _wallets.GetByUserIdWithTransactionsAsync(userId, ct)
            ?? throw new NotFoundException("Wallet not found for user.");

        var total = await _wallets.GetTransactionCountAsync(wallet.Id, ct);
        var items = await _wallets.GetTransactionsPagedAsync(wallet.Id, page, pageSize, ct);
        return (items.Select(ToDto).ToList(), total);
    }

    // Called within another service's UoW — does NOT save; caller must call _uow.SaveChangesAsync
    public async Task DeductAsync(Guid userId, decimal amount, string description,
        Guid? referenceId = null, CancellationToken ct = default)
    {
        var wallet = await _wallets.GetByUserIdWithTransactionsAsync(userId, ct)
            ?? throw new NotFoundException("Wallet not found for user.");

        if (wallet.Balance < amount)
            throw new BusinessException($"Insufficient wallet balance. Available: ₹{wallet.Balance:N2}, Required: ₹{amount:N2}.");

        wallet.Balance -= amount;
        await _transactions.AddAsync(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.Debit,
            Amount = amount,
            Description = description,
            ReferenceId = referenceId
        }, ct);
        await _wallets.UpdateAsync(wallet, ct);
    }

    // Called during cancellation — does NOT save; caller must call _uow.SaveChangesAsync
    public async Task RefundAsync(Guid userId, decimal amount, string description,
        Guid? referenceId = null, CancellationToken ct = default)
    {
        var wallet = await _wallets.GetByUserIdWithTransactionsAsync(userId, ct)
            ?? throw new NotFoundException("Wallet not found for user.");

        wallet.Balance += amount;
        await _transactions.AddAsync(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.Credit,
            Amount = amount,
            Description = description,
            ReferenceId = referenceId
        }, ct);
        await _wallets.UpdateAsync(wallet, ct);
    }

    private static WalletTransactionDto ToDto(WalletTransaction t) =>
        new(t.Type.ToString(), t.Amount, t.Description, t.CreatedAt);
}
