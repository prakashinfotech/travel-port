using TravelPort.Domain.Common;
using TravelPort.Domain.Enums;

namespace TravelPort.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid BookingId { get; set; }
    public PaymentMethod Method { get; set; }
    public string? GatewayOrderId { get; set; }
    public string? GatewayPaymentId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime? PaidAt { get; set; }

    public Booking Booking { get; set; } = null!;
}
