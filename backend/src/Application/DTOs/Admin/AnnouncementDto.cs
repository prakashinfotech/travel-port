namespace TravelPort.Application.DTOs.Admin;

public record AnnouncementDto(
    Guid Id,
    string Message,
    string Type,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateAnnouncementRequest(
    string Message,
    string Type,       // info | warning | success
    DateTime? ExpiresAt
);

public record UpdateAnnouncementRequest(
    string? Message,
    string? Type,
    DateTime? ExpiresAt,
    bool? IsActive
);
