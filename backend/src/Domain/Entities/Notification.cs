using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid   UserId  { get; set; }
    public string Type    { get; set; } = string.Empty; // BookingConfirmed | BookingCancelled | CouponExpiring | PriceDrop
    public string Title   { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool   IsRead  { get; set; } = false;

    public User? User { get; set; }
}
