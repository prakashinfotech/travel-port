using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Hotels;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class HotelService : IHotelService
{
    private readonly IHotelRepository _hotels;
    private readonly IBookingRepository _bookings;
    private readonly IWalletService _wallet;
    private readonly ICacheService _cache;
    private readonly IUnitOfWork _uow;

    public HotelService(IHotelRepository hotels, IBookingRepository bookings,
        IWalletService wallet, ICacheService cache, IUnitOfWork uow)
    {
        _hotels = hotels;
        _bookings = bookings;
        _wallet = wallet;
        _cache = cache;
        _uow = uow;
    }

    public async Task<(List<HotelDto> Items, int Total)> SearchAsync(HotelSearchRequest req, CancellationToken ct = default)
    {
        var key = $"hotels:{req.City}:{req.CheckIn:yyyyMMdd}:{req.CheckOut:yyyyMMdd}:{req.Guests}:{req.StarRating}:{req.SortBy}";
        var cached = await _cache.GetAsync<List<HotelDto>>(key, ct);

        List<HotelDto> all;
        if (cached is not null)
        {
            all = cached;
        }
        else
        {
            var results = await _hotels.SearchAsync(req.City, req.CheckIn, req.CheckOut, req.Guests, ct);
            all = results.Select(ToDto).ToList();
            await _cache.SetAsync(key, all, TimeSpan.FromMinutes(5), ct);
        }

        var total = all.Count;
        var paged = all.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }

    public async Task<HotelDto> GetByIdAsync(Guid hotelId, CancellationToken ct = default)
    {
        var key = $"hotel:{hotelId}";
        var cached = await _cache.GetAsync<HotelDto>(key, ct);
        if (cached is not null) return cached;

        var hotel = await _hotels.GetByIdAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);
        var dto = ToDto(hotel);
        await _cache.SetAsync(key, dto, TimeSpan.FromMinutes(30), ct);
        return dto;
    }

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookHotelRequest req, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetByIdAsync(req.HotelId, ct)
            ?? throw new NotFoundException("Hotel", req.HotelId);

        var room = hotel.Rooms.FirstOrDefault(r => r.Id == req.RoomId)
            ?? throw new NotFoundException("Room", req.RoomId);

        var nights = (req.CheckOut - req.CheckIn).Days;
        if (nights <= 0)
            throw new BusinessException("Check-out must be after check-in.");

        var total = room.PricePerNight * nights;
        var bookingRef = await _bookings.GenerateBookingRefAsync(ct);

        if (req.UseWallet)
            await _wallet.DeductAsync(userId, total, $"Hotel booking {bookingRef}", hotel.Id, ct);

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingRef = bookingRef,
            UserId = userId,
            BookingType = BookingType.Hotel,
            ReferenceId = hotel.Id,
            CheckIn = req.CheckIn,
            CheckOut = req.CheckOut,
            CouponCode = req.CouponCode,
            TotalAmount = total,
            DiscountAmount = 0,
            FinalAmount = total,
            Status = BookingStatus.Confirmed
        };

        await _bookings.AddAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }

    private static HotelDto ToDto(Hotel h) => new(
        h.Id, h.Name, h.City, h.Address ?? string.Empty,
        h.StarRating, h.ReviewScore, h.ReviewCount,
        h.Description ?? string.Empty, h.Amenities ?? string.Empty, h.ImageUrl ?? string.Empty,
        h.Rooms.Select(r => new HotelRoomDto(
            r.Id, r.RoomType, r.PricePerNight, r.MaxGuests, r.TotalRooms, r.Amenities ?? string.Empty
        )).ToList());
}
