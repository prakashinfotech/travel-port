using TravelPort.Domain.Common;
using TravelPort.Domain.Enums;

namespace TravelPort.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public Guid? HotelId { get; set; }
    public Guid? OperatorCompanyId { get; set; }

    public Wallet? Wallet { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<SavedTraveller> SavedTravellers { get; set; } = new List<SavedTraveller>();
}
