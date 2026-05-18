using System.Text.Json;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

// BusService delegates search to IBusSearchProvider (implemented in Infrastructure)

namespace TravelPort.Application.Services;

public class BusService : IBusService
{
    private readonly IBusSearchProvider _provider;
    private readonly IBookingRepository _bookings;
    private readonly IWalletService _wallet;
    private readonly IUnitOfWork _uow;
    private readonly IUserRepository _users;
    private readonly IEmailService _email;
    private readonly ICouponRepository _coupons;

    public BusService(IBusSearchProvider provider, IBookingRepository bookings,
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

    public (List<BusDto> Items, int Total) Search(BusSearchRequest request)
        => _provider.Search(request);

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookBusRequest req, CancellationToken ct = default)
    {
        var total = req.Price * req.Seats;
        var bookingRef = await _bookings.GenerateBookingRefAsync("BU", ct);

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
            await _wallet.DeductAsync(userId, finalAmount, $"Bus booking {bookingRef}", Guid.NewGuid(), ct);

        var snapshot = new TransportSnapshot(
            OperatorName:    req.Operator,
            VehicleType:     req.BusType,
            Origin:          req.Origin,
            Destination:     req.Destination,
            DepartureTime:   req.DepartureTime,
            ArrivalTime:     req.ArrivalTime,
            DurationMinutes: req.DurationMinutes,
            Amenities:       req.Amenities,
            SeatNumbers:     req.SelectedSeats,
            BusNumber:       req.BusNumber,
            DriverPhone:     req.DriverPhone,
            BoardingPoint:   req.BoardingPoint,
            DroppingPoint:   req.DroppingPoint
        );

        var booking = new Booking
        {
            Id               = Guid.NewGuid(),
            BookingRef       = bookingRef,
            UserId           = userId,
            BookingType      = BookingType.Bus,
            ReferenceId      = Guid.NewGuid(),
            Passengers       = req.Seats,
            CheckIn          = req.DepartureTime,
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
                await _email.SendTransportBookingConfirmationAsync(
                    toEmail, toName, bookingRef, "Bus",
                    req.Operator, req.BusType,
                    req.Origin, req.Destination,
                    req.DepartureTime.ToString("dd MMM yyyy, hh:mm tt"),
                    req.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt"),
                    $"{req.DurationMinutes / 60}h {req.DurationMinutes % 60}m",
                    req.Seats, req.Price, total, discount, req.CouponCode, finalAmount,
                    seatNumbers:    req.SelectedSeats,
                    busNumber:      req.BusNumber,
                    driverPhone:    req.DriverPhone,
                    boardingPoint:  req.BoardingPoint,
                    droppingPoint:  req.DroppingPoint,
                    ct: ct);
            }
        }

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }
}
