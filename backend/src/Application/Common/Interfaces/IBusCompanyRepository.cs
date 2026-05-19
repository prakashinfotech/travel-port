using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IBusCompanyRepository : IRepository<BusCompany>
{
    Task<IReadOnlyList<BusCompany>> GetAllActiveAsync(CancellationToken ct = default);
}
