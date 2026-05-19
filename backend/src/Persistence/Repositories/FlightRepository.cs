using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class FlightRepository : BaseRepository<Flight>, IFlightRepository
{
    public FlightRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Flight>> SearchAsync(
        string origin,
        string destination,
        DateTime departureDate,
        int passengers,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.Source == origin
                     && f.Destination == destination
                     && f.DepartureTime.Date == departureDate.Date
                     && f.AvailableSeats >= passengers
                     && f.IsActive)
            .OrderBy(f => f.EconomyPrice)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Flight>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default)
        => await _dbSet.Where(f => f.FlightCompanyId == companyId).ToListAsync(ct);

    public new async Task<IReadOnlyList<Flight>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);
}
