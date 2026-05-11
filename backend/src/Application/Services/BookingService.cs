using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookings;
    private readonly IUserRepository _users;
    private readonly IFlightRepository _flights;
    private readonly IInvoiceDocumentService _invoiceDocumentService;
    private readonly IUnitOfWork _uow;

    public BookingService(
        IBookingRepository bookings,
        IUserRepository users,
        IFlightRepository flights,
        IInvoiceDocumentService invoiceDocumentService,
        IUnitOfWork uow)
    {
        _bookings = bookings;
        _users = users;
        _flights = flights;
        _invoiceDocumentService = invoiceDocumentService;
        _uow = uow;
    }

    public async Task<(List<BookingDto> Items, int Total)> GetUserBookingsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var all = await _bookings.GetUserBookingsAsync(userId, ct);
        var total = all.Count;
        var pageItems = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var paged = new List<BookingDto>();
        foreach (var booking in pageItems)
            paged.Add(await ToDtoAsync(booking, ct));
        return (paged, total);
    }

    public async Task<BookingDto> GetByIdAsync(Guid userId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.UserId != userId)
            throw new UnauthorizedException("Access denied.");

        return await ToDtoAsync(booking, ct);
    }

    public async Task<(byte[] Content, string FileName)> GetInvoiceAsync(Guid userId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.UserId != userId)
            throw new UnauthorizedException("Access denied.");

        var dto = await ToDtoAsync(booking, ct);
        return (_invoiceDocumentService.GenerateBookingTicketPdf(dto), $"{booking.BookingRef}-e-ticket.pdf");
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

    private async Task<BookingDto> ToDtoAsync(Booking booking, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(booking.UserId, ct);
        Flight? flight = null;

        if (booking.BookingType == BookingType.Flight)
            flight = await _flights.GetByIdAsync(booking.ReferenceId, ct);

        return new BookingDto(
            booking.Id,
            booking.BookingRef,
            booking.BookingType.ToString(),
            booking.Status,
            booking.TotalAmount,
            booking.FinalAmount,
            booking.DiscountAmount,
            booking.CreatedAt,
            booking.BookingType == BookingType.Flight ? booking.ReferenceId : null,
            booking.BookingType == BookingType.Hotel ? booking.ReferenceId : null,
            booking.Passengers,
            booking.CheckIn?.ToString("yyyy-MM-dd"),
            booking.CheckOut?.ToString("yyyy-MM-dd"),
            booking.CouponCode,
            user?.Name,
            user?.Email,
            user?.Phone,
            flight?.Airline,
            flight?.FlightNumber,
            flight?.Source,
            MapCityName(flight?.Source),
            flight?.Destination,
            MapCityName(flight?.Destination),
            flight?.DepartureTime,
            flight?.ArrivalTime,
            flight?.Duration
        );
    }

    private static string? MapCityName(string? code) => code switch
    {
        "BOM" => "Mumbai",
        "DEL" => "Delhi",
        "BLR" => "Bengaluru",
        "MAA" => "Chennai",
        "HYD" => "Hyderabad",
        "AMD" => "Ahmedabad",
        "GOI" => "Goa",
        "CCU" => "Kolkata",
        "JAI" => "Jaipur",
        "PNQ" => "Pune",
        "COK" => "Kochi",
        "LKO" => "Lucknow",
        _ => code
    };
}
