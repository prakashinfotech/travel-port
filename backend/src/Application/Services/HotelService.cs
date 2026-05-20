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
    private readonly IRepository<HotelReview> _reviews;
    private readonly IBookingRepository _bookings;
    private readonly IWalletService _wallet;
    private readonly ICacheService _cache;
    private readonly IUnitOfWork _uow;
    private readonly ICouponRepository _coupons;
    private readonly IUserRepository _users;
    private readonly IEmailService _email;
    private readonly IExternalHotelProvider? _externalProvider;

    public HotelService(IHotelRepository hotels, IRepository<HotelReview> reviews, IBookingRepository bookings,
        IWalletService wallet, ICacheService cache, IUnitOfWork uow, ICouponRepository coupons,
        IUserRepository users, IEmailService email,
        IExternalHotelProvider? externalProvider = null)
    {
        _hotels = hotels;
        _reviews = reviews;
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
        var dto = await ToDtoAsync(hotel, ct);
        await _cache.SetAsync(key, dto, TimeSpan.FromMinutes(30), ct);
        return dto;
    }

    public async Task<HotelReviewDto> CreateReviewAsync(
        Guid userId,
        Guid hotelId,
        CreateHotelReviewRequest req,
        CancellationToken ct = default)
    {
        var hotel = await _hotels.GetByIdAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        var hasCompletedStay = (await _bookings.FindAsync(b =>
            b.UserId == userId &&
            b.BookingType == BookingType.Hotel &&
            b.ReferenceId == hotelId &&
            b.Status == BookingStatus.Confirmed &&
            b.CheckOut.HasValue &&
            b.CheckOut.Value < DateTime.UtcNow, ct)).Any();

        if (!hasCompletedStay)
            throw new BusinessException("You can review a hotel only after completing a stay.");

        var existingReview = (await _reviews.FindAsync(
            r => r.HotelId == hotelId && r.UserId == userId, ct)).FirstOrDefault();

        if (existingReview is not null)
            throw new BusinessException("You have already reviewed this hotel.");

        var review = new HotelReview
        {
            Id = Guid.NewGuid(),
            HotelId = hotelId,
            UserId = userId,
            Rating = req.Rating,
            Comment = req.Comment.Trim(),
        };

        await _reviews.AddAsync(review, ct);
        var nextCount = hotel.ReviewCount + 1;
        hotel.ReviewScore = Math.Round(((hotel.ReviewScore * hotel.ReviewCount) + review.Rating) / nextCount, 1);
        hotel.ReviewCount = nextCount;
        await _hotels.UpdateAsync(hotel, ct);
        await _uow.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"hotel:{hotelId}", ct);

        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User", userId);

        return new HotelReviewDto(
            review.Id,
            userId,
            user.Name,
            review.Rating,
            review.Comment,
            review.CreatedAt
        );
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

        // Send confirmation email immediately only when payment is settled at booking time.
        // For card/UPI/net-banking the email is sent after payment is verified (PaymentsController).
        bool paymentSettledNow = req.UseWallet || req.SavedCardId.HasValue;
        if (paymentSettledNow)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user is not null)
            {
                var guestName     = req.GuestName  ?? user.Name;
                var guestEmail    = req.GuestEmail ?? user.Email;
                var hotelName     = hotel?.Name    ?? req.HotelId.ToString();
                var hotelAddress  = hotel?.Address ?? string.Empty;
                var city          = hotel?.City    ?? string.Empty;
                var starRating    = hotel?.StarRating ?? 0m;
                var room          = hotel?.Rooms.FirstOrDefault(r => r.Id == req.RoomId);
                var roomType      = room?.RoomType   ?? "Room";
                var pricePerNight = room?.PricePerNight ?? (total / nights);

                await _email.SendHotelBookingConfirmationAsync(
                    guestEmail, guestName, booking.BookingRef,
                    hotelName, hotelAddress, city, starRating,
                    roomType,
                    req.CheckIn.ToString("dd MMM yyyy"),
                    req.CheckOut.ToString("dd MMM yyyy"),
                    nights, req.Guests,
                    req.GuestName, req.GuestPhone,
                    pricePerNight, total, discount, req.CouponCode, finalAmount, ct);
            }
        }

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
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
        h.Images,
        h.Rooms.Select(r => new HotelRoomDto(
            r.Id, r.RoomType, r.PricePerNight, r.MaxGuests, r.TotalRooms,
            r.Amenities ?? string.Empty,
            CancellationPolicy: "Free cancellation before 24 hours",
            MealPlan: "Room only",
            IsRefundable: true,
            ExternalOfferId: null
        )).ToList(),
        Reviews: null);

    private async Task<HotelDto> ToDtoAsync(Hotel hotel, CancellationToken ct)
    {
        var reviewEntities = (await _reviews.FindAsync(r => r.HotelId == hotel.Id, ct))
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        var reviewUsers = new Dictionary<Guid, string>();
        foreach (var userId in reviewEntities.Select(r => r.UserId).Distinct())
        {
            var user = await _users.GetByIdAsync(userId, ct);
            reviewUsers[userId] = user?.Name ?? "Guest";
        }

        return ToDto(hotel) with
        {
            Reviews = [.. reviewEntities.Select(r => new HotelReviewDto(
                r.Id,
                r.UserId,
                reviewUsers.GetValueOrDefault(r.UserId, "Guest"),
                r.Rating,
                r.Comment,
                r.CreatedAt
            ))]
        };
    }

}
