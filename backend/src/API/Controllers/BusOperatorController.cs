using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "BusOperator")]
[Route("api/v1/bus-operator")]
public class BusOperatorController : BaseApiController
{
    private readonly IBusOperatorService _service;

    public BusOperatorController(IBusOperatorService service) => _service = service;

    private Guid CurrentCompanyId =>
        Guid.Parse(User.FindFirst("operatorCompanyId")?.Value
            ?? throw new UnauthorizedAccessException("Operator company ID not found in token."));

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<BusOperatorDashboardDto>>> Dashboard(CancellationToken ct)
    {
        var result = await _service.GetDashboardAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<BusOperatorDashboardDto>.Ok(result));
    }

    // ── Bus CRUD ─────────────────────────────────────────────────────────────

    [HttpGet("buses")]
    public async Task<ActionResult<ApiResponse<List<OperatorBusDto>>>> GetBuses(CancellationToken ct)
    {
        var result = await _service.GetBusesAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<List<OperatorBusDto>>.Ok(result));
    }

    [HttpPost("buses")]
    public async Task<ActionResult<ApiResponse<OperatorBusDto>>> AddBus(
        [FromBody] CreateBusRequest req, CancellationToken ct)
    {
        var result = await _service.AddBusAsync(CurrentCompanyId, req, ct);
        return StatusCode(201, ApiResponse<OperatorBusDto>.Ok(result, "Bus added."));
    }

    [HttpPut("buses/{busId:guid}")]
    public async Task<ActionResult<ApiResponse<OperatorBusDto>>> UpdateBus(
        Guid busId, [FromBody] UpdateBusRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateBusAsync(CurrentCompanyId, busId, req, ct);
        return Ok(ApiResponse<OperatorBusDto>.Ok(result, "Bus updated."));
    }

    [HttpDelete("buses/{busId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBus(Guid busId, CancellationToken ct)
    {
        await _service.DeleteBusAsync(CurrentCompanyId, busId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Bus removed."));
    }

    // ── Bookings ──────────────────────────────────────────────────────────────

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<List<OperatorBookingDto>>>> GetBookings(CancellationToken ct)
    {
        var result = await _service.GetBookingsAsync(CurrentCompanyId, ct);
        return Ok(ApiResponse<List<OperatorBookingDto>>.Ok(result));
    }

    // ── Seat Layout ───────────────────────────────────────────────────────────

    [HttpGet("buses/by-date")]
    public async Task<ActionResult<ApiResponse<List<BusDateRouteDto>>>> GetBusesByDate(
        [FromQuery] DateTime date, CancellationToken ct)
    {
        var result = await _service.GetBusesByDateAsync(CurrentCompanyId, date, ct);
        return Ok(ApiResponse<List<BusDateRouteDto>>.Ok(result));
    }

    [HttpGet("buses/{busId:guid}/seat-layout")]
    public async Task<ActionResult<ApiResponse<BusSeatLayoutDto>>> GetSeatLayout(Guid busId, CancellationToken ct)
    {
        var result = await _service.GetSeatLayoutAsync(CurrentCompanyId, busId, ct);
        return Ok(ApiResponse<BusSeatLayoutDto>.Ok(result));
    }

    [HttpPut("buses/{busId:guid}/seat-layout")]
    public async Task<ActionResult<ApiResponse<OperatorBusDto>>> UpdateSeatLayout(
        Guid busId, [FromBody] BusSeatLayoutConfigRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateSeatLayoutAsync(CurrentCompanyId, busId, req, ct);
        return Ok(ApiResponse<OperatorBusDto>.Ok(result, "Seat layout updated."));
    }

    [HttpPost("buses/{busId:guid}/bulk-book")]
    public async Task<ActionResult<ApiResponse<OperatorBookingDto>>> BulkBookSeats(
        Guid busId, [FromBody] BusBulkSeatBookingRequest req, CancellationToken ct)
    {
        var result = await _service.BulkBookSeatsAsync(CurrentCompanyId, busId, CurrentUserId, req, ct);
        return StatusCode(201, ApiResponse<OperatorBookingDto>.Ok(result, "Seats booked successfully."));
    }

    [HttpDelete("bookings/{bookingId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> CancelBooking(Guid bookingId, CancellationToken ct)
    {
        await _service.CancelSeatBookingAsync(CurrentCompanyId, bookingId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Booking cancelled and refund issued."));
    }
}
