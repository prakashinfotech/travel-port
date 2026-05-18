namespace TravelPort.Application.DTOs.Transport;

public record TrainSearchRequest(
    string Origin,
    string Destination,
    DateTime TravelDate,
    string Class = "SL",
    int Passengers = 1,
    int Page = 1,
    int PageSize = 20
);

public record TrainClassDto(
    string ClassName,
    int AvailableSeats,
    decimal Price,
    string Availability
);

public record TrainDto(
    string Id,
    string TrainNumber,
    string TrainName,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    Dictionary<string, TrainClassDto> Classes,
    bool RunsOnDate,
    string RunningDays,
    int AvailableSeats,
    bool IsTatkal
);
