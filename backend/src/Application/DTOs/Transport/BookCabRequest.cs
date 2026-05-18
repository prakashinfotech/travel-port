namespace TravelPort.Application.DTOs.Transport;

public record BookCabRequest(
    string CabId,
    string Provider,
    string CabType,
    string CarModel,
    string Origin,
    string Destination,
    DateTime PickupDateTime,
    int DurationMinutes,
    double DistanceKm,
    decimal Price,
    string? CouponCode = null,
    bool UseWallet = false,
    Guid? SavedCardId = null,
    string? GuestName = null,
    string? GuestEmail = null,
    string? GuestPhone = null,
    string? PickupAddress = null,
    string? CompanyPhone = null,
    decimal? DriverRating = null
);
