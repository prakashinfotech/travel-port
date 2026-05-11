namespace TravelPort.Infrastructure.ExternalProviders.Transport;

public record TrainSearchRequest(
    string Origin,
    string Destination,
    DateTime TravelDate,
    string Class = "SL",
    int Passengers = 1,
    int Page = 1,
    int PageSize = 20
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

public record TrainClassDto(
    string ClassName,
    int AvailableSeats,
    decimal Price,
    string Availability
);

public class TrainSearchProvider
{
    // Realistic named trains with typical numbers
    private static readonly (string Number, string Name, string[] Routes)[] TrainPool =
    [
        ("12951", "Mumbai Rajdhani Express",     ["BOM-DEL", "DEL-BOM"]),
        ("12952", "New Delhi Rajdhani Express",  ["DEL-BOM", "BOM-DEL"]),
        ("12001", "Bhopal Shatabdi",             ["DEL-BOM"]),
        ("12002", "New Delhi Shatabdi",          ["BOM-DEL"]),
        ("12301", "Howrah Rajdhani",             ["DEL-CCU", "CCU-DEL"]),
        ("12302", "Kolkata Rajdhani",            ["CCU-DEL", "DEL-CCU"]),
        ("12626", "Kerala Express",              ["DEL-COK", "COK-DEL"]),
        ("12625", "Kerala Express Up",           ["COK-DEL", "DEL-COK"]),
        ("22691", "Rajdhani Express",            ["BLR-DEL", "DEL-BLR"]),
        ("22692", "Bangalore Rajdhani",          ["DEL-BLR", "BLR-DEL"]),
        ("12954", "Golden Temple Mail",          ["BOM-DEL", "DEL-BOM"]),
        ("11301", "Udyan Express",               ["BOM-BLR", "BLR-BOM"]),
        ("11302", "Udyan Express Return",        ["BLR-BOM", "BOM-BLR"]),
        ("12123", "Deccan Queen",                ["BOM-PNQ", "PNQ-BOM"]),
        ("12124", "Deccan Queen Return",         ["PNQ-BOM", "BOM-PNQ"]),
        ("12017", "Shatabdi Express",            ["DEL-AMD", "AMD-DEL"]),
        ("12018", "Shatabdi Return",             ["AMD-DEL", "DEL-AMD"]),
        ("22119", "Mumbai-Madurai Express",      ["BOM-MAA", "MAA-BOM"]),
        ("22120", "Madurai-Mumbai Express",      ["MAA-BOM", "BOM-MAA"]),
        ("16031", "Andaman Express",             ["MAA-BOM"]),
        ("12225", "Kaifiyaat Express",           ["DEL-LKO", "LKO-DEL"]),
        ("12226", "Kaifiyaat Express Return",    ["LKO-DEL", "DEL-LKO"]),
        ("12309", "Rajdhani Express",            ["DEL-HYD", "HYD-DEL"]),
        ("12310", "Rajdhani Express Return",     ["HYD-DEL", "DEL-HYD"]),
        ("22222", "Hazrat Nizamuddin Exp",       ["DEL-BOM", "BOM-DEL"]),
        ("12721", "Dakshin Express",             ["DEL-HYD", "HYD-DEL"]),
        ("12722", "Dakshin Express Return",      ["HYD-DEL", "DEL-HYD"]),
        ("12163", "Chennai Egmore Express",      ["MAA-BLR", "BLR-MAA"]),
        ("12164", "Chennai Egmore Return",       ["BLR-MAA", "MAA-BLR"]),
        ("12611", "Nellai Express",              ["MAA-COK", "COK-MAA"]),
        ("12612", "Nellai Return",               ["COK-MAA", "MAA-COK"]),
        ("12431", "Thiruvananthapuram Rajdhani", ["DEL-COK"]),
        ("12432", "Hazrat Nizamuddin Rajdhani",  ["COK-DEL"]),
        ("12915", "Ashram Express",              ["AMD-DEL", "DEL-AMD"]),
        ("12916", "Ashram Express Return",       ["DEL-AMD", "AMD-DEL"]),
        ("22945", "Saurashtra Mail",             ["BOM-AMD", "AMD-BOM"]),
        ("22946", "Saurashtra Mail Return",      ["AMD-BOM", "BOM-AMD"]),
        ("12559", "Shiv Ganga Express",          ["DEL-LKO", "LKO-DEL"]),
        ("12560", "Shiv Ganga Return",           ["LKO-DEL", "DEL-LKO"]),
    ];

    // Route-specific durations in minutes
    private static readonly Dictionary<string, int> RouteDuration = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BOM-DEL"] = 960, ["DEL-BOM"] = 960,
        ["BOM-BLR"] = 780, ["BLR-BOM"] = 780,
        ["BOM-HYD"] = 540, ["HYD-BOM"] = 540,
        ["BOM-MAA"] = 810, ["MAA-BOM"] = 810,
        ["BOM-COK"] = 990, ["COK-BOM"] = 990,
        ["BOM-CCU"] = 1560,["CCU-BOM"] = 1560,
        ["BOM-AMD"] = 330, ["AMD-BOM"] = 330,
        ["BOM-PNQ"] = 195, ["PNQ-BOM"] = 195,
        ["DEL-BLR"] = 1680,["BLR-DEL"] = 1680,
        ["DEL-HYD"] = 1140,["HYD-DEL"] = 1140,
        ["DEL-CCU"] = 1440,["CCU-DEL"] = 1440,
        ["DEL-MAA"] = 1620,["MAA-DEL"] = 1620,
        ["DEL-AMD"] = 570, ["AMD-DEL"] = 570,
        ["DEL-COK"] = 2160,["COK-DEL"] = 2160,
        ["DEL-LKO"] = 390, ["LKO-DEL"] = 390,
        ["BLR-MAA"] = 360, ["MAA-BLR"] = 360,
        ["BLR-HYD"] = 600, ["HYD-BLR"] = 600,
        ["BLR-COK"] = 600, ["COK-BLR"] = 600,
        ["MAA-HYD"] = 540, ["HYD-MAA"] = 540,
        ["MAA-COK"] = 660, ["COK-MAA"] = 660,
        ["CCU-BLR"] = 1800,["BLR-CCU"] = 1800,
    };

    private static readonly string[] ClassNames = ["SL", "3A", "2A", "1A", "CC"];
    // Base prices indexed same as ClassNames; will be scaled by distance factor
    private static readonly decimal[] BasePrices = [350m, 950m, 1400m, 2600m, 650m];

    private static readonly string[] AvailStates = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "WL-3", "WL-8", "RAC-2"];
    private static readonly string[] RunDayOptions =
        ["Daily", "Daily", "Mon, Wed, Fri, Sun", "Tue, Thu, Sat", "Mon, Tue, Wed, Thu, Fri", "Sat, Sun"];

    public (List<TrainDto> Items, int Total) Search(TrainSearchRequest req)
    {
        var routeKey = $"{req.Origin[..Math.Min(3, req.Origin.Length)]}-{req.Destination[..Math.Min(3, req.Destination.Length)]}".ToUpper();
        var seed     = HashCode.Combine(req.Origin, req.Destination, req.TravelDate.DayOfYear);
        var rng      = new Random(seed);

        var baseDur = RouteDuration.TryGetValue(routeKey, out var d) ? d : rng.Next(180, 1800);
        // Price factor proportional to distance
        var priceFactor = Math.Max(0.5m, baseDur / 600m);

        var count  = rng.Next(6, 15);
        var trains = new List<TrainDto>(count);

        // Shuffle available train names
        var shuffled = TrainPool.OrderBy(_ => rng.Next()).ToArray();

        for (int i = 0; i < count; i++)
        {
            var t        = shuffled[i % shuffled.Length];
            var hour     = rng.Next(4, 23);
            var dur      = baseDur + rng.Next(-30, 60);
            var dep      = req.TravelDate.Date.AddHours(hour).AddMinutes(rng.Next(0, 4) * 15);
            var arr      = dep.AddMinutes(dur);
            var runDays  = RunDayOptions[rng.Next(RunDayOptions.Length)];

            var classes = new Dictionary<string, TrainClassDto>();
            for (int c = 0; c < ClassNames.Length; c++)
            {
                var cls    = ClassNames[c];
                var seats  = rng.Next(0, 60);
                var price  = Math.Round(BasePrices[c] * priceFactor + rng.Next(-100, 200), 0);
                string av;
                if (seats == 0)
                    av = "REGRET";
                else if (seats < 5)
                    av = $"WL-{rng.Next(1, 20)}";
                else if (seats < 12)
                    av = $"RAC-{rng.Next(1, 10)}";
                else
                    av = AvailStates[rng.Next(AvailStates.Length)];

                classes[cls] = new TrainClassDto(cls, seats, price, av);
            }

            trains.Add(new TrainDto(
                Id:              $"TRAIN_{t.Number}_{req.TravelDate:yyyyMMdd}_{i}",
                TrainNumber:     t.Number,
                TrainName:       t.Name,
                Origin:          req.Origin,
                Destination:     req.Destination,
                DepartureTime:   dep,
                ArrivalTime:     arr,
                DurationMinutes: dur,
                Classes:         classes,
                RunsOnDate:      true,
                RunningDays:     runDays,
                AvailableSeats:  classes.TryGetValue(req.Class, out var cl) ? cl.AvailableSeats : 0,
                IsTatkal:        rng.Next(6) == 0
            ));
        }

        var total = trains.Count;
        var paged = trains
            .OrderBy(t => t.DepartureTime)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToList();
        return (paged, total);
    }
}
