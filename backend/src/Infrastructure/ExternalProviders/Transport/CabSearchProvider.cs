using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Infrastructure.ExternalProviders.Transport;

public class CabSearchProvider : ICabSearchProvider
{
    private static readonly (string Provider, string Type, string Model, int Cap, decimal Base, decimal PerKm, string Phone)[] CabOptions =
    [
        ("Ola",  "Mini",  "Maruti Swift",     4, 80,  11, "+91 80 6731 6060"),
        ("Uber", "Mini",  "WagonR",           4, 85,  11, "+91 22 6618 0000"),
        ("Ola",  "Sedan", "Honda City",       4, 110, 13, "+91 80 6731 6060"),
        ("Uber", "Sedan", "Hyundai Verna",    4, 115, 13, "+91 22 6618 0000"),
        ("Ola",  "Prime", "Toyota Etios",     4, 130, 15, "+91 80 6731 6060"),
        ("Uber", "Prime", "Maruti Ciaz",      4, 135, 15, "+91 22 6618 0000"),
        ("Ola",  "SUV",   "Ertiga",           6, 150, 17, "+91 80 6731 6060"),
        ("Uber", "SUV",   "Toyota Innova",    6, 180, 18, "+91 22 6618 0000"),
        ("Meru", "Sedan", "Hyundai Verna",    4, 120, 14, "+91 44 4422 4422"),
        ("Meru", "SUV",   "Toyota Innova",    6, 185, 19, "+91 44 4422 4422"),
        ("Zoom", "Mini",  "Alto",             4, 70,  10, "+91 80 6750 0000"),
        ("Zoom", "SUV",   "Scorpio",          6, 170, 18, "+91 80 6750 0000"),
    ];

    private static readonly Dictionary<(string, string), double> RouteDistances = new()
    {
        [("Mumbai", "Pune")]            = 148,
        [("Delhi", "Agra")]             = 206,
        [("Bangalore", "Mysore")]       = 144,
        [("Hyderabad", "Vijayawada")]   = 270,
        [("Chennai", "Pondicherry")]    = 154,
        [("Jaipur", "Jodhpur")]         = 332,
        [("Ahmedabad", "Surat")]        = 266,
        [("Kolkata", "Digha")]          = 185,
    };

    public (List<CabDto> Items, int Total) Search(CabSearchRequest req)
    {
        var seed = HashCode.Combine(req.Origin, req.Destination, req.PickupDateTime.DayOfYear);
        var rng  = new Random(seed);

        var isToday = req.PickupDateTime.Date == DateTime.Today;
        var cutoff  = DateTime.Now.AddMinutes(30);

        // Filter if pickup is in the past or too soon
        if (isToday && req.PickupDateTime < cutoff)
            return ([], 0);

        var distKey = (req.Origin, req.Destination);
        var dist    = RouteDistances.TryGetValue(distKey, out var d) ? d : rng.Next(50, 500);
        var cabs    = new List<CabDto>();

        foreach (var (prov, type, model, cap, basePrice, perKm, phone) in CabOptions)
        {
            var totalPrice  = basePrice + (decimal)(dist * (double)perKm) + rng.Next(-200, 300);
            if (totalPrice < basePrice) totalPrice = basePrice;
            var duration    = (int)(dist / 60 * 60 + rng.Next(10, 30));
            var driverRating= Math.Round(3.8m + (decimal)rng.NextDouble() * 1.1m, 1);

            cabs.Add(new CabDto(
                Id:                      $"CAB_{prov}_{type}_{req.PickupDateTime:yyyyMMdd}_{cabs.Count}",
                Provider:                prov,
                CabType:                 type,
                CarModel:                model,
                Capacity:                cap,
                Price:                   Math.Round(totalPrice, 0),
                PricePerKm:              perKm,
                EstimatedDurationMinutes:duration,
                EstimatedDistanceKm:     Math.Round(dist, 1),
                AcAvailable:             true,
                DriverIncluded:          true,
                CancellationPolicy:      "Free cancellation up to 1 hour before pickup",
                ImageUrl:                null,
                CompanyPhone:            phone,
                DriverRating:            driverRating,
                TollsIncluded:           false
            ));
        }

        cabs = [.. cabs.OrderBy(c => c.Price)];
        var total = cabs.Count;
        var paged = cabs.Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToList();
        return (paged, total);
    }
}
