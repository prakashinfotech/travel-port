using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface ICabCompanyRepository : IRepository<CabCompany>
{
    Task<IReadOnlyList<CabCompany>> GetAllActiveAsync(CancellationToken ct = default);
}
