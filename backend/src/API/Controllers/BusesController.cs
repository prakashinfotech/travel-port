using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Infrastructure.ExternalProviders.Transport;

namespace TravelPort.API.Controllers;

[Route("api/v1/buses")]
public class BusesController : BaseApiController
{
    private readonly BusSearchProvider _provider;
    public BusesController(BusSearchProvider provider) => _provider = provider;

    [HttpGet("search")]
    public ActionResult<ApiResponse<List<BusDto>>> Search([FromQuery] BusSearchRequest req)
    {
        var (items, total) = _provider.Search(req);
        return Ok(ApiResponse<List<BusDto>>.Paged(items, req.Page, req.PageSize, total));
    }
}
