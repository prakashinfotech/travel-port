using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize]
[Route("api/v1/bookings")]
public class BookingsController : BaseApiController
{
    private readonly IBookingService _bookings;

    public BookingsController(IBookingService bookings) => _bookings = bookings;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<BookingDto>>>> GetMyBookings(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var (items, total) = await _bookings.GetUserBookingsAsync(CurrentUserId, page, pageSize, ct);
        return Ok(ApiResponse<List<BookingDto>>.Paged(items, page, pageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _bookings.GetByIdAsync(CurrentUserId, id, ct);
        return Ok(ApiResponse<BookingDto>.Ok(result));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<CancelBookingResponse>>> Cancel(Guid id, CancellationToken ct)
    {
        var result = await _bookings.CancelAsync(CurrentUserId, id, ct);
        return Ok(ApiResponse<CancelBookingResponse>.Ok(result, "Booking cancelled successfully."));
    }
}
