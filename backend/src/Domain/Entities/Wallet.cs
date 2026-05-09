using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; } = 0;

    public User User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}
