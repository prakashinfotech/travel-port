using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class HotelRepository : BaseRepository<Hotel>, IHotelRepository
{
    public HotelRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Hotel>> SearchAsync(
        string city,
        DateTime checkIn,
        DateTime checkOut,
        int guests,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(h => h.Rooms)
            .Where(h => h.City == city
                     && h.IsActive
                     && h.Rooms.Any(r => r.MaxGuests >= guests && r.IsActive))
            .OrderBy(h => h.StarRating)
            .ToListAsync(cancellationToken);
    }
}
