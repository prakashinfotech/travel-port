namespace TravelPort.Application.DTOs.Flights;

public record FlightDto(
    Guid Id,
    string FlightNumber,
    string Airline,
    string AirlineCode,
    string Origin,
    string OriginCity,
    string Destination,
    string DestinationCity,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    int AvailableSeats,
    decimal Price,
    decimal? BusinessPrice,
    string CabinClass,
    int Stops,
    bool IsRefundable,
    bool BaggageIncluded,
    int? CheckedBags,
    string? Aircraft,
    string? ExternalOfferId
);
