using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Common.Interfaces;

public interface IBookingRepository : IRepository<Booking>
{
    Task<IReadOnlyList<Booking>> GetUserBookingsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Booking?> GetByRefAsync(string bookingRef, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Booking>> GetByStatusAsync(BookingStatus status, CancellationToken cancellationToken = default);
    Task<string> GenerateBookingRefAsync(string prefix = "TP", CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Booking> Items, int Total)> GetAllPagedAsync(int page, int pageSize, string? status = null, string? type = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Booking>> GetAllForAnalyticsAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Booking> Items, int Total)> GetHotelBookingsPagedAsync(Guid hotelId, int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Booking>> GetTrainBookingsForDateAsync(DateTime travelDate, CancellationToken cancellationToken = default);
}
