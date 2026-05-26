using System.Text.Json;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class BusOperatorService : IBusOperatorService
{
    private readonly IBusRepository _buses;
    private readonly IBusCompanyRepository _companies;
    private readonly IBookingRepository _bookings;
    private readonly IUserRepository _users;
    private readonly IWalletService _wallet;
    private readonly IEmailService _email;
    private readonly IUnitOfWork _uow;

    public BusOperatorService(
        IBusRepository buses,
        IBusCompanyRepository companies,
        IBookingRepository bookings,
        IUserRepository users,
        IWalletService wallet,
        IEmailService email,
        IUnitOfWork uow)
    {
        _buses     = buses;
        _companies = companies;
        _bookings  = bookings;
        _users     = users;
        _wallet    = wallet;
        _email     = email;
        _uow       = uow;
    }

    public async Task<BusOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default)
    {
        var company  = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("BusCompany", companyId);

        var myBuses   = await _buses.GetByCompanyAsync(companyId, ct);
        var busIds    = myBuses.Select(b => b.Id).ToList();
        var bookings  = busIds.Count > 0
            ? await _bookings.GetBookingsByBusIdsAsync(busIds, ct)
            : Array.Empty<Booking>();

        var confirmed  = bookings.Count(b => b.Status == BookingStatus.Confirmed);
        var cancelled  = bookings.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue    = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var passengers = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.Passengers ?? 0);

        return new BusOperatorDashboardDto(
            company.Name,
            myBuses.Count,
            myBuses.Count(b => b.IsActive),
            bookings.Count,
            confirmed,
            cancelled,
            revenue,
            passengers
        );
    }

    // ── Bus CRUD ──────────────────────────────────────────────────────────────

    public async Task<List<OperatorBusDto>> GetBusesAsync(Guid companyId, CancellationToken ct = default)
    {
        var buses = await _buses.GetByCompanyAsync(companyId, ct);
        return buses.Select(ToBusDto).ToList();
    }

    public async Task<OperatorBusDto> AddBusAsync(Guid companyId, CreateBusRequest req, CancellationToken ct = default)
    {
        var company = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("BusCompany", companyId);

        ValidateBusRequest(req.Origin, req.Destination, req.DepartureTime, req.ArrivalTime, req.ScheduleType);

        var duration = (int)(req.ArrivalTime - req.DepartureTime).TotalMinutes;
        var bus = new Bus
        {
            Id             = Guid.NewGuid(),
            BusNumber      = req.BusNumber.Trim().ToUpper(),
            BusCompanyId   = companyId,
            Origin         = req.Origin.Trim(),
            Destination    = req.Destination.Trim(),
            DepartureTime  = req.DepartureTime,
            ArrivalTime    = req.ArrivalTime,
            DurationMinutes = duration,
            TotalSeats     = req.TotalSeats,
            AvailableSeats = req.TotalSeats,
            Price          = req.Price,
            BusType        = req.BusType,
            SeatLayoutConfig = req.SeatLayoutConfig,
            SeatRows       = req.SeatRows > 0 ? req.SeatRows : 10,
            LadiesSeats    = SerializeList(req.LadiesSeats),
            Amenities      = SerializeList(req.Amenities),
            DriverName     = req.DriverName,
            DriverPhone    = req.DriverPhone,
            DriverLicense  = req.DriverLicense,
            PhotoUrl       = req.PhotoUrl,
            ScheduleType   = req.ScheduleType,
            DaysOfWeek     = SerializeList(req.DaysOfWeek),
            BoardingPoints = req.BoardingPoints,
            DroppingPoints = req.DroppingPoints,
            IsActive       = true,
        };

        await _buses.AddAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);
        return ToBusDto(bus);
    }

    public async Task<OperatorBusDto> UpdateBusAsync(Guid companyId, Guid busId, UpdateBusRequest req, CancellationToken ct = default)
    {
        var bus = await _buses.GetByIdAsync(busId, ct)
            ?? throw new NotFoundException("Bus", busId);

        if (bus.BusCompanyId != companyId)
            throw new BusinessException("You do not own this bus.");

        if (req.BusNumber      != null) bus.BusNumber      = req.BusNumber.Trim().ToUpper();
        if (req.Origin         != null) bus.Origin         = req.Origin.Trim();
        if (req.Destination    != null) bus.Destination    = req.Destination.Trim();
        if (req.DepartureTime  != null) bus.DepartureTime  = req.DepartureTime.Value;
        if (req.ArrivalTime    != null) bus.ArrivalTime    = req.ArrivalTime.Value;
        if (req.TotalSeats     != null) bus.TotalSeats     = req.TotalSeats.Value;
        if (req.Price          != null) bus.Price          = req.Price.Value;
        if (req.BusType        != null) bus.BusType        = req.BusType;
        if (req.SeatLayoutConfig != null) bus.SeatLayoutConfig = req.SeatLayoutConfig;
        if (req.SeatRows       != null) bus.SeatRows       = req.SeatRows.Value;
        if (req.LadiesSeats    != null) bus.LadiesSeats    = SerializeList(req.LadiesSeats);
        if (req.Amenities      != null) bus.Amenities      = SerializeList(req.Amenities);
        if (req.DriverName     != null) bus.DriverName     = req.DriverName;
        if (req.DriverPhone    != null) bus.DriverPhone    = req.DriverPhone;
        if (req.DriverLicense  != null) bus.DriverLicense  = req.DriverLicense;
        if (req.PhotoUrl       != null) bus.PhotoUrl       = req.PhotoUrl;
        if (req.ScheduleType   != null) bus.ScheduleType   = req.ScheduleType;
        if (req.DaysOfWeek     != null) bus.DaysOfWeek     = SerializeList(req.DaysOfWeek);
        if (req.BoardingPoints != null) bus.BoardingPoints = req.BoardingPoints;
        if (req.DroppingPoints != null) bus.DroppingPoints = req.DroppingPoints;
        if (req.IsActive       != null) bus.IsActive       = req.IsActive.Value;

        if (req.DepartureTime != null || req.ArrivalTime != null)
            bus.DurationMinutes = (int)(bus.ArrivalTime - bus.DepartureTime).TotalMinutes;

        ValidateBusRequest(bus.Origin, bus.Destination, bus.DepartureTime, bus.ArrivalTime, bus.ScheduleType);

        await _buses.UpdateAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);
        return ToBusDto(bus);
    }

    public async Task DeleteBusAsync(Guid companyId, Guid busId, CancellationToken ct = default)
    {
        var bus = await _buses.GetByIdAsync(busId, ct)
            ?? throw new NotFoundException("Bus", busId);

        if (bus.BusCompanyId != companyId)
            throw new BusinessException("You do not own this bus.");

        bus.IsActive  = false;
        bus.DeletedAt = DateTime.UtcNow;
        await _buses.UpdateAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);
    }

    // ── Bookings ───────────────────────────────────────────────────────────────

    public async Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default)
    {
        var myBuses = await _buses.GetByCompanyAsync(companyId, ct);
        var busIds  = myBuses.Select(b => b.Id).ToList();
        if (busIds.Count == 0) return new List<OperatorBookingDto>();

        var bookings = await _bookings.GetBookingsByBusIdsAsync(busIds, ct);
        return bookings.Select(ToBookingDto).ToList();
    }

    // ── Seat Layout ────────────────────────────────────────────────────────────

    public async Task<List<BusDateRouteDto>> GetBusesByDateAsync(Guid companyId, DateTime date, CancellationToken ct = default)
    {
        var all = await _buses.GetByCompanyAsync(companyId, ct);
        return all
            .Where(b => b.IsActive && MatchesSchedule(b, date))
            .Select(b => new BusDateRouteDto(
                b.Id, b.BusNumber, b.Origin, b.Destination,
                b.DepartureTime, b.ArrivalTime, b.AvailableSeats, b.TotalSeats))
            .ToList();
    }

    public async Task<BusSeatLayoutDto> GetSeatLayoutAsync(Guid companyId, Guid busId, CancellationToken ct = default)
    {
        var bus = await _buses.GetByIdAsync(busId, ct)
            ?? throw new NotFoundException("Bus", busId);

        if (bus.BusCompanyId != companyId)
            throw new BusinessException("You do not own this bus.");

        var bookings    = await _bookings.GetBookingsByBusIdsAsync(new[] { busId }, ct);
        var ladiesSeats = DeserializeList(bus.LadiesSeats);
        var layoutConfig = bus.SeatLayoutConfig ?? "2-2";
        var rows         = bus.SeatRows > 0 ? bus.SeatRows : 10;

        var active = bookings.Where(b => b.Status != BookingStatus.Cancelled).ToList();

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

        var unassignedBookings   = active.Where(b => string.IsNullOrEmpty(b.SeatNumbers)).ToList();
        var unassignedPassengers = unassignedBookings.Sum(b => b.Passengers ?? 1);

        var sections  = layoutConfig.Split('-').Select(int.Parse).ToArray();
        var totalCols = sections.Sum();

        if (unassignedPassengers > 0)
        {
            foreach (var b in unassignedBookings)
            {
                var name   = b.GuestName  ?? b.User?.Name  ?? "Guest";
                var email  = b.GuestEmail ?? b.User?.Email ?? "";
                var phone  = b.GuestPhone ?? b.User?.Phone ?? "";
                var pax    = b.Passengers ?? 1;
                var placed = 0;

                for (int row = 1; row <= rows && placed < pax; row++)
                {
                    for (int col = 0; col < totalCols && placed < pax; col++)
                    {
                        var seatId = $"{row}{(char)('A' + col)}";
                        if (!bookedMap.ContainsKey(seatId))
                        {
                            bookedMap[seatId] = (name, email, phone, b.BookingRef, b.Id);
                            placed++;
                        }
                    }
                }
            }
        }

        var allSeats = new List<SeatDto>();
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

        return new BusSeatLayoutDto(
            busId, bus.BusNumber, bus.Origin, bus.Destination,
            bus.DepartureTime, layoutConfig, rows, ladiesSeats, allSeats, unassignedPassengers);
    }

    public async Task<OperatorBusDto> UpdateSeatLayoutAsync(Guid companyId, Guid busId, BusSeatLayoutConfigRequest req, CancellationToken ct = default)
    {
        var bus = await _buses.GetByIdAsync(busId, ct)
            ?? throw new NotFoundException("Bus", busId);

        if (bus.BusCompanyId != companyId)
            throw new BusinessException("You do not own this bus.");

        var sections = req.LayoutConfig.Split('-');
        if (sections.Length < 1 || sections.Any(s => !int.TryParse(s, out var n) || n <= 0))
            throw new BusinessException("Invalid layout config. Use format like '2-2' or '2-1'.");

        bus.SeatLayoutConfig = req.LayoutConfig;
        bus.SeatRows         = req.SeatRows > 0 ? req.SeatRows : 10;
        bus.LadiesSeats      = SerializeList(req.LadiesSeats);

        await _buses.UpdateAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);
        return ToBusDto(bus);
    }

    public async Task<OperatorBookingDto> BulkBookSeatsAsync(
        Guid companyId, Guid busId, Guid managerId, BusBulkSeatBookingRequest req, CancellationToken ct = default)
    {
        var bus = await _buses.GetByIdAsync(busId, ct)
            ?? throw new NotFoundException("Bus", busId);

        if (bus.BusCompanyId != companyId)
            throw new BusinessException("You do not own this bus.");

        if (req.SeatNumbers == null || req.SeatNumbers.Count == 0)
            throw new BusinessException("At least one seat must be selected.");

        var existing = await _bookings.GetBookingsByBusIdsAsync(new[] { busId }, ct);
        var bookedSeats = new HashSet<string>();
        foreach (var b in existing.Where(b => b.Status != BookingStatus.Cancelled && !string.IsNullOrEmpty(b.SeatNumbers)))
        {
            var seats = JsonSerializer.Deserialize<List<string>>(b.SeatNumbers!) ?? new();
            foreach (var s in seats) bookedSeats.Add(s);
        }

        var conflicts = req.SeatNumbers.Where(s => bookedSeats.Contains(s)).ToList();
        if (conflicts.Count > 0)
            throw new BusinessException($"Seats already booked: {string.Join(", ", conflicts)}");

        if (bus.AvailableSeats < req.SeatNumbers.Count)
            throw new BusinessException($"Only {bus.AvailableSeats} seats available.");

        var passengerUser = await _users.GetByEmailAsync(req.PassengerEmail, ct);
        var userId        = passengerUser?.Id ?? managerId;

        var total      = bus.Price * req.SeatNumbers.Count;
        var bookingRef = await _bookings.GenerateBookingRefAsync("BU", ct);

        var company = await _companies.GetByIdAsync(companyId, ct);

        var booking = new Booking
        {
            Id          = Guid.NewGuid(),
            BookingRef  = bookingRef,
            UserId      = userId,
            BookingType = BookingType.Bus,
            ReferenceId = busId,
            Passengers  = req.SeatNumbers.Count,
            GuestName   = req.PassengerName,
            GuestEmail  = req.PassengerEmail,
            GuestPhone  = req.PassengerPhone,
            SeatNumbers = JsonSerializer.Serialize(req.SeatNumbers),
            TotalAmount = total,
            FinalAmount = total,
            Status      = BookingStatus.Confirmed,
        };

        bus.AvailableSeats -= req.SeatNumbers.Count;

        await _bookings.AddAsync(booking, ct);
        await _buses.UpdateAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);

        try
        {
            var depTime = bus.DepartureTime.ToString("dd MMM yyyy, hh:mm tt");
            var arrTime = bus.ArrivalTime.ToString("dd MMM yyyy, hh:mm tt");
            var dur     = $"{bus.DurationMinutes / 60}h {bus.DurationMinutes % 60}m";
            await _email.SendTransportBookingConfirmationAsync(
                req.PassengerEmail, req.PassengerName, bookingRef, "Bus",
                company?.Name ?? "Bus Operator", bus.BusType,
                bus.Origin, bus.Destination,
                depTime, arrTime, dur,
                req.SeatNumbers.Count, bus.Price, total, 0, null, total,
                seatNumbers: string.Join(", ", req.SeatNumbers),
                busNumber:   bus.BusNumber,
                driverPhone: bus.DriverPhone,
                ct: ct);
        }
        catch { /* email failure is non-fatal */ }

        return ToBookingDto(booking);
    }

    public async Task CancelSeatBookingAsync(Guid companyId, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException("Booking", bookingId);

        if (booking.BookingType != BookingType.Bus)
            throw new BusinessException("Only bus bookings can be cancelled from the seat map.");

        var myBuses = await _buses.GetByCompanyAsync(companyId, ct);
        if (!myBuses.Any(b => b.Id == booking.ReferenceId))
            throw new BusinessException("You do not own the bus for this booking.");

        if (booking.Status == BookingStatus.Cancelled)
            throw new BusinessException("Booking is already cancelled.");

        var refund = booking.FinalAmount * 0.90m;
        booking.Status      = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.RefundAmount = refund;

        var bus = myBuses.First(b => b.Id == booking.ReferenceId);
        var seatCount = string.IsNullOrEmpty(booking.SeatNumbers)
            ? (booking.Passengers ?? 1)
            : (JsonSerializer.Deserialize<List<string>>(booking.SeatNumbers)?.Count ?? 1);
        bus.AvailableSeats += seatCount;

        await _bookings.UpdateAsync(booking, ct);
        await _buses.UpdateAsync(bus, ct);
        await _uow.SaveChangesAsync(ct);

        if (refund > 0)
        {
            await _wallet.RefundAsync(booking.UserId, refund,
                $"Refund for cancelled booking {booking.BookingRef}", bookingId, ct);
            await _uow.SaveChangesAsync(ct);
        }

        try
        {
            var guestEmail = !string.IsNullOrWhiteSpace(booking.GuestEmail) ? booking.GuestEmail : "";
            var guestName  = !string.IsNullOrWhiteSpace(booking.GuestName)  ? booking.GuestName  : "Passenger";
            if (!string.IsNullOrWhiteSpace(guestEmail))
                await _email.SendBookingCancellationAsync(guestEmail, guestName, booking.BookingRef, "Bus", refund, ct);
        }
        catch { /* email failure is non-fatal */ }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static OperatorBusDto ToBusDto(Bus b) => new(
        b.Id, b.BusNumber, b.Origin, b.Destination,
        b.DepartureTime, b.ArrivalTime, b.DurationMinutes,
        b.TotalSeats, b.AvailableSeats, b.Price, b.BusType,
        b.SeatLayoutConfig, b.SeatRows > 0 ? b.SeatRows : 10,
        DeserializeList(b.LadiesSeats),
        DeserializeList(b.Amenities),
        b.DriverName, b.DriverPhone, b.DriverLicense, b.PhotoUrl,
        b.ScheduleType,
        DeserializeList(b.DaysOfWeek),
        b.BoardingPoints, b.DroppingPoints,
        b.IsActive, b.CreatedAt
    );

    private static OperatorBookingDto ToBookingDto(Booking b) => new(
        b.Id, b.BookingRef,
        b.GuestName  ?? b.User?.Name  ?? "Guest",
        b.GuestEmail ?? b.User?.Email ?? "",
        b.GuestPhone ?? b.User?.Phone,
        b.Passengers ?? 1,
        "Bus",
        b.FinalAmount,
        b.Status.ToString(),
        b.CreatedAt,
        string.IsNullOrEmpty(b.SeatNumbers) ? null : JsonSerializer.Deserialize<List<string>>(b.SeatNumbers),
        b.PaymentMethod
    );

    private static string? SerializeList(List<string>? items)
        => items is { Count: > 0 } ? JsonSerializer.Serialize(items) : null;

    private static List<string> DeserializeList(string? json)
        => string.IsNullOrEmpty(json)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();

    private static bool MatchesSchedule(Bus b, DateTime date) => b.ScheduleType switch
    {
        "Daily"   => true,
        "Weekly"  => DeserializeList(b.DaysOfWeek).Contains(date.DayOfWeek.ToString()),
        _         => b.DepartureTime.Date == date.Date,  // OneTime
    };

    private static void ValidateBusRequest(
        string origin, string destination,
        DateTime departureTime, DateTime arrivalTime,
        string scheduleType)
    {
        if (string.Equals(origin, destination, StringComparison.OrdinalIgnoreCase))
            throw new BusinessException("Origin and destination must be different.");

        if (arrivalTime <= departureTime)
            throw new BusinessException("Arrival time must be after departure time.");

        var validSchedules = new[] { "OneTime", "Daily", "Weekly" };
        if (!validSchedules.Contains(scheduleType))
            throw new BusinessException("Invalid schedule type. Use OneTime, Daily, or Weekly.");
    }
}
