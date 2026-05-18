using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Services.Interfaces;

public interface ITrainService
{
    Task<(List<TrainDto> Items, int Total)> SearchAsync(TrainSearchRequest request, CancellationToken ct = default);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookTrainRequest request, CancellationToken ct = default);
}
