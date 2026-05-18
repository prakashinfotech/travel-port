namespace TravelPort.Application.DTOs.Transport;

public record BusSearchRequest(
    string Origin,
    string Destination,
    DateTime TravelDate,
    int Seats = 1,
    int Page = 1,
    int PageSize = 20
);

public record BusDto(
    string Id,
    string Operator,
    string BusType,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    int AvailableSeats,
    decimal Price,
    bool AcAvailable,
    bool IsRefundable,
    string Amenities,
    decimal Rating,
    string? IntermediateStops = null,
    string? BusNumber = null,
    string? DriverPhone = null,
    string? BoardingPoints = null,
    string? DroppingPoints = null,
    int TotalSeats = 40
);
