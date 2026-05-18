using System.Text.Json;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class CabService : ICabService
{
    private readonly ICabSearchProvider _provider;
    private readonly IBookingRepository _bookings;
    private readonly IWalletService _wallet;
    private readonly IUnitOfWork _uow;
    private readonly IUserRepository _users;
    private readonly IEmailService _email;
    private readonly ICouponRepository _coupons;

    public CabService(ICabSearchProvider provider, IBookingRepository bookings,
        IWalletService wallet, IUnitOfWork uow, IUserRepository users,
        IEmailService email, ICouponRepository coupons)
    {
        _provider = provider;
        _bookings = bookings;
        _wallet = wallet;
        _uow = uow;
        _users = users;
        _email = email;
        _coupons = coupons;
    }

    public (List<CabDto> Items, int Total) Search(CabSearchRequest request)
        => _provider.Search(request);

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookCabRequest req, CancellationToken ct = default)
    {
        var total = req.Price;
        var bookingRef = await _bookings.GenerateBookingRefAsync("CB", ct);

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
            await _wallet.DeductAsync(userId, finalAmount, $"Cab booking {bookingRef}", Guid.NewGuid(), ct);

        var snapshot = new TransportSnapshot(
            OperatorName:    req.Provider,
            VehicleType:     req.CabType,
            Origin:          req.Origin,
            Destination:     req.Destination,
            DepartureTime:   req.PickupDateTime,
            ArrivalTime:     req.PickupDateTime.AddMinutes(req.DurationMinutes),
            DurationMinutes: req.DurationMinutes,
            CarModel:        req.CarModel,
            DistanceKm:      req.DistanceKm
        );

        var booking = new Booking
        {
            Id               = Guid.NewGuid(),
            BookingRef       = bookingRef,
            UserId           = userId,
            BookingType      = BookingType.Cab,
            ReferenceId      = Guid.NewGuid(),
            Passengers       = 1,
            CheckIn          = req.PickupDateTime,
            CouponCode       = req.CouponCode,
            TotalAmount      = total,
            DiscountAmount   = discount,
            FinalAmount      = finalAmount,
            Status           = BookingStatus.Confirmed,
            GuestName        = req.GuestName,
            GuestEmail       = req.GuestEmail,
            GuestPhone       = req.GuestPhone,
            TransportSnapshot = JsonSerializer.Serialize(snapshot),
        };

        await _bookings.AddAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        bool paymentSettledNow = req.UseWallet || req.SavedCardId.HasValue;
        if (paymentSettledNow)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user is not null)
            {
                var toEmail = !string.IsNullOrWhiteSpace(req.GuestEmail) ? req.GuestEmail : user.Email;
                var toName  = !string.IsNullOrWhiteSpace(req.GuestName)  ? req.GuestName  : user.Name;
                var pickup  = req.PickupDateTime.ToString("dd MMM yyyy, hh:mm tt");
                var dropoff = req.PickupDateTime.AddMinutes(req.DurationMinutes).ToString("dd MMM yyyy, hh:mm tt");
                var dur     = $"{req.DurationMinutes / 60}h {req.DurationMinutes % 60}m";
                await _email.SendTransportBookingConfirmationAsync(
                    toEmail, toName, bookingRef, "Cab",
                    $"{req.Provider} {req.CabType} ({req.CarModel})", $"{req.DistanceKm:F1} km",
                    req.Origin, req.Destination,
                    pickup, dropoff, dur,
                    1, req.Price, total, discount, req.CouponCode, finalAmount, ct);
            }
        }

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }
}
