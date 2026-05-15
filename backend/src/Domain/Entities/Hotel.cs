using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Hotel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal StarRating { get; set; }
    public decimal ReviewScore { get; set; } = 4.0m;
    public int ReviewCount { get; set; } = 0;
    public string? Description { get; set; }
    public string? Amenities { get; set; }
    public string? ImageUrl { get; set; }
    public string? Images { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<HotelRoom> Rooms { get; set; } = new List<HotelRoom>();
}
