namespace TravelPort.Infrastructure.ExternalProviders.Transport;

public record BusSearchRequest(
    string Origin,
    string Destination,
    DateTime TravelDate,
    int Seats = 1,
    int Page = 1,
    int PageSize = 20
);

public record BusDto(
    string Id,
    string Operator,
    string BusType,
    string Origin,
    string Destination,
    DateTime DepartureTime,
    DateTime ArrivalTime,
    int DurationMinutes,
    int AvailableSeats,
    decimal Price,
    bool AcAvailable,
    bool IsRefundable,
    string Amenities,
    decimal Rating
);

public class BusSearchProvider
{
    private static readonly string[] AcOperators =
        ["VRL Travels", "Orange Travels", "IntrCity SmartBus", "Neeta Travels", "SRS Travels", "Greenline Travels", "Chartered Bus"];

    private static readonly string[] NonAcOperators =
        ["MSRTC", "KSRTC", "GSRTC", "TSRTC", "APSRTC", "Patel Travels", "AbhiBus Express"];

    private static readonly string[] AcBusTypes =
        ["Volvo A/C Sleeper", "Scania A/C Multi-Axle", "A/C Seater/Sleeper", "A/C Semi-Sleeper", "Mercedes A/C Multi-Axle"];

    private static readonly string[] NonAcBusTypes =
        ["Non-A/C Sleeper", "Non-A/C Seater", "Government Express", "Ordinary Express"];

    // Route-specific approximate durations in minutes
    private static readonly Dictionary<(string, string), int> RouteDurations = new()
    {
        [("Mumbai",    "Pune")]        = 200,
        [("Pune",      "Mumbai")]      = 200,
        [("Mumbai",    "Goa")]         = 720,
        [("Goa",       "Mumbai")]      = 720,
        [("Mumbai",    "Ahmedabad")]   = 420,
        [("Ahmedabad", "Mumbai")]      = 420,
        [("Mumbai",    "Surat")]       = 240,
        [("Surat",     "Mumbai")]      = 240,
        [("Delhi",     "Jaipur")]      = 270,
        [("Jaipur",    "Delhi")]       = 270,
        [("Delhi",     "Agra")]        = 210,
        [("Agra",      "Delhi")]       = 210,
        [("Delhi",     "Chandigarh")]  = 240,
        [("Chandigarh","Delhi")]       = 240,
        [("Delhi",     "Lucknow")]     = 360,
        [("Lucknow",   "Delhi")]       = 360,
        [("Bangalore", "Hyderabad")]   = 570,
        [("Hyderabad", "Bangalore")]   = 570,
        [("Bangalore", "Chennai")]     = 360,
        [("Chennai",   "Bangalore")]   = 360,
        [("Bangalore", "Goa")]         = 600,
        [("Goa",       "Bangalore")]   = 600,
        [("Hyderabad", "Chennai")]     = 480,
        [("Chennai",   "Hyderabad")]   = 480,
        [("Kolkata",   "Bhubaneswar")] = 390,
        [("Bhubaneswar","Kolkata")]    = 390,
    };

    private static int GetRouteDuration(string origin, string destination, Random rng)
    {
        if (RouteDurations.TryGetValue((origin, destination), out var d))
            return d + rng.Next(-20, 30);
        return rng.Next(3 * 60, 14 * 60);
    }

    public (List<BusDto> Items, int Total) Search(BusSearchRequest req)
    {
        var seed  = HashCode.Combine(req.Origin, req.Destination, req.TravelDate.DayOfYear, req.TravelDate.Year);
        var rng   = new Random(seed);
        var count = rng.Next(10, 22);
        var buses = new List<BusDto>(count);

        for (int i = 0; i < count; i++)
        {
            var isAc    = rng.Next(3) != 0; // 2/3 chance AC
            var hour    = rng.Next(5, 23);
            var dur     = GetRouteDuration(req.Origin, req.Destination, rng);
            var dep     = req.TravelDate.Date.AddHours(hour).AddMinutes(rng.Next(0, 4) * 15);
            var arr     = dep.AddMinutes(dur);
            var seats   = rng.Next(req.Seats, 42);

            string op, busType, amenities;
            decimal price;
            if (isAc)
            {
                op       = AcOperators[rng.Next(AcOperators.Length)];
                busType  = AcBusTypes[rng.Next(AcBusTypes.Length)];
                amenities= rng.Next(2) == 0
                    ? "WiFi, Blanket, Charging, Water, Snacks"
                    : "WiFi, Charging, Water, Entertainment Screen";
                price    = Math.Round(rng.Next(600, 2800) + dur * 0.5m, 0);
            }
            else
            {
                op       = NonAcOperators[rng.Next(NonAcOperators.Length)];
                busType  = NonAcBusTypes[rng.Next(NonAcBusTypes.Length)];
                amenities= "Charging Port, Water";
                price    = Math.Round(rng.Next(200, 900) + dur * 0.2m, 0);
            }

            var rating = Math.Round(3.2m + (decimal)rng.NextDouble() * 1.6m, 1);

            buses.Add(new BusDto(
                Id:              $"BUS_{req.Origin}_{req.Destination}_{i}_{req.TravelDate:yyyyMMdd}",
                Operator:        op,
                BusType:         busType,
                Origin:          req.Origin,
                Destination:     req.Destination,
                DepartureTime:   dep,
                ArrivalTime:     arr,
                DurationMinutes: dur,
                AvailableSeats:  seats,
                Price:           price,
                AcAvailable:     isAc,
                IsRefundable:    rng.Next(3) != 0,
                Amenities:       amenities,
                Rating:          (decimal)rating
            ));
        }

        buses = [.. buses.OrderBy(b => b.Price)];
        var total = buses.Count;
        var paged = buses.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }
}
