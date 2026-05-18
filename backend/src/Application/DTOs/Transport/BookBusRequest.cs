namespace TravelPort.Application.DTOs.Transport;

public record BookBusRequest(
    string BusId,
    string Operator,
    string BusType,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    decimal Price,
    string Amenities,
    int Seats = 1,
    string? CouponCode = null,
    bool UseWallet = false,
    Guid? SavedCardId = null,
    string? GuestName = null,
    string? GuestEmail = null,
    string? GuestPhone = null
);
