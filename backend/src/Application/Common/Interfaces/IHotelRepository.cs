using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IHotelRepository : IRepository<Hotel>
{
    Task<IReadOnlyList<Hotel>> SearchAsync(
        string city,
        DateTime checkIn,
        DateTime checkOut,
        int guests,
        CancellationToken cancellationToken = default);

    Task<Hotel?> GetWithAllRoomsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Hotel>> GetAllWithManagerAsync(CancellationToken cancellationToken = default);
}
