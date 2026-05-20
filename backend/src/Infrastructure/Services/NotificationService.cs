using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Notifications;
using TravelPort.Domain.Entities;

namespace TravelPort.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _repo;
    private readonly IUnitOfWork _uow;

    public NotificationService(IRepository<Notification> repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow  = uow;
    }

    public async Task CreateAsync(Guid userId, string type, string title, string message, CancellationToken ct = default)
    {
        await _repo.AddAsync(new Notification
        {
            Id      = Guid.NewGuid(),
            UserId  = userId,
            Type    = type,
            Title   = title,
            Message = message,
        }, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<List<NotificationDto>> GetForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _repo.FindAsync(n => n.UserId == userId, ct);
        return list
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(ToDto)
            .ToList();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _repo.FindAsync(n => n.UserId == userId && !n.IsRead, ct);
        return list.Count;
    }

    public async Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
    {
        var n = await _repo.GetByIdAsync(notificationId, ct);
        if (n is null || n.UserId != userId) return;
        n.IsRead = true;
        await _repo.UpdateAsync(n, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unread = await _repo.FindAsync(n => n.UserId == userId && !n.IsRead, ct);
        foreach (var n in unread)
        {
            n.IsRead = true;
            await _repo.UpdateAsync(n, ct);
        }
        await _uow.SaveChangesAsync(ct);
    }

    private static NotificationDto ToDto(Notification n) =>
        new(n.Id, n.Type, n.Title, n.Message, n.IsRead, n.CreatedAt);
}
