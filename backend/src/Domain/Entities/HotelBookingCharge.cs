using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class HotelBookingCharge : BaseEntity
{
    public Guid BookingId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public int Quantity { get; set; } = 1;
    public decimal Price { get; set; }
    public decimal Tax { get; set; }
    public string? Notes { get; set; }

    public Booking Booking { get; set; } = null!;
}
