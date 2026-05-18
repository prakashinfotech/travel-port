using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Services.Interfaces;

public interface IBusService
{
    (List<BusDto> Items, int Total) Search(BusSearchRequest request);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookBusRequest request, CancellationToken ct = default);
}
