namespace TravelPort.Application.DTOs.Admin;

public record AdminFlightDto(
    Guid Id,
    string FlightNumber,
    string Airline,
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

public record AdminUpdateFlightRequest(
    decimal? EconomyPrice,
    decimal? BusinessPrice,
    int? TotalSeats,
    int? AvailableSeats,
    DateTime? DepartureTime,
    DateTime? ArrivalTime,
    bool? IsActive
);
