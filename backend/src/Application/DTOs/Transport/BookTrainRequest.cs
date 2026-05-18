namespace TravelPort.Application.DTOs.Transport;

public record BookTrainRequest(
    string TrainId,
    string TrainNumber,
    string TrainName,
    string Class,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    decimal Price,
    int Passengers = 1,
    string? CouponCode = null,
    bool UseWallet = false,
    Guid? SavedCardId = null,
    string? GuestName = null,
    string? GuestEmail = null,
    string? GuestPhone = null
);
