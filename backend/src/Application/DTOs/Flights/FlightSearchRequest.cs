namespace TravelPort.Application.DTOs.Flights;

public record FlightSearchRequest(
    string Origin,
    string Destination,
    DateTime DepartureDate,
    int Passengers = 1,
    string CabinClass = "Economy",
    string SortBy = "price",
    int Page = 1,
    int PageSize = 10
);
