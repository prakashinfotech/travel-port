using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Common.Interfaces;

public interface IBookingRepository : IRepository<Booking>
{
    Task<IReadOnlyList<Booking>> GetUserBookingsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Booking?> GetByRefAsync(string bookingRef, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Booking>> GetByStatusAsync(BookingStatus status, CancellationToken cancellationToken = default);
    Task<string> GenerateBookingRefAsync(string prefix = "TP", CancellationToken cancellationToken = default);
}
