using TravelPort.Domain.Common;
using TravelPort.Domain.Enums;

namespace TravelPort.Domain.Entities;

public class Booking : BaseEntity
{
    public string BookingRef { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public BookingType BookingType { get; set; }
    public Guid ReferenceId { get; set; }
    public int? Passengers { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public string? CouponCode { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal FinalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime? CancelledAt { get; set; }
    public decimal? RefundAmount { get; set; }
    // Guest contact details (for hotel bookings where guest may differ from account holder)
    public string? GuestName { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestPhone { get; set; }
    // JSON snapshot of transport details for Bus/Train/Cab bookings
    public string? TransportSnapshot { get; set; }

    public User User { get; set; } = null!;
    public Payment? Payment { get; set; }
}
