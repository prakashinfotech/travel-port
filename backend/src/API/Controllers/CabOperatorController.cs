using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "CabOperator")]
[Route("api/v1/cab-operator")]
public class CabOperatorController : BaseApiController
{
    private readonly ICabOperatorService _service;

    public CabOperatorController(ICabOperatorService service) => _service = service;

    private Guid CurrentCompanyId =>
        Guid.Parse(User.FindFirst("operatorCompanyId")?.Value
            ?? throw new UnauthorizedAccessException("Operator company ID not found in token."));

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<CabOperatorDashboardDto>>> Dashboard(CancellationToken ct)
    {
        var result = await _service.GetDashboardAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<CabOperatorDashboardDto>.Ok(result));
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<List<OperatorBookingDto>>>> GetBookings(CancellationToken ct)
    {
        var result = await _service.GetBookingsAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<List<OperatorBookingDto>>.Ok(result));
    }
}
