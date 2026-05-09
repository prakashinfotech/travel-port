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
}
