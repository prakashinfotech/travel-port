using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class SavedCard : BaseEntity
{
    public Guid UserId { get; set; }
    public string CardHolderName { get; set; } = string.Empty;
    public string LastFourDigits { get; set; } = string.Empty;
    public int ExpiryMonth { get; set; }
    public int ExpiryYear { get; set; }
    public string CardType { get; set; } = "Visa"; // Visa / Mastercard / Amex / RuPay
    public string? NickName { get; set; }
    public bool IsDefault { get; set; } = false;

    public User User { get; set; } = null!;
}
