using TravelPort.Domain.Common;
using TravelPort.Domain.Enums;

namespace TravelPort.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinAmount { get; set; } = 0;
    public decimal? MaxDiscount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; } = 0;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive    { get; set; } = true;
    public bool IsFeatured  { get; set; } = false;
}
