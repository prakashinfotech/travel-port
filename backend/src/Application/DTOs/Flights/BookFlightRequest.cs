namespace TravelPort.Application.DTOs.Flights;

public record BookFlightRequest(
    Guid FlightId,
    int Passengers,
    string CabinClass = "Economy",
    string? CouponCode = null,
    bool UseWallet = false,
    Guid? SavedCardId = null,
    string? GuestName = null,
    string? GuestEmail = null,
    string? GuestPhone = null,
    List<string>? SeatNumbers = null
);
