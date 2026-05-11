using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Infrastructure.ExternalProviders.Transport;

namespace TravelPort.API.Controllers;

[Route("api/v1/trains")]
public class TrainsController : BaseApiController
{
    private readonly TrainSearchProvider _provider;
    public TrainsController(TrainSearchProvider provider) => _provider = provider;

    [HttpGet("search")]
    public ActionResult<ApiResponse<List<TrainDto>>> Search([FromQuery] TrainSearchRequest req)
    {
        var (items, total) = _provider.Search(req);
        return Ok(ApiResponse<List<TrainDto>>.Paged(items, req.Page, req.PageSize, total));
    }
}
