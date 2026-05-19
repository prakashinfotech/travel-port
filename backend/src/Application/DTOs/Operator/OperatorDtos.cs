namespace TravelPort.Application.DTOs.Operator;

// ── Registration requests ──────────────────────────────────────────────────

public record RegisterFlightOperatorRequest(
    string CompanyName,
    string IataCode,
    string? LogoUrl,
    string? HeadquartersCity,
    string? ContactPhone,
    string ManagerEmail,
    string ManagerPassword,
    string ManagerName
);

public record RegisterBusOperatorRequest(
    string CompanyName,
    string? HeadquartersCity,
    string? ContactPhone,
    string? BusTypes,
    string ManagerEmail,
    string ManagerPassword,
    string ManagerName
);

public record RegisterCabOperatorRequest(
    string CompanyName,
    string? City,
    string? ContactPhone,
    string? CabTypes,
    bool IsIndividualDriver,
    string? DriverLicenseNumber,
    string ManagerEmail,
    string ManagerPassword,
    string ManagerName
);

// ── List / detail DTOs ─────────────────────────────────────────────────────

public record FlightOperatorListDto(
    Guid Id,
    string Name,
    string IataCode,
    string? LogoUrl,
    string? HeadquartersCity,
    string? ContactPhone,
    bool IsActive,
    int FlightCount,
    string? ManagerEmail,
    DateTime CreatedAt
);

public record BusOperatorListDto(
    Guid Id,
    string Name,
    string? HeadquartersCity,
    string? ContactPhone,
    string? BusTypes,
    bool IsActive,
    string? ManagerEmail,
    DateTime CreatedAt
);

public record CabOperatorListDto(
    Guid Id,
    string Name,
    string? City,
    string? ContactPhone,
    string? CabTypes,
    bool IsIndividualDriver,
    bool IsActive,
    string? ManagerEmail,
    DateTime CreatedAt
);

// ── Operator dashboard DTOs ────────────────────────────────────────────────

public record FlightOperatorDashboardDto(
    int TotalFlights,
    int ActiveFlights,
    int TotalBookings,
    int ConfirmedBookings,
    int CancelledBookings,
    decimal TotalRevenue,
    int TotalPassengers
);

public record BusOperatorDashboardDto(
    string CompanyName,
    int TotalBookings,
    int ConfirmedBookings,
    int CancelledBookings,
    decimal TotalRevenue,
    int TotalPassengers
);

public record CabOperatorDashboardDto(
    string CompanyName,
    bool IsIndividualDriver,
    int TotalBookings,
    int ConfirmedBookings,
    int CancelledBookings,
    decimal TotalRevenue,
    int TotalPassengers
);

// ── Flight management DTOs ─────────────────────────────────────────────────

public record CreateFlightRequest(
    string FlightNumber,
    string Source,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int TotalSeats,
    decimal EconomyPrice,
    decimal? BusinessPrice,
    int Stops
);

public record UpdateFlightRequest(
    string? FlightNumber,
    string? Source,
    string? Destination,
    DateTime? DepartureTime,
    DateTime? ArrivalTime,
    int? TotalSeats,
    decimal? EconomyPrice,
    decimal? BusinessPrice,
    int? Stops,
    bool? IsActive
);

public record OperatorFlightDto(
    Guid Id,
    string FlightNumber,
    string Source,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int Duration,
    int TotalSeats,
    int AvailableSeats,
    decimal EconomyPrice,
    decimal? BusinessPrice,
    int Stops,
    bool IsActive,
    DateTime CreatedAt
);

public record OperatorBookingDto(
    Guid Id,
    string BookingRef,
    string PassengerName,
    string PassengerEmail,
    string? PassengerPhone,
    int Passengers,
    string CabinClass,
    decimal Amount,
    string Status,
    DateTime BookedAt
);
