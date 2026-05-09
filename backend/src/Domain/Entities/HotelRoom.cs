using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class HotelRoom : BaseEntity
{
    public Guid HotelId { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int MaxGuests { get; set; }
    public int TotalRooms { get; set; }
    public string? Amenities { get; set; }
    public bool IsActive { get; set; } = true;

    public Hotel Hotel { get; set; } = null!;
}
