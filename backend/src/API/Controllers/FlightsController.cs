using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Flights;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/flights")]
public class FlightsController : BaseApiController
{
    private readonly IFlightService _flights;

    public FlightsController(IFlightService flights) => _flights = flights;

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<FlightDto>>>> Search(
        [FromQuery] FlightSearchRequest request, CancellationToken ct)
    {
        var (items, total) = await _flights.SearchAsync(request, ct);
        return Ok(ApiResponse<List<FlightDto>>.Paged(items, request.Page, request.PageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<FlightDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _flights.GetByIdAsync(id, ct);
        return Ok(ApiResponse<FlightDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("book")]
    public async Task<ActionResult<ApiResponse<object>>> Book(
        [FromBody] BookFlightRequest request, CancellationToken ct)
    {
        var result = await _flights.BookAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<object>.Ok(result, "Flight booked successfully."));
    }
}
