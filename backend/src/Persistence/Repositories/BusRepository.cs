using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class BusRepository : BaseRepository<Bus>, IBusRepository
{
    public BusRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Bus>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default)
        => await _dbSet
            .Where(b => b.BusCompanyId == companyId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

    public async Task<Bus?> GetByIdWithCompanyAsync(Guid id, CancellationToken ct = default)
        => await _dbSet
            .Include(b => b.BusCompany)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
}
