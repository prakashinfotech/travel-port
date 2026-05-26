using TravelPort.Domain.Common;

namespace TravelPort.Domain.Entities;

public class Bus : BaseEntity
{
    public string BusNumber { get; set; } = string.Empty;
    public Guid BusCompanyId { get; set; }
    public BusCompany? BusCompany { get; set; }

    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int DurationMinutes { get; set; }

    public int TotalSeats { get; set; } = 40;
    public int AvailableSeats { get; set; } = 40;
    public decimal Price { get; set; }

    // Bus type: Sleeper, Semi-Sleeper, Seater, AC Seater, Volvo AC
    public string BusType { get; set; } = "AC Seater";

    // Seat layout: "2-2" (seater), "2-1" (sleeper), "1-1" (luxury)
    public string SeatLayoutConfig { get; set; } = "2-2";
    public int SeatRows { get; set; } = 10;

    // JSON array of ladies-only seat IDs e.g. ["1A","1B"]
    public string? LadiesSeats { get; set; }

    // JSON array of amenities e.g. ["WiFi","Charging Point","Blanket","Water Bottle"]
    public string? Amenities { get; set; }

    // Driver / staff
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? DriverLicense { get; set; }
    public string? StaffDetails { get; set; }  // JSON

    // Bus photo URL
    public string? PhotoUrl { get; set; }

    // Schedule
    public string ScheduleType { get; set; } = "OneTime";  // OneTime | Daily | Weekly
    public string? DaysOfWeek { get; set; }  // JSON array e.g. ["Monday","Wednesday"] for Weekly

    // Boarding / dropping points (comma-separated)
    public string? BoardingPoints { get; set; }
    public string? DroppingPoints { get; set; }

    public bool IsActive { get; set; } = true;
}
