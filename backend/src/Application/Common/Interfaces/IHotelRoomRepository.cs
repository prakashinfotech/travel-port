using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IHotelRoomRepository : IRepository<HotelRoom>
{
    Task<HotelRoom?> GetByIdForHotelAsync(Guid roomId, Guid hotelId, CancellationToken cancellationToken = default);
}
