using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info | warning | success
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid CreatedByUserId { get; set; }
}
