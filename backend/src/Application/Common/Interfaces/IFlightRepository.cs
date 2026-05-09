using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IFlightRepository : IRepository<Flight>
{
    Task<IReadOnlyList<Flight>> SearchAsync(
        string origin,
        string destination,
        DateTime departureDate,
        int passengers,
        CancellationToken cancellationToken = default);
}
