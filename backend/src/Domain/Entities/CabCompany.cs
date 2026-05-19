using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class CabCompany : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? City { get; set; }
    public string? CabTypes { get; set; }
    public bool IsIndividualDriver { get; set; } = false;
    public string? DriverLicenseNumber { get; set; }
    public bool IsActive { get; set; } = true;
}
