using System.Text.Json;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookings;
    private readonly IUserRepository _users;
    private readonly IFlightRepository _flights;
    private readonly IHotelRepository _hotels;
    private readonly IInvoiceDocumentService _invoiceDocumentService;
    private readonly IEmailService _email;
    private readonly IWalletService _wallet;
    private readonly IUnitOfWork _uow;

    public BookingService(
        IBookingRepository bookings,
        IUserRepository users,
        IFlightRepository flights,
        IHotelRepository hotels,
        IInvoiceDocumentService invoiceDocumentService,
        IEmailService email,
        IWalletService wallet,
        IUnitOfWork uow)
    {
        _bookings = bookings;
        _users = users;
        _flights = flights;
        _hotels = hotels;
        _invoiceDocumentService = invoiceDocumentService;
        _email = email;
        _wallet = wallet;
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

        if (booking.BookingType == BookingType.Hotel)
            return (_invoiceDocumentService.GenerateHotelInvoicePdf(dto), $"{booking.BookingRef}-hotel-invoice.pdf");

        if (booking.BookingType is BookingType.Bus or BookingType.Train or BookingType.Cab)
            return (_invoiceDocumentService.GenerateTransportTicketPdf(dto), $"{booking.BookingRef}-ticket.pdf");

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

        // Credit refund to wallet
        if (refund > 0)
        {
            await _wallet.RefundAsync(userId, refund, $"Refund for cancelled booking {booking.BookingRef}", bookingId, ct);
            await _uow.SaveChangesAsync(ct);
        }

        var user = await _users.GetByIdAsync(userId, ct);
        if (user is not null)
        {
            var bookingType = booking.BookingType.ToString();
            var toEmail = !string.IsNullOrWhiteSpace(booking.GuestEmail) ? booking.GuestEmail : user.Email;
            var toName  = !string.IsNullOrWhiteSpace(booking.GuestName)  ? booking.GuestName  : user.Name;
            await _email.SendBookingCancellationAsync(toEmail, toName, booking.BookingRef, bookingType, refund, ct);
        }

        return new CancelBookingResponse(bookingId, refund);
    }

    public async Task SendConfirmationEmailAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct);
        if (booking is null) return;

        var user = await _users.GetByIdAsync(booking.UserId, ct);
        if (user is null) return;

        var toEmail = !string.IsNullOrWhiteSpace(booking.GuestEmail) ? booking.GuestEmail : user.Email;
        var toName  = !string.IsNullOrWhiteSpace(booking.GuestName)  ? booking.GuestName  : user.Name;

        if (booking.BookingType == BookingType.Flight)
        {
            var flight = await _flights.GetByIdAsync(booking.ReferenceId, ct);
            if (flight is null) return;

            var passengers = booking.Passengers ?? 1;
            var unitPrice  = passengers > 0 ? booking.TotalAmount / passengers : booking.TotalAmount;
            var depTime    = flight.DepartureTime.ToString("dd MMM yyyy, hh:mm tt");
            var arrTime    = flight.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt");
            var dur        = $"{flight.Duration / 60}h {flight.Duration % 60}m";

            await _email.SendFlightBookingConfirmationAsync(
                toEmail, toName, booking.BookingRef,
                flight.Airline, flight.FlightNumber,
                flight.Source, MapCityName(flight.Source) ?? flight.Source,
                flight.Destination, MapCityName(flight.Destination) ?? flight.Destination,
                depTime, arrTime, dur,
                "Economy", passengers,
                unitPrice, booking.TotalAmount, booking.DiscountAmount, booking.CouponCode, booking.FinalAmount, ct);
        }
        else if (booking.BookingType == BookingType.Hotel)
        {
            var hotel = await _hotels.GetByIdAsync(booking.ReferenceId, ct);
            if (hotel is null) return;

            var nights = booking.CheckIn.HasValue && booking.CheckOut.HasValue
                ? (booking.CheckOut.Value - booking.CheckIn.Value).Days
                : 1;
            var pricePerNight = nights > 0 ? booking.TotalAmount / nights : booking.TotalAmount;
            var matchedRoom = hotel.Rooms
                .Where(r => r.IsActive)
                .OrderBy(r => Math.Abs(r.PricePerNight - pricePerNight))
                .FirstOrDefault();
            var roomType = matchedRoom?.RoomType ?? "Room";

            await _email.SendHotelBookingConfirmationAsync(
                toEmail, toName, booking.BookingRef,
                hotel.Name, hotel.Address, hotel.City, hotel.StarRating,
                roomType,
                booking.CheckIn?.ToString("dd MMM yyyy") ?? string.Empty,
                booking.CheckOut?.ToString("dd MMM yyyy") ?? string.Empty,
                nights, 1,
                booking.GuestName, booking.GuestPhone,
                pricePerNight, booking.TotalAmount, booking.DiscountAmount, booking.CouponCode, booking.FinalAmount, ct);
        }
        else if (booking.BookingType is BookingType.Bus or BookingType.Train or BookingType.Cab
                 && !string.IsNullOrWhiteSpace(booking.TransportSnapshot))
        {
            var snap = JsonSerializer.Deserialize<TransportSnapshot>(booking.TransportSnapshot);
            if (snap is null) return;

            var passengers = booking.Passengers ?? 1;
            var unitPrice  = passengers > 0 ? booking.TotalAmount / passengers : booking.TotalAmount;
            var dur        = $"{snap.DurationMinutes / 60}h {snap.DurationMinutes % 60}m";

            await _email.SendTransportBookingConfirmationAsync(
                toEmail, toName, booking.BookingRef, booking.BookingType.ToString(),
                snap.OperatorName, snap.VehicleType ?? snap.VehicleClass ?? "—",
                snap.Origin, snap.Destination,
                snap.DepartureTime.ToString("dd MMM yyyy, hh:mm tt"),
                snap.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt"),
                dur, passengers, unitPrice,
                booking.TotalAmount, booking.DiscountAmount, booking.CouponCode, booking.FinalAmount, ct);
        }
    }

    private async Task<BookingDto> ToDtoAsync(Booking booking, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(booking.UserId, ct);
        Flight? flight = null;
        Hotel? hotel = null;

        if (booking.BookingType == BookingType.Flight)
            flight = await _flights.GetByIdAsync(booking.ReferenceId, ct);

        if (booking.BookingType == BookingType.Hotel)
            hotel = await _hotels.GetByIdAsync(booking.ReferenceId, ct);

        // Derive hotel stay details
        int? nights = null;
        decimal? pricePerNight = null;
        string? roomType = null;

        if (hotel is not null && booking.CheckIn.HasValue && booking.CheckOut.HasValue)
        {
            nights = (booking.CheckOut.Value - booking.CheckIn.Value).Days;
            if (nights > 0)
                pricePerNight = booking.TotalAmount / nights.Value;

            var matchedRoom = hotel.Rooms
                .Where(r => r.IsActive)
                .OrderBy(r => Math.Abs(r.PricePerNight - (pricePerNight ?? 0)))
                .FirstOrDefault();
            roomType = matchedRoom?.RoomType;
        }

        // Deserialize transport snapshot for Bus/Train/Cab
        TransportSnapshot? transport = null;
        if (booking.BookingType is BookingType.Bus or BookingType.Train or BookingType.Cab
            && !string.IsNullOrWhiteSpace(booking.TransportSnapshot))
        {
            transport = JsonSerializer.Deserialize<TransportSnapshot>(booking.TransportSnapshot);
        }

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
            booking.GuestName ?? user?.Name,
            booking.GuestEmail ?? user?.Email,
            booking.GuestPhone ?? user?.Phone,
            // Flight fields
            flight?.Airline,
            flight?.FlightNumber,
            flight?.Source ?? transport?.Origin,
            MapCityName(flight?.Source) ?? transport?.Origin,
            flight?.Destination ?? transport?.Destination,
            MapCityName(flight?.Destination) ?? transport?.Destination,
            flight?.DepartureTime ?? transport?.DepartureTime,
            flight?.ArrivalTime ?? transport?.ArrivalTime,
            flight?.Duration ?? transport?.DurationMinutes,
            // Hotel fields
            hotel?.Name,
            hotel?.Address,
            hotel?.City,
            hotel?.StarRating,
            roomType,
            pricePerNight,
            nights,
            // Transport fields
            transport?.OperatorName,
            transport?.VehicleType ?? transport?.VehicleClass,
            transport?.Amenities,
            transport?.DistanceKm
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
