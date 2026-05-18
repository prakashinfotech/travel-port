using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Services.Interfaces;

public interface ITrainService
{
    (List<TrainDto> Items, int Total) Search(TrainSearchRequest request);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookTrainRequest request, CancellationToken ct = default);
}
