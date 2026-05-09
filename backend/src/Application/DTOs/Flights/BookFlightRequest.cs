namespace TravelPort.Application.DTOs.Flights;

public record BookFlightRequest(
    Guid FlightId,
    int Passengers,
    string CabinClass = "Economy",
    string? CouponCode = null
);
