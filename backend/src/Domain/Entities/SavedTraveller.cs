using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class SavedTraveller : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateOnly? DOB { get; set; }
    public string? PassportNo { get; set; }

    public User User { get; set; } = null!;
}
