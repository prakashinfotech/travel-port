namespace TravelPort.Application.DTOs.Transport;

public record CabSearchRequest(
    string Origin,
    string Destination,
    DateTime PickupDateTime,
    string TripType = "OneWay",
    int Page = 1,
    int PageSize = 20
);

public record CabDto(
    string Id,
    string Provider,
    string CabType,
    string CarModel,
    int Capacity,
    decimal Price,
    decimal PricePerKm,
    int EstimatedDurationMinutes,
    double EstimatedDistanceKm,
    bool AcAvailable,
    bool DriverIncluded,
    string CancellationPolicy,
    string? ImageUrl
);
