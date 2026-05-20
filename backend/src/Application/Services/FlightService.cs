using System.Text.Json;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Flights;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class FlightService : IFlightService
{
    private readonly IFlightRepository _flights;
    private readonly IBookingRepository _bookings;
    private readonly IWalletService _wallet;
    private readonly ICacheService _cache;
    private readonly IUnitOfWork _uow;
    private readonly IUserRepository _users;
    private readonly IEmailService _email;
    private readonly ICouponRepository _coupons;
    private readonly IExternalFlightProvider? _externalProvider;
    private readonly INotificationService? _notifications;

    private static readonly Dictionary<string, string> AirlineCodeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["IndiGo"]    = "6E", ["Air India"] = "AI", ["SpiceJet"] = "SG",
        ["Vistara"]   = "UK", ["Akasa Air"] = "QP", ["Air India Express"] = "IX",
        ["Go First"]  = "G8", ["Air Asia India"] = "I5",
    };

    private static readonly Dictionary<string, string> CityNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BOM"] = "Mumbai",    ["DEL"] = "Delhi",    ["BLR"] = "Bengaluru",
        ["MAA"] = "Chennai",   ["HYD"] = "Hyderabad",["AMD"] = "Ahmedabad",
        ["GOI"] = "Goa",       ["CCU"] = "Kolkata",  ["JAI"] = "Jaipur",
        ["PNQ"] = "Pune",      ["COK"] = "Kochi",    ["LKO"] = "Lucknow",
    };

    public FlightService(IFlightRepository flights, IBookingRepository bookings,
        IWalletService wallet, ICacheService cache, IUnitOfWork uow,
        IUserRepository users, IEmailService email, ICouponRepository coupons,
        INotificationService? notifications = null,
        IExternalFlightProvider? externalProvider = null)
    {
        _flights = flights;
        _bookings = bookings;
        _wallet = wallet;
        _cache = cache;
        _uow = uow;
        _users = users;
        _email = email;
        _coupons = coupons;
        _notifications = notifications;
        _externalProvider = externalProvider;
    }

    public async Task<(List<FlightDto> Items, int Total)> SearchAsync(FlightSearchRequest req, CancellationToken ct = default)
    {
        var cacheKey = $"flights:{req.Origin}:{req.Destination}:{req.DepartureDate:yyyyMMdd}" +
                       $":{req.Passengers}:{req.CabinClass}:{req.MaxStops}:{req.Airlines}:{req.MaxPrice}";

        var cached = await _cache.GetAsync<List<FlightDto>>(cacheKey, ct);
        List<FlightDto> all;

        if (cached is not null)
        {
            all = cached;
        }
        else
        {
            // Always include DB seed flights; merge Duffel results on top when configured
            var dbFlights = await SearchDbAsync(req, ct);
            if (_externalProvider?.IsConfigured == true)
            {
                var external = await _externalProvider.SearchAsync(req, ct);
                all = [.. external, .. dbFlights];
            }
            else
            {
                all = dbFlights;
            }

            if (req.MaxPrice.HasValue)
                all = all.Where(f => f.Price <= req.MaxPrice.Value).ToList();
            if (req.MaxStops.HasValue)
                all = all.Where(f => f.Stops <= req.MaxStops.Value).ToList();
            if (!string.IsNullOrWhiteSpace(req.Airlines))
            {
                var codes = req.Airlines.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                        .Select(s => s.Trim())
                                        .ToHashSet(StringComparer.OrdinalIgnoreCase);
                all = all.Where(f => codes.Contains(f.AirlineCode)).ToList();
            }

            all = req.SortBy?.ToLower() switch
            {
                "duration"  => [.. all.OrderBy(f => f.DurationMinutes)],
                "departure" => [.. all.OrderBy(f => f.DepartureTime)],
                "arrival"   => [.. all.OrderBy(f => f.ArrivalTime)],
                _           => [.. all.OrderBy(f => f.Price)],
            };

            await _cache.SetAsync(cacheKey, all, TimeSpan.FromMinutes(5), ct);
        }

        var total = all.Count;
        var paged = all.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }

    public async Task<FlightDto> GetByIdAsync(Guid flightId, CancellationToken ct = default)
    {
        var cacheKey = $"flight:{flightId}";
        var cached = await _cache.GetAsync<FlightDto>(cacheKey, ct);
        if (cached is not null) return cached;

        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);
        var dto = ToDto(flight, "Economy");
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(30), ct);
        return dto;
    }

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookFlightRequest req, CancellationToken ct = default)
    {
        decimal unitPrice;
        Guid referenceId;
        Domain.Entities.Flight? flightEntity = null;

        // Check external offer caches: Duffel first, then Amadeus fallback
        var duffelRaw  = await _cache.GetAsync<JsonElement>($"duffel_offer:{req.FlightId}", ct);
        var amadeusRaw = duffelRaw.ValueKind == JsonValueKind.Undefined
            ? await _cache.GetAsync<JsonElement>($"amadeus_offer:{req.FlightId}", ct)
            : default;

        if (duffelRaw.ValueKind != JsonValueKind.Undefined)
        {
            unitPrice   = ExtractDuffelPrice(duffelRaw);
            referenceId = req.FlightId;
        }
        else if (amadeusRaw.ValueKind != JsonValueKind.Undefined)
        {
            unitPrice   = ExtractAmadeusPrice(amadeusRaw);
            referenceId = req.FlightId;
        }
        else
        {
            flightEntity = await _flights.GetByIdAsync(req.FlightId, ct)
                ?? throw new NotFoundException("Flight", req.FlightId);

            if (flightEntity.AvailableSeats < req.Passengers)
                throw new BusinessException("Not enough seats available.");

            unitPrice   = req.CabinClass == "Business" && flightEntity.BusinessPrice.HasValue
                ? flightEntity.BusinessPrice.Value : flightEntity.EconomyPrice;
            referenceId = flightEntity.Id;

            flightEntity.AvailableSeats -= req.Passengers;
            await _flights.UpdateAsync(flightEntity, ct);
        }

        var total      = unitPrice * req.Passengers;
        var bookingRef = await _bookings.GenerateBookingRefAsync("FL", ct);

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
                discount = coupon.Type == TravelPort.Domain.Enums.CouponType.Fixed
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
            await _wallet.DeductAsync(userId, finalAmount, $"Flight booking {bookingRef}", referenceId, ct);

        var booking = new Booking
        {
            Id             = Guid.NewGuid(),
            BookingRef     = bookingRef,
            UserId         = userId,
            BookingType    = BookingType.Flight,
            ReferenceId    = referenceId,
            Passengers     = req.Passengers,
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
        await _cache.RemoveAsync($"flight:{req.FlightId}", ct);

        // Send confirmation email immediately only when payment is settled at booking time.
        // For card/UPI/net-banking the email is sent after payment is verified (PaymentsController).
        bool paymentSettledNow = req.UseWallet || req.SavedCardId.HasValue;
        if (paymentSettledNow)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user is not null && flightEntity is not null)
            {
                var toEmail = !string.IsNullOrWhiteSpace(req.GuestEmail) ? req.GuestEmail : user.Email;
                var toName  = !string.IsNullOrWhiteSpace(req.GuestName)  ? req.GuestName  : user.Name;
                var depTime = flightEntity.DepartureTime.ToString("dd MMM yyyy, hh:mm tt");
                var arrTime = flightEntity.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt");
                var dur     = $"{flightEntity.Duration / 60}h {flightEntity.Duration % 60}m";
                await _email.SendFlightBookingConfirmationAsync(
                    toEmail, toName, booking.BookingRef,
                    flightEntity.Airline, flightEntity.FlightNumber,
                    flightEntity.Source, flightEntity.Source,
                    flightEntity.Destination, flightEntity.Destination,
                    depTime, arrTime, dur,
                    req.CabinClass, req.Passengers,
                    unitPrice, total, discount, req.CouponCode, finalAmount, ct);
            }
        }

        if (_notifications is not null && flightEntity is not null)
        {
            var originCity = CityNames.TryGetValue(flightEntity.Source, out var oc2) ? oc2 : flightEntity.Source;
            var destCity   = CityNames.TryGetValue(flightEntity.Destination, out var dc2) ? dc2 : flightEntity.Destination;
            await _notifications.CreateAsync(userId, "BookingConfirmed",
                "Flight Booking Confirmed!",
                $"Your flight {originCity} → {destCity} (Ref: {booking.BookingRef}) is confirmed.", ct);
        }

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }

    private async Task<List<FlightDto>> SearchDbAsync(FlightSearchRequest req, CancellationToken ct)
    {
        var results = await _flights.SearchAsync(req.Origin, req.Destination, req.DepartureDate, req.Passengers, ct);
        return [.. results.Select(f => ToDto(f, req.CabinClass))];
    }

    private static FlightDto ToDto(Flight f, string cabinClass)
    {
        var code = AirlineCodeMap.TryGetValue(f.Airline, out var c) ? c : f.Airline[..Math.Min(2, f.Airline.Length)];
        return new FlightDto(
            Id:              f.Id,
            FlightNumber:    f.FlightNumber,
            Airline:         f.Airline,
            AirlineCode:     code,
            Origin:          f.Source,
            OriginCity:      CityNames.TryGetValue(f.Source, out var oc) ? oc : f.Source,
            Destination:     f.Destination,
            DestinationCity: CityNames.TryGetValue(f.Destination, out var dc) ? dc : f.Destination,
            DepartureTime:   f.DepartureTime,
            ArrivalTime:     f.ArrivalTime,
            DurationMinutes: f.Duration,
            AvailableSeats:  f.AvailableSeats,
            Price:           cabinClass == "Business" && f.BusinessPrice.HasValue
                                ? f.BusinessPrice.Value : f.EconomyPrice,
            BusinessPrice:   f.BusinessPrice,
            CabinClass:      cabinClass,
            Stops:           f.Stops,
            IsRefundable:    false,
            BaggageIncluded: false,
            CheckedBags:     null,
            Aircraft:        null,
            ExternalOfferId: null
        );
    }

    private static decimal ExtractDuffelPrice(JsonElement elem)
    {
        try
        {
            if (elem.TryGetProperty("total_amount", out var amt))
                return decimal.TryParse(amt.GetString(), out var v) ? v : 0m;
        }
        catch { }
        return 0m;
    }

    private static decimal ExtractAmadeusPrice(JsonElement elem)
    {
        try
        {
            if (elem.TryGetProperty("price", out var price))
            {
                var key = price.TryGetProperty("grandTotal", out var gt) ? gt : price.GetProperty("total");
                return decimal.TryParse(key.GetString(), out var v) ? v : 0m;
            }
        }
        catch { }
        return 0m;
    }

}
