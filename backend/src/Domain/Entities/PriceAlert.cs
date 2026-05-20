using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class PriceAlert : BaseEntity
{
    public Guid    UserId           { get; set; }
    public string  Email            { get; set; } = string.Empty;
    public string  Origin           { get; set; } = string.Empty;
    public string  Destination      { get; set; } = string.Empty;
    public DateOnly TravelDate      { get; set; }
    public decimal LastSeenPrice    { get; set; }
    public bool    IsActive         { get; set; } = true;
    public DateTime? LastNotifiedAt { get; set; }

    public User? User { get; set; }
}
