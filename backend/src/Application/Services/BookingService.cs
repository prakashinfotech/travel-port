using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookings;
    private readonly IUnitOfWork _uow;

    public BookingService(IBookingRepository bookings, IUnitOfWork uow)
    {
        _bookings = bookings;
        _uow = uow;
    }

    public async Task<(List<BookingDto> Items, int Total)> GetUserBookingsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var all = await _bookings.GetUserBookingsAsync(userId, ct);
        var total = all.Count;
        var paged = all.Skip((page - 1) * pageSize).Take(pageSize).Select(ToDto).ToList();
        return (paged, total);
    }

    public async Task<BookingDto> GetByIdAsync(Guid userId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.UserId != userId)
            throw new UnauthorizedException("Access denied.");

        return ToDto(booking);
    }

    public async Task<CancelBookingResponse> CancelAsync(Guid userId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.UserId != userId)
            throw new UnauthorizedException("Access denied.");

        if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
            throw new BusinessException("Only Pending or Confirmed bookings can be cancelled.");

        var refund = booking.FinalAmount * 0.90m;
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.RefundAmount = refund;

        await _bookings.UpdateAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        return new CancelBookingResponse(bookingId, refund);
    }

    private static BookingDto ToDto(Domain.Entities.Booking b) => new(
        b.Id,
        b.BookingRef,
        b.BookingType.ToString(),
        b.Status,
        b.TotalAmount,
        b.DiscountAmount,
        b.CreatedAt,
        b.BookingType == BookingType.Flight ? b.ReferenceId : null,
        b.BookingType == BookingType.Hotel  ? b.ReferenceId : null,
        b.Passengers,
        b.CheckIn?.ToString("yyyy-MM-dd"),
        b.CheckOut?.ToString("yyyy-MM-dd"),
        b.CouponCode);
}
