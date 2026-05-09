using TravelPort.Domain.Common;
using TravelPort.Domain.Enums;

namespace TravelPort.Domain.Entities;

public class WalletTransaction : BaseEntity
{
    public Guid WalletId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public Guid? ReferenceId { get; set; }

    public Wallet Wallet { get; set; } = null!;
}
