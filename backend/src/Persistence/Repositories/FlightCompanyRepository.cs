using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class FlightCompanyRepository : BaseRepository<FlightCompany>, IFlightCompanyRepository
{
    public FlightCompanyRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<FlightCompany>> GetAllActiveAsync(CancellationToken ct = default)
        => await _dbSet.OrderBy(c => c.Name).ToListAsync(ct);
}
