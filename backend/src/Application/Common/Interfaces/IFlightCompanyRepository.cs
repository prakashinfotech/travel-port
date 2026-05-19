using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IFlightCompanyRepository : IRepository<FlightCompany>
{
    Task<IReadOnlyList<FlightCompany>> GetAllActiveAsync(CancellationToken ct = default);
}
