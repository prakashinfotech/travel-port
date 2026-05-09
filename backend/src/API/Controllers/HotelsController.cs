using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Hotels;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/hotels")]
public class HotelsController : BaseApiController
{
    private readonly IHotelService _hotels;

    public HotelsController(IHotelService hotels) => _hotels = hotels;

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<HotelDto>>>> Search(
        [FromQuery] HotelSearchRequest request, CancellationToken ct)
    {
        var (items, total) = await _hotels.SearchAsync(request, ct);
        return Ok(ApiResponse<List<HotelDto>>.Paged(items, request.Page, request.PageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<HotelDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _hotels.GetByIdAsync(id, ct);
        return Ok(ApiResponse<HotelDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("book")]
    public async Task<ActionResult<ApiResponse<object>>> Book(
        [FromBody] BookHotelRequest request, CancellationToken ct)
    {
        var result = await _hotels.BookAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<object>.Ok(result, "Hotel booked successfully."));
    }
}
