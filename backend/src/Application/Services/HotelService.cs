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
    private readonly ICouponRepository _coupons;
    private readonly IUserRepository _users;
    private readonly IEmailService _email;
    private readonly IExternalHotelProvider? _externalProvider;

    public HotelService(IHotelRepository hotels, IBookingRepository bookings,
        IWalletService wallet, ICacheService cache, IUnitOfWork uow, ICouponRepository coupons,
        IUserRepository users, IEmailService email,
        IExternalHotelProvider? externalProvider = null)
    {
        _hotels = hotels;
        _bookings = bookings;
        _wallet = wallet;
        _cache = cache;
        _uow = uow;
        _coupons = coupons;
        _users = users;
        _email = email;
        _externalProvider = externalProvider;
    }

    public async Task<(List<HotelDto> Items, int Total)> SearchAsync(HotelSearchRequest req, CancellationToken ct = default)
    {
        var key = $"hotels:{req.City}:{req.CheckIn:yyyyMMdd}:{req.CheckOut:yyyyMMdd}" +
                  $":{req.Guests}:{req.StarRating}:{req.SortBy}:{req.MinPrice}:{req.MaxPrice}";
        var cached = await _cache.GetAsync<List<HotelDto>>(key, ct);

        List<HotelDto> all;
        if (cached is not null)
        {
            all = cached;
        }
        else
        {
            if (_externalProvider?.IsConfigured == true)
            {
                all = await _externalProvider.SearchAsync(req, ct);
                if (all.Count == 0)
                    all = await SearchDbAsync(req, ct);
            }
            else
            {
                all = await SearchDbAsync(req, ct);
            }

            // Apply filters
            if (req.MinPrice.HasValue)
                all = all.Where(h => h.Rooms.Any(r => r.PricePerNight >= req.MinPrice.Value)).ToList();
            if (req.MaxPrice.HasValue)
                all = all.Where(h => h.Rooms.Any(r => r.PricePerNight <= req.MaxPrice.Value)).ToList();
            if (req.StarRating > 0)
                all = all.Where(h => Math.Floor(h.StarRating) >= req.StarRating).ToList();

            all = req.SortBy?.ToLower() switch
            {
                "rating" => [.. all.OrderByDescending(h => h.ReviewScore)],
                "stars"  => [.. all.OrderByDescending(h => h.StarRating)],
                "name"   => [.. all.OrderBy(h => h.Name)],
                _        => [.. all.OrderBy(h => h.Rooms.MinBy(r => r.PricePerNight)?.PricePerNight ?? 0)],
            };

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
        var nights = (req.CheckOut - req.CheckIn).Days;
        if (nights <= 0)
            throw new BusinessException("Check-out must be after check-in.");

        decimal total;
        Guid referenceId;

        // Try to find the hotel in DB first
        var hotel = await _hotels.GetByIdAsync(req.HotelId, ct);
        if (hotel is not null)
        {
            var room = hotel.Rooms.FirstOrDefault(r => r.Id == req.RoomId)
                ?? throw new NotFoundException("Room", req.RoomId);
            total       = room.PricePerNight * nights;
            referenceId = hotel.Id;
        }
        else
        {
            // Amadeus hotel — price stored in cache
            var cachedHotel = await _cache.GetAsync<HotelDto>($"amadeus_hotel:{req.HotelId}", ct);
            var cachedRoom  = cachedHotel?.Rooms.FirstOrDefault(r => r.Id == req.RoomId);
            if (cachedRoom is null)
                throw new NotFoundException("Hotel or Room", req.HotelId);
            total       = cachedRoom.PricePerNight * nights;
            referenceId = req.HotelId;
        }

        var bookingRef = await _bookings.GenerateBookingRefAsync("HT", ct);

        // Apply coupon discount
        decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var coupon = await _coupons.GetByCodeAsync(req.CouponCode, ct);
            if (coupon is { IsActive: true } &&
                (coupon.ExpiresAt == null || coupon.ExpiresAt > DateTime.UtcNow) &&
                (coupon.UsageLimit == null || coupon.UsedCount < coupon.UsageLimit) &&
                total >= coupon.MinAmount)
            {
                discount = coupon.Type == CouponType.Fixed
                    ? coupon.Value
                    : total * coupon.Value / 100m;
                if (coupon.MaxDiscount.HasValue)
                    discount = Math.Min(discount, coupon.MaxDiscount.Value);
                discount = Math.Min(discount, total);
                coupon.UsedCount++;
                await _coupons.UpdateAsync(coupon, ct);
            }
        }
        var finalAmount = total - discount;

        if (req.UseWallet)
            await _wallet.DeductAsync(userId, finalAmount, $"Hotel booking {bookingRef}", referenceId, ct);

        var booking = new Booking
        {
            Id             = Guid.NewGuid(),
            BookingRef     = bookingRef,
            UserId         = userId,
            BookingType    = BookingType.Hotel,
            ReferenceId    = referenceId,
            CheckIn        = req.CheckIn,
            CheckOut       = req.CheckOut,
            CouponCode     = req.CouponCode,
            TotalAmount    = total,
            DiscountAmount = discount,
            FinalAmount    = finalAmount,
            Status         = BookingStatus.Confirmed,
            GuestName      = req.GuestName,
            GuestEmail     = req.GuestEmail,
            GuestPhone     = req.GuestPhone,
        };

        await _bookings.AddAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        var user = await _users.GetByIdAsync(userId, ct);
        if (user is not null)
        {
            var guestName  = req.GuestName ?? user.Name;
            var guestEmail = req.GuestEmail ?? user.Email;
            var details    = BuildConfirmationDetails(req, hotel, nights, total, discount, finalAmount);
            await _email.SendBookingConfirmationAsync(guestEmail, guestName, booking.BookingRef, details, ct);
        }

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }

    private static string BuildConfirmationDetails(
        DTOs.Hotels.BookHotelRequest req, Domain.Entities.Hotel? hotel,
        int nights, decimal total, decimal discount, decimal finalAmount)
    {
        var hotelName = hotel?.Name ?? req.HotelId.ToString();
        var roomType  = hotel?.Rooms.FirstOrDefault(r => r.Id == req.RoomId)?.RoomType ?? "Room";
        var lines = new System.Text.StringBuilder();
        lines.AppendLine($"Hotel    : {hotelName}");
        lines.AppendLine($"Room     : {roomType}");
        lines.AppendLine($"Check-in : {req.CheckIn}");
        lines.AppendLine($"Check-out: {req.CheckOut}");
        lines.AppendLine($"Nights   : {nights}");
        lines.AppendLine($"Guests   : {req.Guests}");
        lines.AppendLine();
        lines.AppendLine($"Room Total : Rs.{total:0}");
        if (discount > 0) lines.AppendLine($"Discount   : -Rs.{discount:0}");
        lines.AppendLine($"Amount Paid: Rs.{finalAmount:0}");
        return lines.ToString();
    }

    private async Task<List<HotelDto>> SearchDbAsync(HotelSearchRequest req, CancellationToken ct)
    {
        var results = await _hotels.SearchAsync(req.City, req.CheckIn, req.CheckOut, req.Guests, ct);
        return [.. results.Select(ToDto)];
    }

    private static HotelDto ToDto(Hotel h) => new(
        h.Id, h.Name, h.City, h.Address ?? string.Empty,
        h.StarRating, h.ReviewScore, h.ReviewCount,
        h.Description ?? string.Empty, h.Amenities ?? string.Empty, h.ImageUrl ?? string.Empty,
        h.Rooms.Select(r => new HotelRoomDto(
            r.Id, r.RoomType, r.PricePerNight, r.MaxGuests, r.TotalRooms,
            r.Amenities ?? string.Empty,
            CancellationPolicy: "Free cancellation before 24 hours",
            MealPlan: "Room only",
            IsRefundable: true,
            ExternalOfferId: null
        )).ToList());
}
