using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminController : BaseApiController
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> Dashboard(CancellationToken ct)
    {
        var result = await _admin.GetDashboardAsync(ct);
        return Ok(ApiResponse<AdminDashboardDto>.Ok(result));
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<ApiResponse<AdminAnalyticsDto>>> Analytics(CancellationToken ct)
    {
        var result = await _admin.GetAnalyticsAsync(ct);
        return Ok(ApiResponse<AdminAnalyticsDto>.Ok(result));
    }

    // ── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<AdminUserDto>>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var (items, total) = await _admin.GetUsersAsync(page, pageSize, search, ct);
        return Ok(ApiResponse<List<AdminUserDto>>.Paged(items, page, pageSize, total));
    }

    [HttpPost("users/{id:guid}/block")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> ToggleBlock(Guid id, CancellationToken ct)
    {
        var result = await _admin.ToggleUserBlockAsync(id, ct);
        return Ok(ApiResponse<AdminUserDto>.Ok(result,
            result.IsActive ? "User unblocked." : "User blocked."));
    }

    // ── Bookings ─────────────────────────────────────────────────────────────

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<List<BookingDto>>>> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        CancellationToken ct = default)
    {
        var (items, total) = await _admin.GetBookingsAsync(page, pageSize, status, type, ct);
        return Ok(ApiResponse<List<BookingDto>>.Paged(items, page, pageSize, total));
    }

    // ── Coupons ──────────────────────────────────────────────────────────────

    [HttpGet("coupons")]
    public async Task<ActionResult<ApiResponse<List<CouponDto>>>> GetCoupons(CancellationToken ct)
    {
        var result = await _admin.GetCouponsAsync(ct);
        return Ok(ApiResponse<List<CouponDto>>.Ok(result));
    }

    [HttpPost("coupons")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> CreateCoupon(
        [FromBody] CreateCouponRequest req, CancellationToken ct)
    {
        var result = await _admin.CreateCouponAsync(req, ct);
        return StatusCode(201, ApiResponse<CouponDto>.Ok(result, "Coupon created."));
    }

    [HttpPut("coupons/{id:guid}")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> UpdateCoupon(
        Guid id, [FromBody] UpdateCouponRequest req, CancellationToken ct)
    {
        var result = await _admin.UpdateCouponAsync(id, req, ct);
        return Ok(ApiResponse<CouponDto>.Ok(result, "Coupon updated."));
    }

    [HttpDelete("coupons/{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCoupon(Guid id, CancellationToken ct)
    {
        await _admin.DeleteCouponAsync(id, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Coupon deactivated."));
    }

    // ── Hotels ───────────────────────────────────────────────────────────────

    [HttpGet("hotels")]
    public async Task<ActionResult<ApiResponse<List<AdminHotelListDto>>>> GetHotels(CancellationToken ct)
    {
        var result = await _admin.GetHotelsAsync(ct);
        return Ok(ApiResponse<List<AdminHotelListDto>>.Ok(result));
    }

    [HttpPost("hotels")]
    public async Task<ActionResult<ApiResponse<AdminHotelListDto>>> RegisterHotel(
        [FromBody] RegisterHotelRequest req, CancellationToken ct)
    {
        var result = await _admin.RegisterHotelAsync(req, ct);
        return StatusCode(201, ApiResponse<AdminHotelListDto>.Ok(result, "Hotel registered and credentials emailed."));
    }

    [HttpPost("hotels/{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<AdminHotelListDto>>> ToggleHotelActive(Guid id, CancellationToken ct)
    {
        var result = await _admin.ToggleHotelActiveAsync(id, ct);
        return Ok(ApiResponse<AdminHotelListDto>.Ok(result,
            result.IsActive ? "Hotel activated." : "Hotel deactivated."));
    }

    // ── Flight Operators ──────────────────────────────────────────────────────

    [HttpGet("flight-operators")]
    public async Task<ActionResult<ApiResponse<List<FlightOperatorListDto>>>> GetFlightOperators(CancellationToken ct)
    {
        var result = await _admin.GetFlightOperatorsAsync(ct);
        return Ok(ApiResponse<List<FlightOperatorListDto>>.Ok(result));
    }

    [HttpPost("flight-operators")]
    public async Task<ActionResult<ApiResponse<FlightOperatorListDto>>> RegisterFlightOperator(
        [FromBody] RegisterFlightOperatorRequest req, CancellationToken ct)
    {
        var result = await _admin.RegisterFlightOperatorAsync(req, ct);
        return StatusCode(201, ApiResponse<FlightOperatorListDto>.Ok(result, "Flight operator registered and credentials emailed."));
    }

    [HttpPost("flight-operators/{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<FlightOperatorListDto>>> ToggleFlightOperator(Guid id, CancellationToken ct)
    {
        var result = await _admin.ToggleFlightOperatorActiveAsync(id, ct);
        return Ok(ApiResponse<FlightOperatorListDto>.Ok(result, result.IsActive ? "Operator activated." : "Operator deactivated."));
    }

    // ── Bus Operators ─────────────────────────────────────────────────────────

    [HttpGet("bus-operators")]
    public async Task<ActionResult<ApiResponse<List<BusOperatorListDto>>>> GetBusOperators(CancellationToken ct)
    {
        var result = await _admin.GetBusOperatorsAsync(ct);
        return Ok(ApiResponse<List<BusOperatorListDto>>.Ok(result));
    }

    [HttpPost("bus-operators")]
    public async Task<ActionResult<ApiResponse<BusOperatorListDto>>> RegisterBusOperator(
        [FromBody] RegisterBusOperatorRequest req, CancellationToken ct)
    {
        var result = await _admin.RegisterBusOperatorAsync(req, ct);
        return StatusCode(201, ApiResponse<BusOperatorListDto>.Ok(result, "Bus operator registered and credentials emailed."));
    }

    [HttpPost("bus-operators/{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<BusOperatorListDto>>> ToggleBusOperator(Guid id, CancellationToken ct)
    {
        var result = await _admin.ToggleBusOperatorActiveAsync(id, ct);
        return Ok(ApiResponse<BusOperatorListDto>.Ok(result, result.IsActive ? "Operator activated." : "Operator deactivated."));
    }

    // ── Cab Operators ─────────────────────────────────────────────────────────

    [HttpGet("cab-operators")]
    public async Task<ActionResult<ApiResponse<List<CabOperatorListDto>>>> GetCabOperators(CancellationToken ct)
    {
        var result = await _admin.GetCabOperatorsAsync(ct);
        return Ok(ApiResponse<List<CabOperatorListDto>>.Ok(result));
    }

    [HttpPost("cab-operators")]
    public async Task<ActionResult<ApiResponse<CabOperatorListDto>>> RegisterCabOperator(
        [FromBody] RegisterCabOperatorRequest req, CancellationToken ct)
    {
        var result = await _admin.RegisterCabOperatorAsync(req, ct);
        return StatusCode(201, ApiResponse<CabOperatorListDto>.Ok(result, "Cab operator registered and credentials emailed."));
    }

    [HttpPost("cab-operators/{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<CabOperatorListDto>>> ToggleCabOperator(Guid id, CancellationToken ct)
    {
        var result = await _admin.ToggleCabOperatorActiveAsync(id, ct);
        return Ok(ApiResponse<CabOperatorListDto>.Ok(result, result.IsActive ? "Operator activated." : "Operator deactivated."));
    }
}
