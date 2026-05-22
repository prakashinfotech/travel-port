using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Notifications;

namespace TravelPort.API.Controllers;

[Authorize]
[Route("api/v1/users/notifications")]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications)
        => _notifications = notifications;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetAll(CancellationToken ct)
    {
        var list = await _notifications.GetForUserAsync(UserId, ct);
        return Ok(ApiResponse<List<NotificationDto>>.Ok(list));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> UnreadCount(CancellationToken ct)
    {
        var count = await _notifications.GetUnreadCountAsync(UserId, ct);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkRead(Guid id, CancellationToken ct)
    {
        await _notifications.MarkReadAsync(id, UserId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Marked as read."));
    }

    [HttpPatch("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllRead(CancellationToken ct)
    {
        await _notifications.MarkAllReadAsync(UserId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "All notifications marked as read."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        await _notifications.DeleteAsync(id, UserId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Notification deleted."));
    }
}
