using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class HotelManagerService : IHotelManagerService
{
    private readonly IHotelRepository _hotels;
    private readonly IHotelRoomRepository _rooms;
    private readonly IBookingRepository _bookings;
    private readonly IRepository<HotelBookingCharge> _charges;
    private readonly IEmailService _email;
    private readonly IUnitOfWork _uow;
    private readonly string _frontendUrl;

    public HotelManagerService(
        IHotelRepository hotels,
        IHotelRoomRepository rooms,
        IBookingRepository bookings,
        IRepository<HotelBookingCharge> charges,
        IEmailService email,
        IUnitOfWork uow,
        IOptions<AppSettings> appSettings)
    {
        _hotels      = hotels;
        _rooms       = rooms;
        _bookings    = bookings;
        _charges     = charges;
        _email       = email;
        _uow         = uow;
        _frontendUrl = appSettings.Value.FrontendUrl;
    }

    public async Task<HotelManagerDashboardDto> GetDashboardAsync(Guid hotelId, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        var allBookings = await _bookings.FindAsync(
            b => b.BookingType == BookingType.Hotel && b.ReferenceId == hotelId, ct);

        var revenue     = allBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var active      = allBookings.Count(b => b.Status is BookingStatus.Confirmed or BookingStatus.Pending);
        var cancelled   = allBookings.Count(b => b.Status == BookingStatus.Cancelled);
        var totalRooms  = hotel.Rooms.Count;
        var activeRooms = hotel.Rooms.Count(r => r.IsActive);

        return new HotelManagerDashboardDto(
            allBookings.Count,
            active,
            cancelled,
            revenue,
            totalRooms,
            activeRooms,
            hotel.ReviewScore,
            hotel.ReviewCount
        );
    }

    public async Task<(List<HotelManagerBookingDto> Items, int Total)> GetBookingsAsync(
        Guid hotelId, int page, int pageSize, string? status, string? query, CancellationToken ct = default)
    {
        var (items, total) = await _bookings.GetHotelBookingsPagedAsync(hotelId, page, pageSize, status, query, ct);
        var dtos = items.Select(ToBookingDto).ToList();
        return (dtos, total);
    }

    public async Task<HotelBookingDetailDto> GetBookingDetailAsync(Guid hotelId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);
        return ToDetailDto(booking);
    }

    public async Task<HotelBookingDetailDto> CheckInGuestAsync(Guid hotelId, Guid bookingId, CheckInRequest req, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.Status == BookingStatus.CheckedIn)
            throw new BusinessException("Guest is already checked in.");
        if (booking.Status == BookingStatus.CheckedOut || booking.Status == BookingStatus.Cancelled)
            throw new BusinessException($"Cannot check in a booking with status '{booking.Status}'.");

        booking.RoomNumber   = req.RoomNumber;
        booking.CheckInTime  = DateTime.UtcNow;
        booking.CheckInNotes = req.Notes;
        booking.Status       = BookingStatus.CheckedIn;

        await _bookings.UpdateAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);
        return ToDetailDto(booking);
    }

    public async Task<HotelBookingDetailDto> AddChargeAsync(Guid hotelId, Guid bookingId, AddHotelChargeRequest req, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.Status is not (BookingStatus.CheckedIn or BookingStatus.Confirmed or BookingStatus.Pending))
            throw new BusinessException("Additional charges can only be added to active bookings.");

        var charge = new HotelBookingCharge
        {
            Id        = Guid.NewGuid(),
            BookingId = bookingId,
            ItemName  = req.ItemName,
            Category  = req.Category,
            Quantity  = req.Quantity,
            Price     = req.Price,
            Tax       = req.Tax,
            Notes     = req.Notes,
        };

        await _charges.AddAsync(charge, ct);
        await _uow.SaveChangesAsync(ct);

        booking.HotelCharges.Add(charge);
        return ToDetailDto(booking);
    }

    public async Task DeleteChargeAsync(Guid hotelId, Guid bookingId, Guid chargeId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        var charge = booking.HotelCharges.FirstOrDefault(c => c.Id == chargeId)
            ?? throw new NotFoundException("Charge", chargeId);

        await _charges.DeleteAsync(charge, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<HotelInvoiceDto> GetInvoiceAsync(Guid hotelId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        return BuildInvoice(booking, hotel);
    }

    public async Task<HotelInvoiceDto> CheckOutGuestAsync(Guid hotelId, Guid bookingId, CheckOutRequest req, CancellationToken ct = default)
    {
        var booking = await _bookings.GetHotelBookingWithChargesAsync(bookingId, hotelId, ct)
            ?? throw new NotFoundException("Booking", bookingId);
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        if (booking.Status == BookingStatus.CheckedOut)
            throw new BusinessException("Guest has already checked out.");
        if (booking.Status == BookingStatus.Cancelled)
            throw new BusinessException("Cannot check out a cancelled booking.");

        booking.ActualCheckOutTime = DateTime.UtcNow;
        booking.PaymentMethod      = req.PaymentMethod;
        booking.Status             = BookingStatus.CheckedOut;

        await _bookings.UpdateAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        var invoice = BuildInvoice(booking, hotel);

        // Send checkout email
        if (_email.IsConfigured && !string.IsNullOrWhiteSpace(booking.GuestEmail))
        {
            var summaryRows = invoice.Charges.Select((c, i) =>
                $"""
                 <tr style="background-color:{(i % 2 == 0 ? "#ffffff" : "#f9fafb")}">
                   <td style="padding:8px 14px;font-size:13px;color:#374151">{System.Net.WebUtility.HtmlEncode(c.ItemName)} ({System.Net.WebUtility.HtmlEncode(c.Category)}) × {c.Quantity}</td>
                   <td style="padding:8px 14px;font-size:13px;color:#111827;text-align:right;font-weight:600">₹{(c.Price * c.Quantity + c.Tax * c.Quantity):N0}</td>
                 </tr>
                 """).ToList();

            var ratingLink = $"{_frontendUrl}/hotels/{hotelId}/review?booking={bookingId}";

            await _email.SendHotelCheckoutEmailAsync(
                booking.GuestEmail,
                booking.GuestName ?? booking.GuestEmail,
                booking.BookingRef,
                hotel.Name, hotel.City, hotel.Address, hotel.StarRating,
                invoice.RoomType, invoice.RoomNumber,
                invoice.CheckIn.ToString("dd MMM yyyy"), invoice.CheckOut.ToString("dd MMM yyyy"),
                invoice.Nights, invoice.Guests,
                invoice.RoomTotal, invoice.ChargesSubTotal + invoice.ChargesTax, invoice.GrandTotal,
                invoice.AlreadyPaid, invoice.AmountDue, req.PaymentMethod,
                ratingLink,
                string.Concat(summaryRows),
                ct
            );
        }

        return invoice;
    }

    public async Task<List<RoomAvailabilityDto>> GetAvailabilityAsync(Guid hotelId, DateTime checkIn, DateTime checkOut, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        var overlappingBookings = await _bookings.FindAsync(b =>
            b.BookingType == BookingType.Hotel &&
            b.ReferenceId == hotelId &&
            b.Status != BookingStatus.Cancelled &&
            b.CheckIn < checkOut &&
            b.CheckOut > checkIn, ct);

        return hotel.Rooms
            .Where(r => r.IsActive)
            .Select(r =>
            {
                var booked = overlappingBookings.Count(b => b.RoomId == r.Id);
                var available = Math.Max(0, r.TotalRooms - booked);
                return new RoomAvailabilityDto(r.Id, r.RoomType, r.TotalRooms, booked, available, r.PricePerNight, r.MaxGuests);
            })
            .ToList();
    }

    public async Task<HotelProfileDto> GetHotelProfileAsync(Guid hotelId, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);
        return ToProfileDto(hotel);
    }

    public async Task<HotelProfileDto> UpdateHotelDetailsAsync(Guid hotelId, UpdateHotelDetailsRequest req, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        if (req.Name is not null)        hotel.Name        = req.Name;
        if (req.Address is not null)     hotel.Address     = req.Address;
        if (req.City is not null)        hotel.City        = req.City;
        if (req.StarRating.HasValue)     hotel.StarRating  = req.StarRating.Value;
        if (req.Description is not null) hotel.Description = req.Description;
        if (req.Amenities is not null)   hotel.Amenities   = req.Amenities;
        if (req.ImageUrl is not null)    hotel.ImageUrl    = req.ImageUrl;
        if (req.Images is not null)      hotel.Images      = req.Images;

        await _hotels.UpdateAsync(hotel, ct);
        await _uow.SaveChangesAsync(ct);
        return ToProfileDto(hotel);
    }

    public async Task<HotelRoomManagerDto> AddRoomAsync(Guid hotelId, CreateRoomRequest req, CancellationToken ct = default)
    {
        var exists = await _hotels.ExistsAsync(h => h.Id == hotelId, ct);
        if (!exists) throw new NotFoundException("Hotel", hotelId);

        var room = new HotelRoom
        {
            Id            = Guid.NewGuid(),
            HotelId       = hotelId,
            RoomType      = req.RoomType,
            PricePerNight = req.PricePerNight,
            MaxGuests     = req.MaxGuests,
            TotalRooms    = req.TotalRooms,
            Amenities     = req.Amenities,
            Images        = req.Images,
            IsActive      = true
        };

        await _rooms.AddAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
        return ToRoomDto(room);
    }

    public async Task<HotelRoomManagerDto> UpdateRoomAsync(Guid hotelId, Guid roomId, UpdateRoomRequest req, CancellationToken ct = default)
    {
        var room = await _rooms.GetByIdForHotelAsync(roomId, hotelId, ct)
            ?? throw new NotFoundException("Room", roomId);

        if (req.RoomType is not null)    room.RoomType      = req.RoomType;
        if (req.PricePerNight.HasValue)  room.PricePerNight = req.PricePerNight.Value;
        if (req.MaxGuests.HasValue)      room.MaxGuests     = req.MaxGuests.Value;
        if (req.TotalRooms.HasValue)     room.TotalRooms    = req.TotalRooms.Value;
        if (req.Amenities is not null)   room.Amenities     = req.Amenities;
        if (req.Images is not null)      room.Images        = req.Images;
        if (req.IsActive.HasValue)       room.IsActive      = req.IsActive.Value;

        await _rooms.UpdateAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
        return ToRoomDto(room);
    }

    public async Task DeleteRoomAsync(Guid hotelId, Guid roomId, CancellationToken ct = default)
    {
        var room = await _rooms.GetByIdForHotelAsync(roomId, hotelId, ct)
            ?? throw new NotFoundException("Room", roomId);

        await _rooms.DeleteAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    private static HotelManagerBookingDto ToBookingDto(Booking b) => new(
        b.Id,
        b.BookingRef,
        "Hotel Stay",
        b.GuestName ?? "—",
        b.GuestEmail ?? "—",
        b.GuestPhone,
        b.CheckIn ?? DateTime.MinValue,
        b.CheckOut ?? DateTime.MinValue,
        b.CheckIn.HasValue && b.CheckOut.HasValue
            ? Math.Max(1, (b.CheckOut.Value - b.CheckIn.Value).Days)
            : 0,
        b.Passengers ?? 1,
        b.FinalAmount,
        b.Status.ToString(),
        b.CreatedAt
    );

    private static HotelBookingDetailDto ToDetailDto(Booking b) => new(
        b.Id,
        b.BookingRef,
        "Hotel Stay",
        b.GuestName ?? "—",
        b.GuestEmail ?? "—",
        b.GuestPhone,
        b.CheckIn ?? DateTime.MinValue,
        b.CheckOut ?? DateTime.MinValue,
        b.CheckIn.HasValue && b.CheckOut.HasValue
            ? Math.Max(1, (b.CheckOut.Value - b.CheckIn.Value).Days)
            : 0,
        b.Passengers ?? 1,
        b.FinalAmount,
        b.Status.ToString(),
        b.CreatedAt,
        b.RoomNumber,
        b.CheckInTime,
        b.ActualCheckOutTime,
        b.CheckInNotes,
        b.PaymentMethod,
        b.Payment?.Status == PaymentStatus.Success,
        b.Payment?.Status.ToString() ?? "Unpaid",
        b.HotelCharges
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new HotelBookingChargeDto(c.Id, c.ItemName, c.Category, c.Quantity, c.Price, c.Tax, c.Notes, c.CreatedAt))
            .ToList()
    );

    private static HotelInvoiceDto BuildInvoice(Booking b, Hotel hotel)
    {
        var nights = b.CheckIn.HasValue && b.CheckOut.HasValue
            ? Math.Max(1, (b.CheckOut.Value - b.CheckIn.Value).Days) : 1;
        var pricePerNight = nights > 0 ? b.TotalAmount / nights : b.TotalAmount;
        var isRoomPrepaid = b.Payment?.Status == PaymentStatus.Success;
        var alreadyPaid   = isRoomPrepaid ? b.FinalAmount : 0m;

        var activeCharges = b.HotelCharges
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.CreatedAt)
            .ToList();

        var chargeSub = activeCharges.Sum(c => c.Price * c.Quantity);
        var chargeTax = activeCharges.Sum(c => c.Tax * c.Quantity);
        var grandTotal = (isRoomPrepaid ? 0m : b.FinalAmount) + chargeSub + chargeTax;
        var amountDue  = Math.Max(0m, grandTotal - alreadyPaid);

        var invoiceNumber = $"INV-{b.BookingRef}-{DateTime.UtcNow:yyyyMMdd}";

        return new HotelInvoiceDto(
            b.Id,
            b.BookingRef,
            invoiceNumber,
            hotel.Name,
            hotel.City,
            hotel.Address,
            hotel.StarRating,
            b.GuestName ?? "—",
            b.GuestEmail ?? "—",
            b.GuestPhone,
            "Hotel Stay",
            b.RoomNumber,
            b.CheckIn ?? DateTime.MinValue,
            b.CheckOut ?? DateTime.MinValue,
            nights,
            b.Passengers ?? 1,
            pricePerNight,
            b.TotalAmount,
            isRoomPrepaid,
            activeCharges.Select(c => new HotelBookingChargeDto(c.Id, c.ItemName, c.Category, c.Quantity, c.Price, c.Tax, c.Notes, c.CreatedAt)).ToList(),
            chargeSub,
            chargeTax,
            (isRoomPrepaid ? 0m : b.FinalAmount) + chargeSub + chargeTax,
            alreadyPaid,
            amountDue,
            b.PaymentMethod,
            DateTime.UtcNow
        );
    }

    private static HotelProfileDto ToProfileDto(Hotel hotel) => new(
        hotel.Id,
        hotel.Name,
        hotel.City,
        hotel.Address,
        hotel.StarRating,
        hotel.ReviewScore,
        hotel.ReviewCount,
        hotel.Description,
        hotel.Amenities,
        hotel.ImageUrl,
        hotel.Images,
        hotel.IsActive,
        hotel.Rooms.Select(ToRoomDto).ToList()
    );

    private static HotelRoomManagerDto ToRoomDto(HotelRoom r) => new(
        r.Id,
        r.RoomType,
        r.PricePerNight,
        r.MaxGuests,
        r.TotalRooms,
        r.Amenities,
        r.Images,
        r.IsActive
    );
}
