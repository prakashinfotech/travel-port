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

    public FlightService(IFlightRepository flights, IBookingRepository bookings,
        IWalletService wallet, ICacheService cache, IUnitOfWork uow)
    {
        _flights = flights;
        _bookings = bookings;
        _wallet = wallet;
        _cache = cache;
        _uow = uow;
    }

    public async Task<(List<FlightDto> Items, int Total)> SearchAsync(FlightSearchRequest req, CancellationToken ct = default)
    {
        var key = $"flights:{req.Origin}:{req.Destination}:{req.DepartureDate:yyyyMMdd}:{req.Passengers}:{req.CabinClass}";
        var cached = await _cache.GetAsync<List<FlightDto>>(key, ct);

        List<FlightDto> all;
        if (cached is not null)
        {
            all = cached;
        }
        else
        {
            var results = await _flights.SearchAsync(req.Origin, req.Destination, req.DepartureDate, req.Passengers, ct);
            all = results.Select(f => ToDto(f, req.CabinClass)).ToList();
            await _cache.SetAsync(key, all, TimeSpan.FromMinutes(5), ct);
        }

        var total = all.Count;
        var paged = all.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }

    public async Task<FlightDto> GetByIdAsync(Guid flightId, CancellationToken ct = default)
    {
        var key = $"flight:{flightId}";
        var cached = await _cache.GetAsync<FlightDto>(key, ct);
        if (cached is not null) return cached;

        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);
        var dto = ToDto(flight, "Economy");
        await _cache.SetAsync(key, dto, TimeSpan.FromMinutes(30), ct);
        return dto;
    }

    public async Task<BookingCreatedResponse> BookAsync(Guid userId, BookFlightRequest req, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(req.FlightId, ct)
            ?? throw new NotFoundException("Flight", req.FlightId);

        if (flight.AvailableSeats < req.Passengers)
            throw new BusinessException("Not enough seats available.");

        var unitPrice = req.CabinClass == "Business" && flight.BusinessPrice.HasValue
            ? flight.BusinessPrice.Value
            : flight.EconomyPrice;

        var total = unitPrice * req.Passengers;
        var bookingRef = await _bookings.GenerateBookingRefAsync(ct);

        if (req.UseWallet)
            await _wallet.DeductAsync(userId, total, $"Flight booking {bookingRef}", req.FlightId, ct);

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingRef = bookingRef,
            UserId = userId,
            BookingType = BookingType.Flight,
            ReferenceId = flight.Id,
            Passengers = req.Passengers,
            CouponCode = req.CouponCode,
            TotalAmount = total,
            DiscountAmount = 0,
            FinalAmount = total,
            Status = BookingStatus.Confirmed
        };

        flight.AvailableSeats -= req.Passengers;
        await _flights.UpdateAsync(flight, ct);
        await _bookings.AddAsync(booking, ct);
        await _uow.SaveChangesAsync(ct);

        await _cache.RemoveAsync($"flight:{flight.Id}", ct);

        return new BookingCreatedResponse(booking.Id, booking.BookingRef, booking.TotalAmount, booking.Status);
    }

    private static FlightDto ToDto(Flight f, string cabinClass) => new(
        f.Id, f.FlightNumber, f.Airline, f.Source, f.Destination,
        f.DepartureTime, f.ArrivalTime, f.Duration, f.AvailableSeats,
        cabinClass == "Business" && f.BusinessPrice.HasValue ? f.BusinessPrice.Value : f.EconomyPrice,
        cabinClass);
}
