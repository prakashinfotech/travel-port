namespace TravelPort.Application.DTOs.Flights;

public record FlightDto(
    Guid Id,
    string FlightNumber,
    string Airline,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    int AvailableSeats,
    decimal Price,
    string CabinClass
);
