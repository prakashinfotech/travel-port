using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Common.Interfaces;

public interface IBusSearchProvider
{
    (List<BusDto> Items, int Total) Search(BusSearchRequest request);
}
