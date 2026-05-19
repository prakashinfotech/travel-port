using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class FlightCompany : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string IataCode { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? HeadquartersCity { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Flight> Flights { get; set; } = new List<Flight>();
}
