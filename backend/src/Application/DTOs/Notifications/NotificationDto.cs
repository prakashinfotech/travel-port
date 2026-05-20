namespace TravelPort.Application.DTOs.Notifications;

public record NotificationDto(
    Guid     Id,
    string   Type,
    string   Title,
    string   Message,
    bool     IsRead,
    DateTime CreatedAt
);
