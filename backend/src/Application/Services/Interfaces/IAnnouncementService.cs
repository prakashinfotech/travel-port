using TravelPort.Application.DTOs.Admin;

namespace TravelPort.Application.Services.Interfaces;

public interface IAnnouncementService
{
    Task<List<AnnouncementDto>> GetActiveAsync(CancellationToken ct = default);
    Task<List<AnnouncementDto>> GetAllAsync(CancellationToken ct = default);
    Task<AnnouncementDto> CreateAsync(Guid adminId, CreateAnnouncementRequest req, CancellationToken ct = default);
    Task<AnnouncementDto> UpdateAsync(Guid id, UpdateAnnouncementRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
