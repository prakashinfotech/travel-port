using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class FlightOperatorService : IFlightOperatorService
{
    private readonly IFlightRepository _flights;
    private readonly IFlightCompanyRepository _companies;
    private readonly IBookingRepository _bookings;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;

    public FlightOperatorService(
        IFlightRepository flights,
        IFlightCompanyRepository companies,
        IBookingRepository bookings,
        IUserRepository users,
        IUnitOfWork uow)
    {
        _flights   = flights;
        _companies = companies;
        _bookings  = bookings;
        _users     = users;
        _uow       = uow;
    }

    public async Task<FlightOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default)
    {
        var myFlights   = await _flights.GetByCompanyAsync(companyId, ct);
        var flightIds   = myFlights.Select(f => f.Id).ToList();
        var myBookings  = flightIds.Count > 0
            ? await _bookings.GetBookingsByFlightIdsAsync(flightIds, ct)
            : Array.Empty<Booking>();

        var confirmed   = myBookings.Count(b => b.Status == BookingStatus.Confirmed);
        var cancelled   = myBookings.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue     = myBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var passengers  = myBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.Passengers ?? 0);

        return new FlightOperatorDashboardDto(
            myFlights.Count,
            myFlights.Count(f => f.IsActive),
            myBookings.Count,
            confirmed,
            cancelled,
            revenue,
            passengers
        );
    }

    public async Task<List<OperatorFlightDto>> GetFlightsAsync(Guid companyId, CancellationToken ct = default)
    {
        var flights = await _flights.GetByCompanyAsync(companyId, ct);
        return flights.Select(ToFlightDto).ToList();
    }

    public async Task<OperatorFlightDto> AddFlightAsync(Guid companyId, CreateFlightRequest req, CancellationToken ct = default)
    {
        var company = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("FlightCompany", companyId);

        ValidateFlightRequest(req.Stops, req.Source, req.Destination, req.DepartureTime, req.ArrivalTime, req.LayoverAirport, req.LayoverDurationMinutes);

        var duration = (int)(req.ArrivalTime - req.DepartureTime).TotalMinutes;
        var flight = new Flight
        {
            Id              = Guid.NewGuid(),
            Airline         = company.Name,
            FlightNumber    = req.FlightNumber,
            Source          = req.Source.ToUpper(),
            Destination     = req.Destination.ToUpper(),
            DepartureTime   = req.DepartureTime,
            ArrivalTime     = req.ArrivalTime,
            Duration        = duration,
            TotalSeats      = req.TotalSeats,
            AvailableSeats  = req.TotalSeats,
            EconomyPrice    = req.EconomyPrice,
            BusinessPrice   = req.BusinessPrice,
            Stops           = req.Stops,
            LayoverAirport  = req.Stops == 1 ? req.LayoverAirport?.ToUpper() : null,
            LayoverDurationMinutes = req.Stops == 1 ? req.LayoverDurationMinutes : null,
            IsActive        = true,
            FlightCompanyId = companyId
        };

        await _flights.AddAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);
        return ToFlightDto(flight);
    }

    public async Task<OperatorFlightDto> UpdateFlightAsync(Guid companyId, Guid flightId, UpdateFlightRequest req, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);

        if (flight.FlightCompanyId != companyId)
            throw new BusinessException("You do not own this flight.");

        if (req.FlightNumber  != null) flight.FlightNumber  = req.FlightNumber;
        if (req.Source        != null) flight.Source        = req.Source.ToUpper();
        if (req.Destination   != null) flight.Destination   = req.Destination.ToUpper();
        if (req.DepartureTime != null) flight.DepartureTime = req.DepartureTime.Value;
        if (req.ArrivalTime   != null) flight.ArrivalTime   = req.ArrivalTime.Value;
        if (req.TotalSeats    != null) flight.TotalSeats    = req.TotalSeats.Value;
        if (req.EconomyPrice  != null) flight.EconomyPrice  = req.EconomyPrice.Value;
        if (req.BusinessPrice != null) flight.BusinessPrice = req.BusinessPrice.Value;
        if (req.Stops         != null) flight.Stops         = req.Stops.Value;
        if (req.LayoverAirport != null || req.Stops != null)
            flight.LayoverAirport = (req.Stops ?? flight.Stops) == 1 ? req.LayoverAirport?.ToUpper() : null;
        if (req.LayoverDurationMinutes != null || req.Stops != null)
            flight.LayoverDurationMinutes = (req.Stops ?? flight.Stops) == 1 ? req.LayoverDurationMinutes : null;
        if (req.IsActive      != null) flight.IsActive      = req.IsActive.Value;

        if (req.DepartureTime != null || req.ArrivalTime != null)
            flight.Duration = (int)(flight.ArrivalTime - flight.DepartureTime).TotalMinutes;

        ValidateFlightRequest(
            flight.Stops,
            flight.Source,
            flight.Destination,
            flight.DepartureTime,
            flight.ArrivalTime,
            flight.LayoverAirport,
            flight.LayoverDurationMinutes);

        await _flights.UpdateAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);
        return ToFlightDto(flight);
    }

    public async Task DeleteFlightAsync(Guid companyId, Guid flightId, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);

        if (flight.FlightCompanyId != companyId)
            throw new BusinessException("You do not own this flight.");

        flight.IsActive  = false;
        flight.DeletedAt = DateTime.UtcNow;
        await _flights.UpdateAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default)
    {
        var myFlights  = await _flights.GetByCompanyAsync(companyId, ct);
        var flightIds  = myFlights.Select(f => f.Id).ToList();
        if (flightIds.Count == 0) return new List<OperatorBookingDto>();

        var bookings = await _bookings.GetBookingsByFlightIdsAsync(flightIds, ct);
        return bookings.Select(b => new OperatorBookingDto(
            b.Id, b.BookingRef,
            b.GuestName ?? b.User?.Name ?? "Guest",
            b.GuestEmail ?? b.User?.Email ?? "",
            b.GuestPhone ?? b.User?.Phone,
            b.Passengers ?? 1,
            "Economy",
            b.FinalAmount,
            b.Status.ToString(),
            b.CreatedAt
        )).ToList();
    }

    private static OperatorFlightDto ToFlightDto(Flight f) => new(
        f.Id, f.FlightNumber, f.Source, f.Destination,
        f.DepartureTime, f.ArrivalTime, f.Duration,
        f.TotalSeats, f.AvailableSeats,
        f.EconomyPrice, f.BusinessPrice,
        f.Stops, f.LayoverAirport, f.LayoverDurationMinutes, f.IsActive, f.CreatedAt
    );

    private static void ValidateFlightRequest(
        int stops,
        string source,
        string destination,
        DateTime departureTime,
        DateTime arrivalTime,
        string? layoverAirport,
        int? layoverDurationMinutes)
    {
        if (string.Equals(source, destination, StringComparison.OrdinalIgnoreCase))
            throw new BusinessException("Source and destination airports must be different.");

        if (arrivalTime <= departureTime)
            throw new BusinessException("Arrival time must be after departure time.");

        if (stops < 0 || stops > 1)
            throw new BusinessException("Only non-stop and 1-stop flights are supported.");

        if (stops == 1)
        {
            if (string.IsNullOrWhiteSpace(layoverAirport))
                throw new BusinessException("Layover airport is required for 1-stop flights.");
            if (string.Equals(layoverAirport, source, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(layoverAirport, destination, StringComparison.OrdinalIgnoreCase))
                throw new BusinessException("Layover airport must differ from source and destination.");
            if (!layoverDurationMinutes.HasValue || layoverDurationMinutes.Value <= 0)
                throw new BusinessException("Layover duration must be greater than 0 minutes for 1-stop flights.");
        }
    }
}
