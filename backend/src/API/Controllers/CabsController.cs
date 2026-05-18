using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.API.Controllers;

[Route("api/v1/cabs")]
public class CabsController : BaseApiController
{
    private readonly ICabService _cabs;

    public CabsController(ICabService cabs) => _cabs = cabs;

    [HttpGet("search")]
    public ActionResult<ApiResponse<List<CabDto>>> Search([FromQuery] CabSearchRequest req)
    {
        var (items, total) = _cabs.Search(req);
        return Ok(ApiResponse<List<CabDto>>.Paged(items, req.Page, req.PageSize, total));
    }

    [Authorize]
    [HttpPost("book")]
    public async Task<ActionResult<ApiResponse<object>>> Book(
        [FromBody] BookCabRequest request, CancellationToken ct)
    {
        var result = await _cabs.BookAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<object>.Ok(result, "Cab booked successfully."));
    }
}
