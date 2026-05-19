using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class BusCompanyRepository : BaseRepository<BusCompany>, IBusCompanyRepository
{
    public BusCompanyRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<BusCompany>> GetAllActiveAsync(CancellationToken ct = default)
        => await _dbSet.OrderBy(c => c.Name).ToListAsync(ct);
}
