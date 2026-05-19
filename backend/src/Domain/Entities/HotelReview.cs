using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class HotelReview : BaseEntity
{
    public Guid HotelId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;

    public Hotel Hotel { get; set; } = null!;
    public User User { get; set; } = null!;
}
