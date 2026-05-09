using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Users;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminController : BaseApiController
{
    private readonly IBookingService _bookings;
    private readonly IUserService _users;

    public AdminController(IBookingService bookings, IUserService users)
    {
        _bookings = bookings;
        _users = users;
    }

    [HttpGet("bookings")]
    public ActionResult<ApiResponse<List<BookingDto>>> GetAllBookings(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(ApiResponse<List<BookingDto>>.Ok(new List<BookingDto>(), "Admin bookings endpoint — full query added in Phase 4."));
    }

    [HttpGet("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetUser(Guid id, CancellationToken ct)
    {
        var result = await _users.GetProfileAsync(id, ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<object>> Dashboard()
    {
        var stats = new
        {
            Message = "Dashboard data will be populated from vw_AdminDashboard in Phase 4."
        };
        return Ok(ApiResponse<object>.Ok(stats));
    }
}
