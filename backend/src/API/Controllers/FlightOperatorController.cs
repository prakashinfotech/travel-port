using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "FlightOperator")]
[Route("api/v1/flight-operator")]
public class FlightOperatorController : BaseApiController
{
    private readonly IFlightOperatorService _service;

    public FlightOperatorController(IFlightOperatorService service) => _service = service;

    private Guid CurrentCompanyId =>
        Guid.Parse(User.FindFirst("operatorCompanyId")?.Value
            ?? throw new UnauthorizedAccessException("Operator company ID not found in token."));

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<FlightOperatorDashboardDto>>> Dashboard(CancellationToken ct)
    {
        var result = await _service.GetDashboardAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<FlightOperatorDashboardDto>.Ok(result));
    }

    [HttpGet("flights")]
    public async Task<ActionResult<ApiResponse<List<OperatorFlightDto>>>> GetFlights(CancellationToken ct)
    {
        var result = await _service.GetFlightsAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<List<OperatorFlightDto>>.Ok(result));
    }

    [HttpPost("flights")]
    public async Task<ActionResult<ApiResponse<OperatorFlightDto>>> AddFlight(
        [FromBody] CreateFlightRequest req, CancellationToken ct)
    {
        var result = await _service.AddFlightAsync(CurrentCompanyId, req, ct);
        return StatusCode(201, ApiResponse<OperatorFlightDto>.Ok(result, "Flight added."));
    }

    [HttpPut("flights/{flightId:guid}")]
    public async Task<ActionResult<ApiResponse<OperatorFlightDto>>> UpdateFlight(
        Guid flightId, [FromBody] UpdateFlightRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateFlightAsync(CurrentCompanyId, flightId, req, ct);
        return Ok(ApiResponse<OperatorFlightDto>.Ok(result, "Flight updated."));
    }

    [HttpDelete("flights/{flightId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteFlight(Guid flightId, CancellationToken ct)
    {
        await _service.DeleteFlightAsync(CurrentCompanyId, flightId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Flight removed."));
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<List<OperatorBookingDto>>>> GetBookings(CancellationToken ct)
    {
        var result = await _service.GetBookingsAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<List<OperatorBookingDto>>.Ok(result));
    }
}
