using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Application.Services.Interfaces;

public interface IFlightService
{
    Task<(List<FlightDto> Items, int Total)> SearchAsync(FlightSearchRequest request, CancellationToken ct = default);
    Task<FlightDto> GetByIdAsync(Guid flightId, CancellationToken ct = default);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookFlightRequest request, CancellationToken ct = default);
}
