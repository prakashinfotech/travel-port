using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IBusRepository : IRepository<Bus>
{
    Task<IReadOnlyList<Bus>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default);
    Task<Bus?> GetByIdWithCompanyAsync(Guid id, CancellationToken ct = default);
}
