using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "Hotel")]
[Route("api/v1/hotel-manager")]
public class HotelManagerController : BaseApiController
{
    private readonly IHotelManagerService _service;

    public HotelManagerController(IHotelManagerService service) => _service = service;

    private Guid CurrentHotelId =>
        Guid.Parse(User.FindFirst("hotelId")?.Value
            ?? throw new UnauthorizedAccessException("Hotel ID not found in token."));

    // ── Dashboard ────────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<HotelManagerDashboardDto>>> Dashboard(CancellationToken ct)
    {
        var result = await _service.GetDashboardAsync(CurrentHotelId, ct);
        return Ok(ApiResponse<HotelManagerDashboardDto>.Ok(result));
    }

    // ── Bookings ─────────────────────────────────────────────────────────────

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<List<HotelManagerBookingDto>>>> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? query = null,
        CancellationToken ct = default)
    {
        var (items, total) = await _service.GetBookingsAsync(CurrentHotelId, page, pageSize, status, query, ct);
        return Ok(ApiResponse<List<HotelManagerBookingDto>>.Paged(items, page, pageSize, total));
    }

    [HttpGet("bookings/{bookingId:guid}")]
    public async Task<ActionResult<ApiResponse<HotelBookingDetailDto>>> GetBookingDetail(
        Guid bookingId, CancellationToken ct)
    {
        var result = await _service.GetBookingDetailAsync(CurrentHotelId, bookingId, ct);
        return Ok(ApiResponse<HotelBookingDetailDto>.Ok(result));
    }

    [HttpPost("bookings/{bookingId:guid}/checkin")]
    public async Task<ActionResult<ApiResponse<HotelBookingDetailDto>>> CheckIn(
        Guid bookingId, [FromBody] CheckInRequest req, CancellationToken ct)
    {
        var result = await _service.CheckInGuestAsync(CurrentHotelId, bookingId, req, ct);
        return Ok(ApiResponse<HotelBookingDetailDto>.Ok(result, "Guest checked in successfully."));
    }

    [HttpPost("bookings/{bookingId:guid}/charges")]
    public async Task<ActionResult<ApiResponse<HotelBookingDetailDto>>> AddCharge(
        Guid bookingId, [FromBody] AddHotelChargeRequest req, CancellationToken ct)
    {
        var result = await _service.AddChargeAsync(CurrentHotelId, bookingId, req, ct);
        return Ok(ApiResponse<HotelBookingDetailDto>.Ok(result, "Charge added successfully."));
    }

    [HttpDelete("bookings/{bookingId:guid}/charges/{chargeId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCharge(
        Guid bookingId, Guid chargeId, CancellationToken ct)
    {
        await _service.DeleteChargeAsync(CurrentHotelId, bookingId, chargeId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Charge removed."));
    }

    [HttpGet("bookings/{bookingId:guid}/invoice")]
    public async Task<ActionResult<ApiResponse<HotelInvoiceDto>>> GetInvoice(
        Guid bookingId, CancellationToken ct)
    {
        var result = await _service.GetInvoiceAsync(CurrentHotelId, bookingId, ct);
        return Ok(ApiResponse<HotelInvoiceDto>.Ok(result));
    }

    [HttpPost("bookings/{bookingId:guid}/checkout")]
    public async Task<ActionResult<ApiResponse<HotelInvoiceDto>>> CheckOut(
        Guid bookingId, [FromBody] CheckOutRequest req, CancellationToken ct)
    {
        var result = await _service.CheckOutGuestAsync(CurrentHotelId, bookingId, req, ct);
        return Ok(ApiResponse<HotelInvoiceDto>.Ok(result, "Guest checked out. Invoice generated and email sent."));
    }

    // ── Room Availability ─────────────────────────────────────────────────────

    [HttpGet("availability")]
    public async Task<ActionResult<ApiResponse<List<RoomAvailabilityDto>>>> GetAvailability(
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        CancellationToken ct)
    {
        var result = await _service.GetAvailabilityAsync(CurrentHotelId, checkIn, checkOut, ct);
        return Ok(ApiResponse<List<RoomAvailabilityDto>>.Ok(result));
    }

    // ── Hotel Profile ────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<HotelProfileDto>>> GetProfile(CancellationToken ct)
    {
        var result = await _service.GetHotelProfileAsync(CurrentHotelId, ct);
        return Ok(ApiResponse<HotelProfileDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<HotelProfileDto>>> UpdateProfile(
        [FromBody] UpdateHotelDetailsRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateHotelDetailsAsync(CurrentHotelId, req, ct);
        return Ok(ApiResponse<HotelProfileDto>.Ok(result, "Hotel details updated."));
    }

    // ── Rooms ────────────────────────────────────────────────────────────────

    [HttpPost("rooms")]
    public async Task<ActionResult<ApiResponse<HotelRoomManagerDto>>> AddRoom(
        [FromBody] CreateRoomRequest req, CancellationToken ct)
    {
        var result = await _service.AddRoomAsync(CurrentHotelId, req, ct);
        return CreatedAtAction(nameof(GetProfile), ApiResponse<HotelRoomManagerDto>.Ok(result, "Room added."));
    }

    [HttpPut("rooms/{roomId:guid}")]
    public async Task<ActionResult<ApiResponse<HotelRoomManagerDto>>> UpdateRoom(
        Guid roomId, [FromBody] UpdateRoomRequest req, CancellationToken ct)
    {
        var result = await _service.UpdateRoomAsync(CurrentHotelId, roomId, req, ct);
        return Ok(ApiResponse<HotelRoomManagerDto>.Ok(result, "Room updated."));
    }

    [HttpDelete("rooms/{roomId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRoom(Guid roomId, CancellationToken ct)
    {
        await _service.DeleteRoomAsync(CurrentHotelId, roomId, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Room removed."));
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<ApiResponse<List<HotelRoomManagerDto>>>> GetRooms(CancellationToken ct)
    {
        var profile = await _service.GetHotelProfileAsync(CurrentHotelId, ct);
        return Ok(ApiResponse<List<HotelRoomManagerDto>>.Ok(profile.Rooms));
    }
}
