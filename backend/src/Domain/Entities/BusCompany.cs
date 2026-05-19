using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class BusCompany : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? HeadquartersCity { get; set; }
    public string? BusTypes { get; set; }
    public bool IsActive { get; set; } = true;
}
