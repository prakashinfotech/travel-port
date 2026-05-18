namespace TravelPort.Application.DTOs.Transport;

public record TransportSnapshot(
    string OperatorName,
    string VehicleType,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    string? Amenities = null,
    string? CarModel = null,
    double? DistanceKm = null,
    string? VehicleClass = null
);
