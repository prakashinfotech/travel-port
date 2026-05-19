using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/buses")]
public class BusesController : BaseApiController
{
    private readonly IBusService _buses;

    public BusesController(IBusService buses) => _buses = buses;

    [HttpGet("search")]
    public ActionResult<ApiResponse<List<BusDto>>> Search([FromQuery] BusSearchRequest req)
    {
        var (items, total) = _buses.Search(req);
        return Ok(ApiResponse<List<BusDto>>.Paged(items, req.Page, req.PageSize, total));
    }

    [Authorize]
    [HttpPost("book")]
    public async Task<ActionResult<ApiResponse<object>>> Book(
        [FromBody] BookBusRequest request, CancellationToken ct)
    {
        var result = await _buses.BookAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<object>.Ok(result, "Bus booked successfully."));
    }

    [Authorize]
    [HttpPost("{busId}/seats/lock")]
    public async Task<ActionResult<ApiResponse<object>>> LockSeats(
        string busId, [FromBody] SeatLockRequest request, CancellationToken ct)
    {
        await _buses.LockSeatsAsync(busId, CurrentUserId, request.SeatNumbers, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Seats locked."));
    }

    [Authorize]
    [HttpDelete("{busId}/seats/lock")]
    public async Task<ActionResult<ApiResponse<object>>> UnlockSeats(
        string busId, [FromBody] SeatLockRequest request, CancellationToken ct)
    {
        await _buses.UnlockSeatsAsync(busId, CurrentUserId, request.SeatNumbers, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Seats unlocked."));
    }

    [Authorize]
    [HttpGet("{busId}/seats/locked")]
    public async Task<ActionResult<ApiResponse<string[]>>> GetLockedSeats(
        string busId, CancellationToken ct)
    {
        var seats = await _buses.GetLockedSeatsAsync(busId, CurrentUserId, ct);
        return Ok(ApiResponse<string[]>.Ok(seats));
    }
}
