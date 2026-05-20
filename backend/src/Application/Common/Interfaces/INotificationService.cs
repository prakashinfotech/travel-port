using TravelPort.Application.DTOs.Notifications;

namespace TravelPort.Application.Common.Interfaces;

public interface INotificationService
{
    Task CreateAsync(Guid userId, string type, string title, string message, CancellationToken ct = default);
    Task<List<NotificationDto>> GetForUserAsync(Guid userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}
