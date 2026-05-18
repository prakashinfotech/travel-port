using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Infrastructure.ExternalProviders.Transport;

public class BusSearchProvider : IBusSearchProvider
{
    private static readonly string[] AcOperators =
        ["VRL Travels", "Orange Travels", "IntrCity SmartBus", "Neeta Travels", "SRS Travels", "Greenline Travels", "Chartered Bus"];

    private static readonly string[] NonAcOperators =
        ["MSRTC", "KSRTC", "GSRTC", "TSRTC", "APSRTC", "Patel Travels", "AbhiBus Express"];

    private static readonly Dictionary<string, string[]> CityBoardingPoints = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Mumbai"]    = ["Dadar", "Andheri East", "Borivali", "Thane Naka", "Vashi"],
        ["Pune"]      = ["Swargate", "Shivajinagar", "Hadapsar", "Kothrud D.P. Road", "Wakad"],
        ["Delhi"]     = ["Kashmere Gate ISBT", "Dhaula Kuan", "Anand Vihar ISBT", "Sarai Kale Khan"],
        ["Bangalore"] = ["Majestic KSRTC", "Hebbal", "Silk Board", "Electronic City", "Marathahalli"],
        ["Chennai"]   = ["CMBT Koyambedu", "Tambaram", "Vadapalani", "Guindy"],
        ["Hyderabad"] = ["Mahatma Gandhi Bus Station", "LB Nagar", "Secunderabad", "Uppal"],
        ["Ahmedabad"] = ["Paldi Bus Stand", "Naroda", "Isanpur", "Vastral"],
        ["Goa"]       = ["Mapusa Bus Stand", "Panaji", "Margao KTC"],
        ["Jaipur"]    = ["Sindhi Camp", "Narayan Singh Circle", "Durgapura"],
        ["Kolkata"]   = ["Esplanade", "Howrah", "Dhakuria", "Salt Lake Sector V"],
    };

    private static readonly Dictionary<string, string[]> CityDroppingPoints = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Mumbai"]    = ["Dadar TT", "Andheri West", "Borivali West", "Thane Station", "Belapur"],
        ["Pune"]      = ["Swargate", "Shivajinagar", "Hinjewadi Phase 1", "Baner Road", "Pimpri"],
        ["Delhi"]     = ["Kashmere Gate", "Majnu Ka Tila", "Shahdara", "AIIMS Metro"],
        ["Bangalore"] = ["Majestic", "Banashankari", "BTM Layout", "HSR Layout", "Whitefield"],
        ["Chennai"]   = ["CMBT", "Chennai Central", "T Nagar", "Omandur"],
        ["Hyderabad"] = ["MGBS", "Dilsukhnagar", "Miyapur", "Kukatpally"],
        ["Ahmedabad"] = ["Geeta Mandir", "Narol", "SP Ring Road", "Chandkheda"],
        ["Goa"]       = ["Panaji", "Margao", "Calangute", "Candolim"],
        ["Jaipur"]    = ["Sindhi Camp", "Civil Lines", "Sitapura"],
        ["Kolkata"]   = ["Esplanade", "Tollygunge", "New Town", "Rajarhat"],
    };

    private static readonly string[] AcBusTypes =
        ["Volvo A/C Sleeper", "Scania A/C Multi-Axle", "A/C Seater/Sleeper", "A/C Semi-Sleeper", "Mercedes A/C Multi-Axle"];

    private static readonly string[] NonAcBusTypes =
        ["Non-A/C Sleeper", "Non-A/C Seater", "Government Express", "Ordinary Express"];

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

    private static readonly Dictionary<(string, string), string> RouteStops = new()
    {
        [("Mumbai",    "Pune")]        = "Khopoli · Lonavala",
        [("Pune",      "Mumbai")]      = "Lonavala · Khopoli",
        [("Mumbai",    "Goa")]         = "Ratnagiri · Chiplun · Sawantwadi",
        [("Goa",       "Mumbai")]      = "Sawantwadi · Chiplun · Ratnagiri",
        [("Mumbai",    "Ahmedabad")]   = "Surat · Vadodara",
        [("Ahmedabad", "Mumbai")]      = "Vadodara · Surat",
        [("Delhi",     "Jaipur")]      = "Gurgaon · Behror",
        [("Jaipur",    "Delhi")]       = "Behror · Gurgaon",
        [("Delhi",     "Agra")]        = "Mathura",
        [("Agra",      "Delhi")]       = "Mathura",
        [("Delhi",     "Lucknow")]     = "Kanpur",
        [("Lucknow",   "Delhi")]       = "Kanpur",
        [("Bangalore", "Hyderabad")]   = "Kurnool · Yadgir",
        [("Hyderabad", "Bangalore")]   = "Yadgir · Kurnool",
        [("Bangalore", "Chennai")]     = "Vellore · Krishnagiri",
        [("Chennai",   "Bangalore")]   = "Krishnagiri · Vellore",
        [("Hyderabad", "Chennai")]     = "Tirupati · Nellore",
        [("Chennai",   "Hyderabad")]   = "Nellore · Tirupati",
        [("Bangalore", "Goa")]         = "Hubli · Dharwad",
        [("Goa",       "Bangalore")]   = "Dharwad · Hubli",
    };

    private static string? GetRouteStops(string origin, string destination)
        => RouteStops.TryGetValue((origin, destination), out var s) ? s : null;

    private static int GetRouteDuration(string origin, string destination, Random rng)
    {
        if (RouteDurations.TryGetValue((origin, destination), out var d))
            return d + rng.Next(-20, 30);
        return rng.Next(3 * 60, 14 * 60);
    }

    private static string GenerateBusNumber(Random rng)
    {
        var district = rng.Next(1, 32);
        var letters  = "ABCDEFGHJKLMNPQRSTUVWXY";
        var l1 = letters[rng.Next(letters.Length)];
        var l2 = letters[rng.Next(letters.Length)];
        var num = rng.Next(1000, 9999);
        return $"MH {district:D2} {l1}{l2} {num}";
    }

    private static string GenerateDriverPhone(Random rng)
    {
        var prefix = new[] { 98, 97, 96, 95, 94, 93, 90, 87, 77 };
        return $"+91 {prefix[rng.Next(prefix.Length)]}{rng.Next(10000000, 99999999)}";
    }

    private static string GetBoardingPoints(string city, Random rng)
    {
        if (!CityBoardingPoints.TryGetValue(city, out var pts)) return city;
        var picked = pts.OrderBy(_ => rng.Next()).Take(3).ToArray();
        return string.Join(", ", picked);
    }

    private static string GetDroppingPoints(string city, Random rng)
    {
        if (!CityDroppingPoints.TryGetValue(city, out var pts)) return city;
        var picked = pts.OrderBy(_ => rng.Next()).Take(3).ToArray();
        return string.Join(", ", picked);
    }

    public (List<BusDto> Items, int Total) Search(BusSearchRequest req)
    {
        var seed  = HashCode.Combine(req.Origin, req.Destination, req.TravelDate.DayOfYear, req.TravelDate.Year);
        var rng   = new Random(seed);
        var count = rng.Next(10, 22);
        var buses = new List<BusDto>(count);
        var stops = GetRouteStops(req.Origin, req.Destination);
        var isToday = req.TravelDate.Date == DateTime.Today;
        var cutoff  = DateTime.Now.AddMinutes(30);

        for (int i = 0; i < count; i++)
        {
            var isAc    = rng.Next(3) != 0;
            var hour    = rng.Next(5, 23);
            var dur     = GetRouteDuration(req.Origin, req.Destination, rng);
            var dep     = req.TravelDate.Date.AddHours(hour).AddMinutes(rng.Next(0, 4) * 15);
            var arr     = dep.AddMinutes(dur);
            var seats   = rng.Next(req.Seats, 42);
            var busNum  = GenerateBusNumber(rng);
            var drvPhone= GenerateDriverPhone(rng);
            var boarding= GetBoardingPoints(req.Origin, rng);
            var dropping= GetDroppingPoints(req.Destination, rng);

            if (isToday && dep < cutoff) continue;

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
                Id:                $"BUS_{req.Origin}_{req.Destination}_{i}_{req.TravelDate:yyyyMMdd}",
                Operator:          op,
                BusType:           busType,
                Origin:            req.Origin,
                Destination:       req.Destination,
                DepartureTime:     dep,
                ArrivalTime:       arr,
                DurationMinutes:   dur,
                AvailableSeats:    seats,
                Price:             price,
                AcAvailable:       isAc,
                IsRefundable:      rng.Next(3) != 0,
                Amenities:         amenities,
                Rating:            (decimal)rating,
                IntermediateStops: stops,
                BusNumber:         busNum,
                DriverPhone:       drvPhone,
                BoardingPoints:    boarding,
                DroppingPoints:    dropping,
                TotalSeats:        40
            ));
        }

        buses = [.. buses.OrderBy(b => b.Price)];
        var total = buses.Count;
        var paged = buses.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }
}
