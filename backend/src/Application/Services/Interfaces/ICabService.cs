using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Services.Interfaces;

public interface ICabService
{
    (List<CabDto> Items, int Total) Search(CabSearchRequest request);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookCabRequest request, CancellationToken ct = default);
}
