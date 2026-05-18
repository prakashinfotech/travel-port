using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/trains")]
public class TrainsController : BaseApiController
{
    private readonly ITrainService _trains;

    public TrainsController(ITrainService trains) => _trains = trains;

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<TrainDto>>>> Search(
        [FromQuery] TrainSearchRequest req, CancellationToken ct)
    {
        var (items, total) = await _trains.SearchAsync(req, ct);
        return Ok(ApiResponse<List<TrainDto>>.Paged(items, req.Page, req.PageSize, total));
    }

    [Authorize]
    [HttpPost("book")]
    public async Task<ActionResult<ApiResponse<object>>> Book(
        [FromBody] BookTrainRequest request, CancellationToken ct)
    {
        var result = await _trains.BookAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<object>.Ok(result, "Train booked successfully."));
    }
}
