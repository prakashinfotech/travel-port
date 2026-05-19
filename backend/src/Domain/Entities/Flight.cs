using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Flight : BaseEntity
{
    public string Airline { get; set; } = string.Empty;
    public string FlightNumber { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int Duration { get; set; }
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
    public decimal EconomyPrice { get; set; }
    public decimal? BusinessPrice { get; set; }
    public int Stops { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public Guid? FlightCompanyId { get; set; }
    public FlightCompany? FlightCompany { get; set; }
}
