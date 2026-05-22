using System.Text.Json;
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
    private readonly IWalletService _wallet;
    private readonly IEmailService _email;
    private readonly IUnitOfWork _uow;

    public FlightOperatorService(
        IFlightRepository flights,
        IFlightCompanyRepository companies,
        IBookingRepository bookings,
        IUserRepository users,
        IWalletService wallet,
        IEmailService email,
        IUnitOfWork uow)
    {
        _flights   = flights;
        _companies = companies;
        _bookings  = bookings;
        _users     = users;
        _wallet    = wallet;
        _email     = email;
        _uow       = uow;
    }

    public async Task<FlightOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default)
    {
        var myFlights   = await _flights.GetByCompanyAsync(companyId, ct);
        var flightIds   = myFlights.Select(f => f.Id).ToList();
        var myBookings  = flightIds.Count > 0
            ? await _bookings.GetBookingsByFlightIdsAsync(flightIds, ct)
            : Array.Empty<Booking>();

        var confirmed  = myBookings.Count(b => b.Status == BookingStatus.Confirmed);
        var cancelled  = myBookings.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue    = myBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var passengers = myBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.Passengers ?? 0);

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
            FlightCompanyId = companyId,
            SeatLayoutConfig = req.SeatLayoutConfig,
            SeatRows        = req.SeatRows ?? 30,
            LadiesSeats     = SerializeSeats(req.LadiesSeats),
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
        if (req.SeatLayoutConfig != null) flight.SeatLayoutConfig = req.SeatLayoutConfig;
        if (req.SeatRows      != null) flight.SeatRows      = req.SeatRows.Value;
        if (req.LadiesSeats   != null) flight.LadiesSeats   = SerializeSeats(req.LadiesSeats);

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
        var myFlights = await _flights.GetByCompanyAsync(companyId, ct);
        var flightIds = myFlights.Select(f => f.Id).ToList();
        if (flightIds.Count == 0) return new List<OperatorBookingDto>();

        var bookings = await _bookings.GetBookingsByFlightIdsAsync(flightIds, ct);
        return bookings.Select(b => ToBookingDto(b)).ToList();
    }

    // ── Seat Layout ───────────────────────────────────────────────────────────

    public async Task<List<FlightDateRouteDto>> GetFlightsByDateAsync(Guid companyId, DateTime date, CancellationToken ct = default)
    {
        var all = await _flights.GetByCompanyAsync(companyId, ct);
        return all
            .Where(f => f.DepartureTime.Date == date.Date && f.IsActive)
            .Select(f => new FlightDateRouteDto(
                f.Id, f.FlightNumber, f.Source, f.Destination,
                f.DepartureTime, f.ArrivalTime, f.AvailableSeats, f.TotalSeats))
            .ToList();
    }

    public async Task<SeatLayoutDto> GetSeatLayoutAsync(Guid companyId, Guid flightId, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);

        if (flight.FlightCompanyId != companyId)
            throw new BusinessException("You do not own this flight.");

        var bookings   = await _bookings.GetBookingsByFlightIdsAsync(new[] { flightId }, ct);
        var ladiesSeats = DeserializeSeats(flight.LadiesSeats);
        var layoutConfig = flight.SeatLayoutConfig ?? "3-3";
        var rows         = flight.SeatRows > 0 ? flight.SeatRows : 30;

        var active = bookings.Where(b => b.Status != BookingStatus.Cancelled).ToList();

        // Build booked seat map from bookings that have specific seat assignments
        var bookedMap = new Dictionary<string, (string Name, string Email, string Phone, string Ref, Guid Id)>();
        foreach (var b in active.Where(b => !string.IsNullOrEmpty(b.SeatNumbers)))
        {
            var seats = JsonSerializer.Deserialize<List<string>>(b.SeatNumbers!) ?? new();
            var name  = b.GuestName  ?? b.User?.Name  ?? "Guest";
            var email = b.GuestEmail ?? b.User?.Email ?? "";
            var phone = b.GuestPhone ?? b.User?.Phone ?? "";
            foreach (var seat in seats)
                bookedMap[seat] = (name, email, phone, b.BookingRef, b.Id);
        }

        // Count online-booked passengers with no specific seat (normal booking flow)
        var unassignedPassengers = active
            .Where(b => string.IsNullOrEmpty(b.SeatNumbers))
            .Sum(b => b.Passengers ?? 1);

        // Auto-assign unassigned passengers to seats sequentially (for display only)
        var sections  = layoutConfig.Split('-').Select(int.Parse).ToArray();
        var totalCols = sections.Sum();

        if (unassignedPassengers > 0)
        {
            var assigned = 0;
            for (int row = 1; row <= rows && assigned < unassignedPassengers; row++)
            {
                for (int col = 0; col < totalCols && assigned < unassignedPassengers; col++)
                {
                    var seatId = $"{row}{(char)('A' + col)}";
                    if (!bookedMap.ContainsKey(seatId))
                    {
                        bookedMap[seatId] = ("Online Booking", "", "", "Online", Guid.Empty);
                        assigned++;
                    }
                }
            }
        }

        var allSeats  = new List<SeatDto>();

        for (int row = 1; row <= rows; row++)
        {
            for (int col = 0; col < totalCols; col++)
            {
                var seatId   = $"{row}{(char)('A' + col)}";
                var isLadies = ladiesSeats.Contains(seatId);
                var isBooked = bookedMap.ContainsKey(seatId);
                var info     = isBooked ? bookedMap[seatId] : default;
                allSeats.Add(new SeatDto(
                    seatId, isLadies, isBooked,
                    isBooked ? info.Name  : null,
                    isBooked ? info.Ref   : null,
                    isBooked ? (info.Id == Guid.Empty ? null : info.Id) : null,
                    isBooked ? info.Email : null,
                    isBooked ? info.Phone : null));
            }
        }

        return new SeatLayoutDto(
            flightId, flight.FlightNumber, flight.Source, flight.Destination,
            flight.DepartureTime, layoutConfig, rows, ladiesSeats, allSeats, unassignedPassengers);
    }

    public async Task<OperatorFlightDto> UpdateSeatLayoutAsync(Guid companyId, Guid flightId, SeatLayoutConfigRequest req, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);

        if (flight.FlightCompanyId != companyId)
            throw new BusinessException("You do not own this flight.");

        // Validate layout config format
        var sections = req.LayoutConfig.Split('-');
        if (sections.Length < 1 || sections.Any(s => !int.TryParse(s, out var n) || n <= 0))
            throw new BusinessException("Invalid layout config. Use format like '3-3', '2-2', or '2-3-2'.");

        flight.SeatLayoutConfig = req.LayoutConfig;
        flight.SeatRows         = req.SeatRows > 0 ? req.SeatRows : 30;
        flight.LadiesSeats      = SerializeSeats(req.LadiesSeats);

        await _flights.UpdateAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);
        return ToFlightDto(flight);
    }

    public async Task<OperatorBookingDto> BulkBookSeatsAsync(
        Guid companyId, Guid flightId, Guid managerId, BulkSeatBookingRequest req, CancellationToken ct = default)
    {
        var flight = await _flights.GetByIdAsync(flightId, ct)
            ?? throw new NotFoundException("Flight", flightId);

        if (flight.FlightCompanyId != companyId)
            throw new BusinessException("You do not own this flight.");

        if (req.SeatNumbers == null || req.SeatNumbers.Count == 0)
            throw new BusinessException("At least one seat must be selected.");

        // Check seat conflicts
        var existing = await _bookings.GetBookingsByFlightIdsAsync(new[] { flightId }, ct);
        var bookedSeats = new HashSet<string>();
        foreach (var b in existing.Where(b => b.Status != BookingStatus.Cancelled && !string.IsNullOrEmpty(b.SeatNumbers)))
        {
            var seats = JsonSerializer.Deserialize<List<string>>(b.SeatNumbers!) ?? new();
            foreach (var s in seats) bookedSeats.Add(s);
        }

        var conflicts = req.SeatNumbers.Where(s => bookedSeats.Contains(s)).ToList();
        if (conflicts.Count > 0)
            throw new BusinessException($"Seats already booked: {string.Join(", ", conflicts)}");

        if (flight.AvailableSeats < req.SeatNumbers.Count)
            throw new BusinessException($"Only {flight.AvailableSeats} seats available.");

        // Try to find user by passenger email; fall back to manager
        var passengerUser = await _users.GetByEmailAsync(req.PassengerEmail, ct);
        var userId = passengerUser?.Id ?? managerId;

        var unitPrice  = req.CabinClass == "Business" && flight.BusinessPrice.HasValue
            ? flight.BusinessPrice.Value
            : flight.EconomyPrice;
        var total = unitPrice * req.SeatNumbers.Count;

        var bookingRef = await _bookings.GenerateBookingRefAsync("TP", ct);
        var booking = new Booking
        {
            Id          = Guid.NewGuid(),
            BookingRef  = bookingRef,
            UserId      = userId,
            BookingType = BookingType.Flight,
            ReferenceId = flightId,
            Passengers  = req.SeatNumbers.Count,
            GuestName   = req.PassengerName,
            GuestEmail  = req.PassengerEmail,
            GuestPhone  = req.PassengerPhone,
            SeatNumbers = JsonSerializer.Serialize(req.SeatNumbers),
            TotalAmount = total,
            FinalAmount = total,
            Status      = BookingStatus.Confirmed,
        };

        flight.AvailableSeats -= req.SeatNumbers.Count;

        await _bookings.AddAsync(booking, ct);
        await _flights.UpdateAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);

        // Send confirmation email to passenger
        try
        {
            var depTime = flight.DepartureTime.ToString("dd MMM yyyy, hh:mm tt");
            var arrTime = flight.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt");
            var dur     = $"{flight.Duration / 60}h {flight.Duration % 60}m";
            await _email.SendFlightBookingConfirmationAsync(
                req.PassengerEmail, req.PassengerName, bookingRef,
                flight.Airline, flight.FlightNumber,
                flight.Source, flight.Source, flight.Destination, flight.Destination,
                depTime, arrTime, dur,
                req.CabinClass, req.SeatNumbers.Count,
                unitPrice, total, 0, null, total, ct);
        }
        catch { /* email failure is non-fatal */ }

        return ToBookingDto(booking);
    }

    public async Task CancelSeatBookingAsync(Guid companyId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.BookingType != BookingType.Flight)
            throw new BusinessException("Only flight bookings can be cancelled from the seat map.");

        // Verify this booking belongs to one of the operator's flights
        var myFlights = await _flights.GetByCompanyAsync(companyId, ct);
        if (!myFlights.Any(f => f.Id == booking.ReferenceId))
            throw new BusinessException("You do not own the flight for this booking.");

        if (booking.Status == BookingStatus.Cancelled)
            throw new BusinessException("Booking is already cancelled.");

        var refund = booking.FinalAmount * 0.90m;
        booking.Status      = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.RefundAmount = refund;

        // Restore available seats
        var flight = myFlights.First(f => f.Id == booking.ReferenceId);
        var seatCount = string.IsNullOrEmpty(booking.SeatNumbers)
            ? (booking.Passengers ?? 1)
            : (JsonSerializer.Deserialize<List<string>>(booking.SeatNumbers)?.Count ?? 1);
        flight.AvailableSeats += seatCount;

        await _bookings.UpdateAsync(booking, ct);
        await _flights.UpdateAsync(flight, ct);
        await _uow.SaveChangesAsync(ct);

        // Refund wallet
        if (refund > 0)
        {
            await _wallet.RefundAsync(booking.UserId, refund,
                $"Refund for cancelled booking {booking.BookingRef}", bookingId, ct);
            await _uow.SaveChangesAsync(ct);
        }

        // Send cancellation email
        try
        {
            var guestEmail = !string.IsNullOrWhiteSpace(booking.GuestEmail) ? booking.GuestEmail : "";
            var guestName  = !string.IsNullOrWhiteSpace(booking.GuestName)  ? booking.GuestName  : "Passenger";
            if (!string.IsNullOrWhiteSpace(guestEmail))
                await _email.SendBookingCancellationAsync(guestEmail, guestName, booking.BookingRef, "Flight", refund, ct);
        }
        catch { /* email failure is non-fatal */ }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static OperatorFlightDto ToFlightDto(Flight f) => new(
        f.Id, f.FlightNumber, f.Source, f.Destination,
        f.DepartureTime, f.ArrivalTime, f.Duration,
        f.TotalSeats, f.AvailableSeats,
        f.EconomyPrice, f.BusinessPrice,
        f.Stops, f.LayoverAirport, f.LayoverDurationMinutes, f.IsActive, f.CreatedAt,
        f.SeatLayoutConfig,
        f.SeatRows > 0 ? f.SeatRows : 30,
        DeserializeSeats(f.LadiesSeats)
    );

    private static OperatorBookingDto ToBookingDto(Booking b) => new(
        b.Id, b.BookingRef,
        b.GuestName ?? b.User?.Name ?? "Guest",
        b.GuestEmail ?? b.User?.Email ?? "",
        b.GuestPhone ?? b.User?.Phone,
        b.Passengers ?? 1,
        "Economy",
        b.FinalAmount,
        b.Status.ToString(),
        b.CreatedAt,
        string.IsNullOrEmpty(b.SeatNumbers) ? null : JsonSerializer.Deserialize<List<string>>(b.SeatNumbers),
        b.PaymentMethod
    );

    private static string? SerializeSeats(List<string>? seats)
        => seats is { Count: > 0 } ? JsonSerializer.Serialize(seats) : null;

    private static List<string> DeserializeSeats(string? json)
        => string.IsNullOrEmpty(json)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();

    private static void ValidateFlightRequest(
        int stops, string source, string destination,
        DateTime departureTime, DateTime arrivalTime,
        string? layoverAirport, int? layoverDurationMinutes)
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
