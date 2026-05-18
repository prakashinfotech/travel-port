using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Common.Interfaces;

public interface ICabSearchProvider
{
    (List<CabDto> Items, int Total) Search(CabSearchRequest request);
}
