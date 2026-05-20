using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.Common.Models;
using TravelPort.Domain.Entities;

namespace TravelPort.API.Controllers;

[Authorize]
[Route("api/v1/users/price-alerts")]
public class PriceAlertsController : BaseApiController
{
    private readonly IRepository<PriceAlert> _alerts;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;

    public PriceAlertsController(IRepository<PriceAlert> alerts, IUserRepository users, IUnitOfWork uow)
    {
        _alerts = alerts;
        _users  = users;
        _uow    = uow;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PriceAlertDto>>>> GetAlerts(CancellationToken ct)
    {
        var alerts = await _alerts.FindAsync(a => a.UserId == UserId && a.IsActive, ct);
        var dtos   = alerts.OrderByDescending(a => a.CreatedAt).Select(ToDto).ToList();
        return Ok(ApiResponse<List<PriceAlertDto>>.Ok(dtos));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PriceAlertDto>>> Create(
        [FromBody] CreatePriceAlertRequest req, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(UserId, ct);

        // Deactivate any existing alert for same route+date
        var existing = await _alerts.FindAsync(
            a => a.UserId == UserId && a.Origin == req.Origin.ToUpper()
              && a.Destination == req.Destination.ToUpper()
              && a.TravelDate == req.TravelDate && a.IsActive, ct);
        foreach (var old in existing) { old.IsActive = false; await _alerts.UpdateAsync(old, ct); }

        var alert = await _alerts.AddAsync(new PriceAlert
        {
            Id             = Guid.NewGuid(),
            UserId         = UserId,
            Email          = req.Email ?? user?.Email ?? string.Empty,
            Origin         = req.Origin.ToUpper(),
            Destination    = req.Destination.ToUpper(),
            TravelDate     = req.TravelDate,
            LastSeenPrice  = req.CurrentPrice,
        }, ct);
        await _uow.SaveChangesAsync(ct);

        return StatusCode(201, ApiResponse<PriceAlertDto>.Ok(ToDto(alert), "Price alert created."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        var alert = await _alerts.GetByIdAsync(id, ct);
        if (alert is null || alert.UserId != UserId)
            return NotFound(ApiResponse<object>.Fail("Alert not found."));

        alert.IsActive = false;
        await _alerts.UpdateAsync(alert, ct);
        await _uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null!, "Alert removed."));
    }

    private static PriceAlertDto ToDto(PriceAlert a) => new(
        a.Id, a.Origin, a.Destination, a.TravelDate.ToString("yyyy-MM-dd"),
        a.LastSeenPrice, a.Email, a.LastNotifiedAt);
}

public record CreatePriceAlertRequest(
    string  Origin,
    string  Destination,
    DateOnly TravelDate,
    decimal CurrentPrice,
    string? Email = null
);

public record PriceAlertDto(
    Guid      Id,
    string    Origin,
    string    Destination,
    string    TravelDate,
    decimal   LastSeenPrice,
    string    Email,
    DateTime? LastNotifiedAt
);
