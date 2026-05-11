using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Application.Common.Interfaces;

public interface IExternalFlightProvider
{
    bool IsConfigured { get; }
    Task<List<FlightDto>> SearchAsync(FlightSearchRequest request, CancellationToken ct = default);
}
