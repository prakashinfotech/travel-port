namespace TravelPort.Application.DTOs.Flights;

public record FlightSearchRequest(
    string Origin,
    string Destination,
    DateTime DepartureDate,
    int Passengers = 1,
    string CabinClass = "Economy",
    string SortBy = "price",      // price | duration | departure | arrival
    int? MaxPrice = null,
    int? MaxStops = null,         // 0=non-stop, 1=1-stop, null=any
    string? Airlines = null,      // comma-separated IATA codes e.g. "6E,AI"
    int Page = 1,
    int PageSize = 20
);
