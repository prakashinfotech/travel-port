using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Infrastructure.ExternalProviders.Transport;

namespace TravelPort.API.Controllers;

[Route("api/v1/cabs")]
public class CabsController : BaseApiController
{
    private readonly CabSearchProvider _provider;
    public CabsController(CabSearchProvider provider) => _provider = provider;

    [HttpGet("search")]
    public ActionResult<ApiResponse<List<CabDto>>> Search([FromQuery] CabSearchRequest req)
    {
        var (items, total) = _provider.Search(req);
        return Ok(ApiResponse<List<CabDto>>.Paged(items, req.Page, req.PageSize, total));
    }
}
