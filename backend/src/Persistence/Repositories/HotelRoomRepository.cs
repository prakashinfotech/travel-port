using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class HotelRoomRepository : BaseRepository<HotelRoom>, IHotelRoomRepository
{
    public HotelRoomRepository(TravelPortDbContext context) : base(context) { }

    public async Task<HotelRoom?> GetByIdForHotelAsync(Guid roomId, Guid hotelId, CancellationToken cancellationToken = default)
        => await _dbSet.FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId, cancellationToken);
}
