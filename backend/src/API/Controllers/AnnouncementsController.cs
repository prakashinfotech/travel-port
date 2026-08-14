using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/announcements")]
public class AnnouncementsController : BaseApiController
{
    private readonly IAnnouncementService _service;

    public AnnouncementsController(IAnnouncementService service) => _service = service;

    // Public — any user (or guest) can fetch active announcements for the banner
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<AnnouncementDto>>>> GetActive(CancellationToken ct)
    {
        var result = await _service.GetActiveAsync(ct);
        return Ok(ApiResponse<List<AnnouncementDto>>.Ok(result));
    }

    // Admin-only management
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<AnnouncementDto>>>> GetAll(CancellationToken ct)
    {
        var result = await _service.GetAllAsync(ct);
        return Ok(ApiResponse<List<AnnouncementDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<AnnouncementDto>>> Create(
        [FromBody] CreateAnnouncementRequest req, CancellationToken ct)
    {
        var result = await _service.CreateAsync(CurrentUserId, req, ct);
        return StatusCode(201, ApiResponse<AnnouncementDto>.Ok(result, "Announcement created."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<AnnouncementDto>>> Update(
        Guid id, [FromBody] UpdateAnnouncementRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, req, ct);
        return Ok(ApiResponse<AnnouncementDto>.Ok(result, "Announcement updated."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<object?>.Ok(null, "Announcement deleted."));
    }
}
