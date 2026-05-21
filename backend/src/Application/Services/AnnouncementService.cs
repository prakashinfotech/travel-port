using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;

namespace TravelPort.Application.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IRepository<Announcement> _repo;
    private readonly IUnitOfWork _uow;

    public AnnouncementService(IRepository<Announcement> repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow  = uow;
    }

    public async Task<List<AnnouncementDto>> GetActiveAsync(CancellationToken ct = default)
    {
        var all = await _repo.GetAllAsync(ct);
        var now = DateTime.UtcNow;
        return all
            .Where(a => a.IsActive && (a.ExpiresAt == null || a.ExpiresAt > now))
            .OrderByDescending(a => a.CreatedAt)
            .Select(ToDto)
            .ToList();
    }

    public async Task<List<AnnouncementDto>> GetAllAsync(CancellationToken ct = default)
    {
        var all = await _repo.GetAllAsync(ct);
        return all.OrderByDescending(a => a.CreatedAt).Select(ToDto).ToList();
    }

    public async Task<AnnouncementDto> CreateAsync(Guid adminId, CreateAnnouncementRequest req, CancellationToken ct = default)
    {
        var announcement = new Announcement
        {
            Message          = req.Message.Trim(),
            Type             = req.Type.ToLower(),
            ExpiresAt        = req.ExpiresAt,
            IsActive         = true,
            CreatedByUserId  = adminId,
        };
        await _repo.AddAsync(announcement, ct);
        await _uow.SaveChangesAsync(ct);
        return ToDto(announcement);
    }

    public async Task<AnnouncementDto> UpdateAsync(Guid id, UpdateAnnouncementRequest req, CancellationToken ct = default)
    {
        var a = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Announcement", id);
        if (req.Message  != null) a.Message   = req.Message.Trim();
        if (req.Type     != null) a.Type      = req.Type.ToLower();
        if (req.ExpiresAt.HasValue) a.ExpiresAt = req.ExpiresAt.Value;
        if (req.IsActive .HasValue) a.IsActive  = req.IsActive.Value;
        await _repo.UpdateAsync(a, ct);
        await _uow.SaveChangesAsync(ct);
        return ToDto(a);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Announcement", id);
        await _repo.DeleteAsync(a, ct);
        await _uow.SaveChangesAsync(ct);
    }

    private static AnnouncementDto ToDto(Announcement a) =>
        new(a.Id, a.Message, a.Type, a.ExpiresAt, a.IsActive, a.CreatedAt);
}
