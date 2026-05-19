using System.Text.Json;
using TravelPort.Application.Common.Exceptions;
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
    private readonly ICacheService _cache;

    private static string LockKey(string busId) => $"bus_seat_locks:{busId}";
    private static readonly TimeSpan LockEntryTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan CacheEntryTtl = TimeSpan.FromMinutes(15);

    private sealed record SeatLockEntry(string SeatNumber, Guid UserId, DateTime ExpiresAt);

    public BusService(IBusSearchProvider provider, IBookingRepository bookings,
        IWalletService wallet, IUnitOfWork uow, IUserRepository users,
        IEmailService email, ICouponRepository coupons, ICacheService cache)
    {
        _provider = provider;
        _bookings = bookings;
        _wallet = wallet;
        _uow = uow;
        _users = users;
        _email = email;
        _coupons = coupons;
        _cache = cache;
    }

    public (List<BusDto> Items, int Total) Search(BusSearchRequest request)
        => _provider.Search(request);

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookBusRequest req, CancellationToken ct = default)
    {
        // Reject if any requested seat is locked by a different user
        if (!string.IsNullOrWhiteSpace(req.SelectedSeats) && !string.IsNullOrWhiteSpace(req.BusId))
        {
            var requested = req.SelectedSeats.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToArray();
            var lockedByOthers = await GetLockedSeatsAsync(req.BusId, userId, ct);
            var conflicts = requested.Intersect(lockedByOthers).ToArray();
            if (conflicts.Length > 0)
                throw new BusinessException($"Seat{(conflicts.Length > 1 ? "s" : "")} {string.Join(", ", conflicts)} {(conflicts.Length > 1 ? "are" : "is")} currently selected by another user. Please choose different seats.");
        }

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

    public async Task LockSeatsAsync(string busId, Guid userId, string[] seatNumbers, CancellationToken ct = default)
    {
        var key = LockKey(busId);
        var entries = (await _cache.GetAsync<List<SeatLockEntry>>(key, ct) ?? [])
            .Where(e => e.ExpiresAt > DateTime.UtcNow && !(e.UserId == userId && seatNumbers.Contains(e.SeatNumber)))
            .ToList();

        var expires = DateTime.UtcNow.Add(LockEntryTtl);
        entries.AddRange(seatNumbers.Select(s => new SeatLockEntry(s, userId, expires)));
        await _cache.SetAsync(key, entries, CacheEntryTtl, ct);
    }

    public async Task UnlockSeatsAsync(string busId, Guid userId, string[] seatNumbers, CancellationToken ct = default)
    {
        var key = LockKey(busId);
        var entries = (await _cache.GetAsync<List<SeatLockEntry>>(key, ct) ?? [])
            .Where(e => e.ExpiresAt > DateTime.UtcNow && !(e.UserId == userId && seatNumbers.Contains(e.SeatNumber)))
            .ToList();

        await _cache.SetAsync(key, entries, CacheEntryTtl, ct);
    }

    public async Task<string[]> GetLockedSeatsAsync(string busId, Guid excludeUserId, CancellationToken ct = default)
    {
        var key = LockKey(busId);
        var entries = await _cache.GetAsync<List<SeatLockEntry>>(key, ct) ?? [];
        return entries
            .Where(e => e.ExpiresAt > DateTime.UtcNow && e.UserId != excludeUserId)
            .Select(e => e.SeatNumber)
            .Distinct()
            .ToArray();
    }
}
