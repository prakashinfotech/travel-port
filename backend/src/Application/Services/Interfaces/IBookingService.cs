using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Application.Services.Interfaces;

public interface IBookingService
{
    Task<(List<BookingDto> Items, int Total)> GetUserBookingsAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task<BookingDto> GetByIdAsync(Guid userId, Guid bookingId, CancellationToken ct = default);
    Task<CancelBookingResponse> CancelAsync(Guid userId, Guid bookingId, CancellationToken ct = default);
}
